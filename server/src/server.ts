import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { setupSocket } from "./socket.js";
import { getLocalIpAddresses, getPrimaryLocalIp } from "./utils/network.js";
import {
  getPublicRoomInfo,
  getAllActiveRooms,
  getRoomStats,
} from "./roomManager.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const startTime = Date.now();

// Middleware
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path !== "/health" && req.path !== "/api/health") {
      console.log(
        `[HTTP] ${req.method} ${req.originalUrl} ${_res.statusCode} - ${duration}ms`
      );
    }
  });
  next();
});

// Root information endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "WebCast Signaling & Media Relay Server",
    version: "1.0.0",
    status: "online",
    documentation: {
      health: "/api/health",
      network: "/api/network-info",
      rooms: "/api/rooms",
      roomCheck: "/api/rooms/:roomId",
      stats: "/api/stats",
    },
  });
});

// System Health & Uptime
app.get(["/health", "/api/health"], (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const stats = getRoomStats();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    activeRooms: stats.activeRooms,
    totalReceivers: stats.totalReceivers,
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    nodeVersion: process.version,
  });
});

// Local Network IPv4 Discovery
app.get("/api/network-info", (_req: Request, res: Response) => {
  const interfaces = getLocalIpAddresses();
  const primaryIp = getPrimaryLocalIp();

  res.json({
    port: PORT,
    primaryIp,
    primaryUrl: `http://${primaryIp}:${PORT}`,
    interfaces: interfaces.map((i) => ({
      ...i,
      url: `http://${i.address}:${PORT}`,
    })),
  });
});

// Query active public rooms
app.get("/api/rooms", (_req: Request, res: Response) => {
  const rooms = getAllActiveRooms();
  res.json({
    count: rooms.length,
    rooms,
  });
});

// Check single room status
app.get("/api/rooms/:roomId", (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!roomId || typeof roomId !== "string") {
    res.status(400).json({ error: "Invalid roomId parameter." });
    return;
  }

  const roomInfo = getPublicRoomInfo(roomId);
  if (!roomInfo.exists) {
    res.status(404).json({
      exists: false,
      message: "Room not found or has been closed by host.",
    });
    return;
  }

  res.json(roomInfo);
});

// Server Statistics
app.get("/api/stats", (_req: Request, res: Response) => {
  const stats = getRoomStats();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.json({
    ...stats,
    uptimeSeconds,
  });
});

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found." });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[WebCast Server Error]", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// HTTP & Socket Server
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
  pingTimeout: 30000,
  pingInterval: 15000,
});

setupSocket(io);

httpServer.listen(PORT, "0.0.0.0", () => {
  const primaryIp = getPrimaryLocalIp();
  console.log("=========================================");
  console.log("   🚀 WebCast Server is Running!         ");
  console.log(`   ➜ Local:   http://localhost:${PORT}   `);
  console.log(`   ➜ Network: http://${primaryIp}:${PORT}`);
  console.log("=========================================");
});

// Graceful Shutdown
const handleShutdown = (signal: string) => {
  console.log(`\n[WebCast] Received ${signal}. Shutting down gracefully...`);
  io.close(() => {
    console.log("[WebCast] WebSockets closed.");
    httpServer.close(() => {
      console.log("[WebCast] HTTP Server closed. Bye!");
      process.exit(0);
    });
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));