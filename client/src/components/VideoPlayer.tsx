import { useEffect, useRef, useState, useCallback } from "react";
import {
  FiMaximize,
  FiMinimize,
  FiVolume2,
  FiVolumeX,
  FiAirplay,
  FiPower,
  FiActivity,
  FiInfo,
} from "react-icons/fi";

interface VideoPlayerProps {
  stream: MediaStream | null;
  onDisconnect: () => void;
  roomCode?: string;
}

const VideoPlayer = ({ stream, onDisconnect, roomCode }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [videoFit, setVideoFit] = useState<"contain" | "cover">("contain");
  const [streamInfo, setStreamInfo] = useState({
    width: 0,
    height: 0,
    hasAudio: false,
  });

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attach stream to video element
  useEffect(() => {
    if (!videoRef.current || !stream) return;

    videoRef.current.srcObject = stream;

    const checkTracks = () => {
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        const settings = videoTrack.getSettings();
        setStreamInfo({
          width: settings.width || 0,
          height: settings.height || 0,
          hasAudio: Boolean(audioTrack),
        });
      }
    };

    checkTracks();
    const interval = setInterval(checkTracks, 3000);
    return () => clearInterval(interval);
  }, [stream]);

  // Handle Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  }, []);

  // Handle Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP toggle failed:", err);
    }
  };

  // Auto-hide controls timer
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) {
        setShowControls(false);
      }
    }, 3500);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        setIsMuted((prev) => !prev);
      } else if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [toggleFullscreen, isFullscreen]);

  // Audio volume changes
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
    videoRef.current.muted = isMuted;
  }, [volume, isMuted]);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onDoubleClick={toggleFullscreen}
      className="group relative flex h-screen w-screen flex-col overflow-hidden bg-black select-none"
    >
      {/* Top Floating Badge (Room & Resolution) */}
      <div
        className={`absolute top-4 left-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-xs text-white backdrop-blur-md transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-semibold text-slate-200">Live Cast</span>
        {roomCode && (
          <span className="font-mono text-slate-400">| Room: {roomCode}</span>
        )}
        {streamInfo.width > 0 && (
          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-mono font-medium text-blue-300">
            {streamInfo.width}×{streamInfo.height}
          </span>
        )}
      </div>

      {/* Main Video Area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`h-full w-full ${
              videoFit === "contain" ? "object-contain" : "object-cover"
            }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 mb-4 animate-pulse">
              <FiAirplay className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Waiting for Display Stream
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-sm">
              The sender is preparing their screen share. The broadcast will start
              automatically.
            </p>
          </div>
        )}

        {/* Stream Stats Overlay HUD */}
        {showStats && (
          <div className="absolute top-16 left-4 z-30 w-64 rounded-xl border border-white/10 bg-black/85 p-4 text-xs font-mono text-slate-300 backdrop-blur-lg">
            <div className="font-bold text-white mb-2 flex items-center gap-1.5 border-b border-slate-700/60 pb-1.5">
              <FiActivity className="text-blue-400" /> WebRTC Stream Metrics
            </div>
            <div className="space-y-1 text-slate-400">
              <p>
                Resolution:{" "}
                <span className="text-emerald-400 font-semibold">
                  {streamInfo.width}×{streamInfo.height || "Auto"}
                </span>
              </p>
              <p>
                Audio Track:{" "}
                <span className={streamInfo.hasAudio ? "text-emerald-400" : "text-amber-400"}>
                  {streamInfo.hasAudio ? "Present" : "Disabled/None"}
                </span>
              </p>
              <p>Fit Mode: <span className="text-white capitalize">{videoFit}</span></p>
              <p>Shortcut: <span className="text-slate-300">F (Fullscreen), M (Mute)</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-4 rounded-2xl border border-white/15 bg-slate-950/85 px-4 sm:px-6 py-2.5 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          showControls
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`}
      >
        {/* Audio / Mute controls */}
        <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition"
            title={isMuted ? "Unmute (M)" : "Mute (M)"}
          >
            {isMuted || volume === 0 ? (
              <FiVolumeX className="h-5 w-5 text-red-400" />
            ) : (
              <FiVolume2 className="h-5 w-5 text-blue-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="h-1.5 w-16 sm:w-20 accent-blue-500 cursor-pointer rounded-lg bg-slate-700"
          />
        </div>

        {/* Fit mode toggle */}
        <button
          type="button"
          onClick={() => setVideoFit(videoFit === "contain" ? "cover" : "contain")}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition"
          title="Toggle Aspect Fit / Fill"
        >
          {videoFit === "contain" ? "Fit Screen" : "Fill Screen"}
        </button>

        {/* Stats Toggle */}
        <button
          type="button"
          onClick={() => setShowStats(!showStats)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            showStats
              ? "bg-blue-600/30 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:bg-white/10 hover:text-white"
          }`}
          title="Stream Info HUD"
        >
          <FiInfo className="h-4 w-4" />
        </button>

        {/* PiP Button */}
        {document.pictureInPictureEnabled && (
          <button
            type="button"
            onClick={togglePiP}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition"
            title="Picture-in-Picture"
          >
            <FiAirplay className="h-4 w-4" />
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition"
          title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
        >
          {isFullscreen ? (
            <FiMinimize className="h-5 w-5" />
          ) : (
            <FiMaximize className="h-5 w-5" />
          )}
        </button>

        {/* Disconnect Button */}
        <div className="border-l border-slate-800 pl-2">
          <button
            type="button"
            onClick={onDisconnect}
            className="flex items-center gap-1.5 rounded-xl bg-red-600/90 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 active:scale-95"
            title="Disconnect Stream"
          >
            <FiPower className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;