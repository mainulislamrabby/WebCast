import { Server, Socket } from "socket.io";
import {
  addReceiver,
  createRoom,
  getRoom,
  removeSocketFromRoom,
  setStreamStatus,
  cleanupStaleRooms,
} from "./roomManager.js";

// Clean idle rooms every 30 minutes
setInterval(() => {
  cleanupStaleRooms();
}, 30 * 60 * 1000);

export const setupSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const clientIp = socket.handshake.address;
    console.log(`[WebCast Socket] Client connected: ${socket.id} (${clientIp})`);

    // Ping / Pong for latency measurement
    socket.on("ping-check", (data?: { clientTime?: number }) => {
      socket.emit("pong-check", {
        clientTime: data?.clientTime || Date.now(),
        serverTime: Date.now(),
      });
    });

    // Create Room
    socket.on("create-room", (options?: { maxReceivers?: number }) => {
      const room = createRoom(socket.id, options);

      socket.join(room.roomId);
      socket.data.roomId = room.roomId;
      socket.data.role = "sender";

      socket.emit("room-created", {
        roomId: room.roomId,
        maxReceivers: room.maxReceivers,
      });

      console.log(`[WebCast Socket] Room created: ${room.roomId} by ${socket.id}`);
    });

    // Join Room
    socket.on("join-room", (roomId: string) => {
      if (!roomId || typeof roomId !== "string") {
        socket.emit("join-room-error", { message: "Invalid room code." });
        return;
      }

      const cleanRoomId = roomId.trim();
      const result = addReceiver(cleanRoomId, socket.id);

      if (!result.success || !result.room) {
        socket.emit("join-room-error", {
          message: result.message || "Failed to join room.",
        });
        return;
      }

      const room = result.room;

      socket.join(cleanRoomId);
      socket.data.roomId = cleanRoomId;
      socket.data.role = "receiver";

      socket.emit("room-joined", {
        roomId: cleanRoomId,
        receiverCount: room.receivers.size,
        isSharing: room.isSharing,
      });

      // Notify sender that a receiver joined
      io.to(room.sender).emit("receiver-joined", {
        receiverId: socket.id,
        receiverCount: room.receivers.size,
      });

      console.log(
        `[WebCast Socket] Receiver ${socket.id} joined room ${cleanRoomId} (Total viewers: ${room.receivers.size})`
      );
    });

    // WebRTC Offer: Sender → Receiver(s)
    socket.on("webrtc-offer", (payload: any) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = getRoom(roomId);
      if (!room || room.sender !== socket.id) return;

      setStreamStatus(roomId, true);

      // Check if targeted to a specific receiver
      if (payload && payload.targetId && payload.offer) {
        io.to(payload.targetId).emit("webrtc-offer", payload.offer);
        console.log(
          `[WebCast WebRTC] Offer routed to receiver ${payload.targetId} in room ${roomId}`
        );
      } else {
        // Broadcast offer to all receivers in the room
        for (const receiverId of room.receivers) {
          io.to(receiverId).emit("webrtc-offer", payload);
        }
        console.log(
          `[WebCast WebRTC] Offer broadcast to ${room.receivers.size} receiver(s) in room ${roomId}`
        );
      }
    });

    // WebRTC Answer: Receiver → Sender
    socket.on("webrtc-answer", (payload: any) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = getRoom(roomId);
      if (!room) return;

      const answer = payload && payload.answer ? payload.answer : payload;
      io.to(room.sender).emit("webrtc-answer", {
        answer,
        receiverId: socket.id,
      });

      console.log(
        `[WebCast WebRTC] Answer routed from ${socket.id} to sender in room ${roomId}`
      );
    });

    // WebRTC ICE Candidate
    socket.on("webrtc-ice-candidate", (payload: any) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = getRoom(roomId);
      if (!room) return;

      if (socket.id === room.sender) {
        // Sender sending candidate to receiver(s)
        if (payload && payload.targetId && payload.candidate) {
          io.to(payload.targetId).emit("webrtc-ice-candidate", payload.candidate);
        } else {
          const candidate = payload && payload.candidate ? payload.candidate : payload;
          for (const receiverId of room.receivers) {
            io.to(receiverId).emit("webrtc-ice-candidate", candidate);
          }
        }
      } else if (room.receivers.has(socket.id)) {
        // Receiver sending candidate to sender
        const candidate = payload && payload.candidate ? payload.candidate : payload;
        io.to(room.sender).emit("webrtc-ice-candidate", {
          candidate,
          receiverId: socket.id,
        });
      }
    });

    // Stop Sharing
    socket.on("stop-sharing", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = getRoom(roomId);
      if (!room || room.sender !== socket.id) return;

      setStreamStatus(roomId, false);

      for (const receiverId of room.receivers) {
        io.to(receiverId).emit("peer-stopped-sharing");
      }

      console.log(`[WebCast Socket] Broadcaster stopped sharing in room ${roomId}`);
    });

    // Chat / Message reaction
    socket.on("chat-message", (messageData: { text: string; senderName?: string }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !messageData?.text) return;

      io.to(roomId).emit("chat-message", {
        text: messageData.text.slice(0, 500),
        senderName: messageData.senderName || (socket.data.role === "sender" ? "Host" : "Viewer"),
        senderId: socket.id,
        timestamp: Date.now(),
      });
    });

    // Explicit room leave
    socket.on("disconnect-room", () => {
      handleSocketRemoval(socket, io);
    });

    // Socket disconnection
    socket.on("disconnect", (reason) => {
      console.log(
        `[WebCast Socket] Client disconnected: ${socket.id} (Reason: ${reason})`
      );
      handleSocketRemoval(socket, io);
    });
  });
};

const handleSocketRemoval = (socket: Socket, io: Server) => {
  const roomId = socket.data.roomId;
  const removal = removeSocketFromRoom(socket.id);

  // If host left, notify all viewers that the host disconnected
  for (const closed of removal.closedRooms) {
    for (const receiverId of closed.receivers) {
      io.to(receiverId).emit("peer-disconnected", {
        reason: "Broadcaster closed the session.",
      });
    }
    console.log(
      `[WebCast Socket] Room ${closed.roomId} closed because host ${socket.id} left.`
    );
  }

  // If viewer left, notify host of updated count
  for (const left of removal.leftRooms) {
    io.to(left.sender).emit("receiver-left", {
      receiverId: socket.id,
      remainingReceivers: left.remainingReceivers,
    });
    console.log(
      `[WebCast Socket] Viewer ${socket.id} left room ${left.roomId} (${left.remainingReceivers} remaining)`
    );
  }

  if (roomId) {
    socket.leave(roomId);
    socket.data.roomId = undefined;
  }
};
