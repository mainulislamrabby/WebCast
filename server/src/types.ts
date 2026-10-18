export interface Room {
  roomId: string;
  sender: string; // Socket ID of host / broadcaster
  receivers: Set<string>; // Socket IDs of viewers
  createdAt: number;
  lastActive: number;
  isSharing: boolean;
  maxReceivers: number;
}

export interface RoomPublicInfo {
  roomId: string;
  exists: boolean;
  hasSender: boolean;
  isSharing: boolean;
  receiverCount: number;
  maxReceivers: number;
  createdAt: number;
}

export interface ServerStats {
  uptimeSeconds: number;
  activeRooms: number;
  totalReceivers: number;
  totalRoomsCreated: number;
  nodeVersion: string;
  memoryUsageMb: number;
}
