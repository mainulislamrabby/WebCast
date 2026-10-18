import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import {
  FiTv,
  FiArrowLeft,
  FiPlay,
  FiClock,
  FiAlertCircle,
  FiRadio,
  FiDelete,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { socket } from "../services/socket";
import useWebRTC from "../hooks/useWebRTC";
import VideoPlayer from "../components/VideoPlayer";

const RECENT_ROOMS_KEY = "webcast_recent_rooms";

const Receiver = () => {
  const [searchParams] = useSearchParams();
  const urlRoomCode = searchParams.get("code") || searchParams.get("room") || "";

  const [roomId, setRoomId] = useState(urlRoomCode);
  const [joinedRoom, setJoinedRoom] = useState("");
  const [statusText, setStatusText] = useState("");
  const [recentRooms, setRecentRooms] = useState<string[]>([]);
  const [showKeypad, setShowKeypad] = useState(false);

  // Load recent rooms from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_ROOMS_KEY);
      if (saved) {
        setRecentRooms(JSON.parse(saved).slice(0, 4));
      }
    } catch (e) {
      console.warn("Failed to load recent rooms:", e);
    }
  }, []);

  const saveRoomToRecent = (code: string) => {
    try {
      const updated = [code, ...recentRooms.filter((r) => r !== code)].slice(0, 4);
      setRecentRooms(updated);
      localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save room:", e);
    }
  };

  const { connectionState, remoteStream, disconnect } = useWebRTC(
    joinedRoom,
    "receiver"
  );

  const handleJoin = useCallback((targetRoomId?: string) => {
    const codeToJoin = (targetRoomId || roomId).trim();
    if (codeToJoin.length < 4) {
      setStatusText("Please enter a valid room code.");
      return;
    }

    setStatusText("Connecting to session...");
    socket.emit("join-room", codeToJoin);
  }, [roomId]);

  // Handle URL code auto-join
  useEffect(() => {
    if (urlRoomCode && urlRoomCode.length >= 4 && !joinedRoom) {
      handleJoin(urlRoomCode);
    }
  }, [urlRoomCode, handleJoin, joinedRoom]);

  useEffect(() => {
    const handleRoomJoined = ({ roomId: joinedId }: { roomId: string }) => {
      setJoinedRoom(joinedId);
      setStatusText("Joined room. Waiting for host display...");
      saveRoomToRecent(joinedId);
      toast.success(`Joined room ${joinedId}`);
    };

    const handleJoinError = ({ message }: { message: string }) => {
      setStatusText(message);
      toast.error(message);
    };

    socket.on("room-joined", handleRoomJoined);
    socket.on("join-room-error", handleJoinError);

    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("join-room-error", handleJoinError);
    };
  }, [recentRooms]);

  const handleDisconnect = () => {
    disconnect();
    setJoinedRoom("");
    setStatusText("");
    toast.info("Session closed.");
  };

  const handleKeypadPress = (val: string) => {
    if (val === "back") {
      setRoomId((prev) => prev.slice(0, -1));
    } else if (roomId.length < 6) {
      setRoomId((prev) => prev + val);
    }
  };

  // If connected and receiving video stream, show VideoPlayer
  if (joinedRoom && remoteStream) {
    return (
      <VideoPlayer
        stream={remoteStream}
        onDisconnect={handleDisconnect}
        roomCode={joinedRoom}
      />
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-cyber-grid pb-20">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient" />

      <main className="relative mx-auto max-w-lg px-4 pt-10 sm:px-6">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white mb-6"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Overview
        </Link>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-4">
              <FiTv className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Receive Screen
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Enter the 6-digit session code displayed on the sender&apos;s screen
            </p>
          </div>

          {/* Form */}
          <div className="mt-8">
            <label
              htmlFor="roomCodeInput"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center"
            >
              Session Room Code
            </label>

            <div className="relative">
              <input
                id="roomCodeInput"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                maxLength={6}
                disabled={Boolean(joinedRoom)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-center text-3xl font-black tracking-[0.3em] text-blue-400 outline-none placeholder:text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono transition"
              />
            </div>

            {/* TV Keypad Toggle */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowKeypad(!showKeypad)}
                className="text-xs text-slate-400 hover:text-blue-400 transition underline underline-offset-4"
              >
                {showKeypad ? "Hide On-Screen Keypad" : "Show On-Screen Keypad (TV/Touch)"}
              </button>
            </div>

            {/* Touch / TV Numeric Keypad */}
            {showKeypad && (
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="flex h-11 items-center justify-center rounded-xl bg-slate-900 font-mono text-base font-bold text-white hover:bg-slate-800 active:scale-95 transition"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRoomId("")}
                  className="flex h-11 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress("0")}
                  className="flex h-11 items-center justify-center rounded-xl bg-slate-900 font-mono text-base font-bold text-white hover:bg-slate-800 active:scale-95 transition"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress("back")}
                  className="flex h-11 items-center justify-center rounded-xl bg-slate-900 text-base text-slate-300 hover:bg-slate-800 active:scale-95 transition"
                >
                  <FiDelete className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Join / Disconnect Button */}
            {!joinedRoom ? (
              <button
                type="button"
                onClick={() => handleJoin()}
                disabled={roomId.trim().length < 4}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
              >
                <FiPlay className="h-4 w-4" /> Connect to Display
              </button>
            ) : (
              <div className="mt-6 space-y-4">
                {/* Connecting Radar Indicator */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-6 text-center">
                  <div className="relative mb-3 flex h-12 w-12 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <FiRadio className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Connected to Room</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Waiting for the broadcaster to start screen transmission...
                  </p>
                  <span className="mt-2 font-mono text-xs text-indigo-300">
                    WebRTC State: {connectionState}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 py-3 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                >
                  Leave Room
                </button>
              </div>
            )}

            {/* Status / Error feedback */}
            {statusText && !joinedRoom && (
              <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                <FiAlertCircle className="text-blue-400" />
                <span>{statusText}</span>
              </div>
            )}

            {/* Recent Rooms */}
            {recentRooms.length > 0 && !joinedRoom && (
              <div className="mt-8 border-t border-slate-800/80 pt-6">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
                  <FiClock className="h-3.5 w-3.5 text-slate-500" />
                  Recent Rooms
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentRooms.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setRoomId(code);
                        handleJoin(code);
                      }}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-1.5 font-mono text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Receiver;
