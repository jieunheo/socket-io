const socket = io();

const $welcome = document.querySelector("#welcome");
const $welcomeForm = $welcome.querySelector("form");

const $room = document.querySelector("#room");
$room.hidden = true; // 숨기기

let roomName;

// 방 제목 보여주기
const setTitle = (count) => {
  const $roomName = document.querySelector("h3");
  $roomName.innerHTML = `Room: ${roomName} (${count})`;
};

// 채팅창으로 이동
const showRoom = () => {
  $welcome.hidden = true;
  $room.hidden = false;

  // msgForm에 event 설정
  const $msgForm = $room.querySelector("#msg");
  $msgForm.addEventListener("submit", handleMessageSend);
};

// 메세지 추가하기
const addMessage = (message) => {
  const $messageList = $room.querySelector("ul");
  const $message = document.createElement("li");
  $message.innerHTML = message;
  $messageList.append($message);
};

// 방 추가하기
const addRoom = (room) => {
  const $roomList = $welcome.querySelector("ul");
  const $room = document.createElement("li");
  $room.innerHTML = room;
  $roomList.append($room);
};

// 방 만들기/방 들어가기
const handleRoomSubmit = (event) => {
  event.preventDefault();

  // 방 이름 적용하기
  const $nameInput = $welcomeForm.querySelector("#name");
  const $roomNumInput = $welcomeForm.querySelector("#room-num");

  const name = $nameInput.value; // 닉네임
  roomName = $roomNumInput.value; // 내 방 이름
  socket.emit("enter_room", name, roomName, showRoom); // 백엔드로 보내기
  $nameInput.value = ""; // input 초기화
  $roomNumInput.value = ""; // input 초기화
};

// 메세지 보내기
const handleMessageSend = (event) => {
  event.preventDefault();

  // 메세지 내용 backend로 보내기
  const $input = $room.querySelector("#msg input");
  socket.emit("new_message", roomName, $input.value, () => {
    // 내 메세지 창에 메세지 추가하기
    addMessage(`you: ${$input.value}`);
    $input.value = "";
  });
};

$welcomeForm.addEventListener("submit", handleRoomSubmit);

/* socket */
socket.on("enter_room_message", (nickname) => {
  addMessage(`${nickname}님이 입장하셨습니다.`);
});

socket.on("get_message", (nickname, message) => {
  addMessage(`${nickname}: ${message}`);
});

socket.on("leave_room_message", (nickname, newCount) => {
  setTitle(newCount);
  addMessage(`${nickname}님이 퇴장하셨습니다.`);
});

socket.on("room_change", (rooms) => {
  $welcome.querySelector("ul").innerHTML = "";
  rooms.forEach((room) => {
    addRoom(room);
  });
});

socket.on("count_user", (newCount) => {
  setTitle(newCount);
});
