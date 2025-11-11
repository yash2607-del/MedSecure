import { io } from "socket.io-client";

let socket;

export function connectSocket(token) {
  if (socket) return socket;
  socket = io("http://localhost:5000", {
    transports: ["websocket"],
    autoConnect: true,
  });
  socket.on("connect", () => {
    socket.emit("register", { token });
  });
  return socket;
}

export function getSocket() {
  return socket;
}
