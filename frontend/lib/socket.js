import { API_URL } from "./api";

let socketPromise;

// Bundle optimization: socket.io-client is loaded with a dynamic import(),
// so it becomes a separate chunk that is NOT part of the initial page JavaScript.
// The page renders first, then the real-time library is downloaded.
export function getSocket() {
  if (!socketPromise) {
    socketPromise = import("socket.io-client").then(({ io }) =>
      io(API_URL, { transports: ["websocket", "polling"] })
    );
  }
  return socketPromise;
}
