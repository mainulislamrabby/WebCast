import { getStoredServerUrl } from "./socket";

export interface NetworkInfoResponse {
  port: number;
  primaryIp: string;
  primaryUrl: string;
  interfaces: {
    name: string;
    address: string;
    family: string;
    url: string;
  }[];
}

export interface HealthResponse {
  status: string;
  uptimeSeconds: number;
  activeRooms: number;
  totalReceivers: number;
  memory: {
    rssMb: number;
    heapUsedMb: number;
  };
}

export interface RoomStatusResponse {
  roomId: string;
  exists: boolean;
  hasSender: boolean;
  isSharing: boolean;
  receiverCount: number;
  maxReceivers: number;
}

export const fetchNetworkInfo = async (): Promise<NetworkInfoResponse | null> => {
  try {
    const serverUrl = getStoredServerUrl();
    const res = await fetch(`${serverUrl}/api/network-info`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch network info:", err);
    return null;
  }
};

export const checkRoomStatus = async (
  roomId: string
): Promise<RoomStatusResponse | null> => {
  try {
    const serverUrl = getStoredServerUrl();
    const res = await fetch(`${serverUrl}/api/rooms/${roomId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Failed to check room status:", err);
    return null;
  }
};

export const fetchServerHealth = async (): Promise<HealthResponse | null> => {
  try {
    const serverUrl = getStoredServerUrl();
    const res = await fetch(`${serverUrl}/api/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};
