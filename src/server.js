import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

// 방 구하기
const publicRoom = () => {
  const {
    sockets: {
      adapter: { sids, rooms }
    }
  } = wsServer;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
};

// 방에 있는 사람 수 구하기
const countUser = (roomName) => {
  const count = wsServer.sockets.adapter.rooms.get(roomName)?.size;
  console.log(`방 인원: ${count}`);
  return count;
};

// ws 연결
wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";

  socket.onAny((event) => {
    console.log(`got ${event}`);
  });

  // 방 입장
  socket.on("enter_room", (nickname, roomName, showRoom) => {
    socket["nickname"] = nickname;
    socket.join(roomName);
    // console.log(socket.rooms); // { socket.id, roomName }

    socket.to(roomName).emit("enter_room_message", socket.nickname); // 방 설정
    wsServer.to(roomName).emit("count_user", countUser(roomName)); // 인원 수 찾기
    showRoom(); // 방 보이는 함수

    // 방 수정된 경우
    wsServer.sockets.emit("room_change", publicRoom());
  });

  // 새 메세지
  socket.on("new_message", (roomName, message, showMessage) => {
    socket.to(roomName).emit("get_message", socket.nickname, message);
    showMessage();
  });

  // 방 나가기 직전
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket
        .to(room)
        .emit("leave_room_message", socket.nickname, countUser(room) - 1)
    );
  });

  // 방 나간 후
  socket.on("disconnect", () => {
    // 방이 사라졌는지 확인
    wsServer.sockets.emit("room_change", publicRoom());
  });
});

const handleListen = () => {
  console.log(`Listening on http://localhost:3000`);
  wsServer.sockets.emit("room_change", publicRoom());
};
httpServer.listen(process.env.PORT, handleListen);
