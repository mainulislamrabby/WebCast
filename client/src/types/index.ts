export type WebRTCConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export type Role = "sender" | "receiver";

export interface StreamStats {
  resolution?: string;
  fps?: number;
  hasAudio: boolean;
  hasVideo: boolean;
  bytesReceived?: number;
  latencyMs?: number;
}

export interface StreamQualityPreset {
  label: string;
  id: "auto" | "1080p60" | "1080p30" | "720p30";
  width?: number;
  height?: number;
  frameRate?: number;
}
