import { io, Socket } from "socket.io-client";

export const getStoredServerUrl = (): string => {
  if (typeof window === "undefined") return "http://localhost:5000";

  const savedUrl = localStorage.getItem("webcast_server_url");
  if (savedUrl) return savedUrl;

  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  // Automatically use the current hostname with port 5000
  const host = window.location.hostname || "localhost";
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}:5000`;
};

export const socket: Socket = io(getStoredServerUrl(), {
  autoConnect: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1500,
  transports: ["websocket", "polling"],
});

export const updateServerUrl = (newUrl: string) => {
  const cleanUrl = newUrl.trim().replace(/\/$/, "");
  localStorage.setItem("webcast_server_url", cleanUrl);
  socket.disconnect();
  // @ts-expect-error socket.io uri update
  socket.io.uri = cleanUrl;
  socket.connect();
};