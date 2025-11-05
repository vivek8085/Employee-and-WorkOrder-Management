import { io } from "socket.io-client";

export const socket = io("https://employee-and-workorder-management-s71h.onrender.com", {
  transports: ["websocket"],
});
