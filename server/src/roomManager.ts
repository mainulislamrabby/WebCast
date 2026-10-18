import type { Room, RoomPublicInfo } from "./types.js";

const rooms = new Map<string, Room>();
let totalRoomsCreated = 0;

const DEFAULT_MAX_RECEIVERS = 8;
const ROOM_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

const generateRoomId = (): string => {
  let roomId = "";
  do {
    roomId = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(roomId));

  return roomId;
};

export const createRoom = (
  senderSocketId: string,
  options: { maxReceivers?: number } = {}
): Room => {
  const roomId = generateRoomId();
  const now = Date.now();

  const room: Room = {
    roomId,
    sender: senderSocketId,
    receivers: new Set<string>(),
    createdAt: now,
    lastActive: now,
    isSharing: false,
    maxReceivers: options.maxReceivers || DEFAULT_MAX_RECEIVERS,
  };

  rooms.set(roomId, room);
  totalRoomsCreated++;

  return room;
};

export const getRoom = (roomId: string): Room | undefined => {
  const room = rooms.get(roomId);
  if (room) {
    room.lastActive = Date.now();
  }
  return room;
};

export const addReceiver = (
  roomId: string,
  receiverSocketId: string
): { success: boolean; message?: string; room?: Room } => {
  const room = rooms.get(roomId);

  if (!room) {
    return { success: false, message: "Room not found." };
  }

  if (room.receivers.has(receiverSocketId)) {
    return { success: true, room };
  }

  if (room.receivers.size >= room.maxReceivers) {
    return {
      success: false,
      message: `Room is full (maximum ${room.maxReceivers} viewers).`,
    };
  }

  room.receivers.add(receiverSocketId);
  room.lastActive = Date.now();

  return { success: true, room };
};

export const removeReceiver = (
  roomId: string,
  receiverSocketId: string
): boolean => {
  const room = rooms.get(roomId);
  if (!room) return false;

  const deleted = room.receivers.delete(receiverSocketId);
  if (deleted) {
    room.lastActive = Date.now();
  }
  return deleted;
};

export const setStreamStatus = (
  roomId: string,
  isSharing: boolean
): Room | null => {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.isSharing = isSharing;
  room.lastActive = Date.now();
  return room;
};

export interface SocketRemovalResult {
  closedRooms: { roomId: string; receivers: string[] }[];
  leftRooms: { roomId: string; sender: string; remainingReceivers: number }[];
}

export const removeSocketFromRoom = (socketId: string): SocketRemovalResult => {
  const result: SocketRemovalResult = {
    closedRooms: [],
    leftRooms: [],
  };

  for (const [roomId, room] of rooms.entries()) {
    if (room.sender === socketId) {
      // Host left: close the room
      result.closedRooms.push({
        roomId,
        receivers: Array.from(room.receivers),
      });
      rooms.delete(roomId);
    } else if (room.receivers.has(socketId)) {
      // Viewer left: remove from room
      room.receivers.delete(socketId);
      result.leftRooms.push({
        roomId,
        sender: room.sender,
        remainingReceivers: room.receivers.size,
      });
    }
  }

  return result;
};

export const getPublicRoomInfo = (roomId: string): RoomPublicInfo => {
  const room = rooms.get(roomId);
  if (!room) {
    return {
      roomId,
      exists: false,
      hasSender: false,
      isSharing: false,
      receiverCount: 0,
      maxReceivers: DEFAULT_MAX_RECEIVERS,
      createdAt: 0,
    };
  }

  return {
    roomId: room.roomId,
    exists: true,
    hasSender: Boolean(room.sender),
    isSharing: room.isSharing,
    receiverCount: room.receivers.size,
    maxReceivers: room.maxReceivers,
    createdAt: room.createdAt,
  };
};

export const getAllActiveRooms = (): RoomPublicInfo[] => {
  return Array.from(rooms.values()).map((room) => ({
    roomId: room.roomId,
    exists: true,
    hasSender: Boolean(room.sender),
    isSharing: room.isSharing,
    receiverCount: room.receivers.size,
    maxReceivers: room.maxReceivers,
    createdAt: room.createdAt,
  }));
};

export const getRoomStats = () => {
  let totalReceivers = 0;
  for (const room of rooms.values()) {
    totalReceivers += room.receivers.size;
  }

  return {
    activeRooms: rooms.size,
    totalReceivers,
    totalRoomsCreated,
  };
};

// Periodic garbage collection for inactive rooms
export const cleanupStaleRooms = (): number => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActive > ROOM_TIMEOUT_MS) {
      rooms.delete(roomId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[WebCast GC] Cleaned up ${cleanedCount} idle room(s).`);
  }

  return cleanedCount;
};