import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import {
  FiCopy,
  FiCheck,
  FiShare2,
  FiStopCircle,
  FiPower,
  FiVolume2,
  FiMonitor,
  FiArrowLeft,
  FiRadio,
  FiAlertCircle,
  FiEye,
} from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { toast } from "react-toastify";
import { socket } from "../services/socket";
import useWebRTC from "../hooks/useWebRTC";
import QRCodeModal from "../components/QRCodeModal";
import { fetchNetworkInfo, type NetworkInfoResponse } from "../services/api";

const Sender = () => {
  const [roomId, setRoomId] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [enableAudio, setEnableAudio] = useState(true);
  const [receiverConnected, setReceiverConnected] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const {
    connectionState,
    screenStream,
    isScreenSharing,
    streamResolution,
    hasAudioTrack,
    errorMessage,
    startScreenShare,
    stopScreenShare,
    disconnect,
  } = useWebRTC(roomId, "sender", { enableAudio });

  // Attach screen preview
  useEffect(() => {
    if (previewVideoRef.current && screenStream) {
      previewVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Handle room creation
  const handleCreateRoom = () => {
    setIsCreatingRoom(true);
    socket.emit("create-room");
  };

  useEffect(() => {
    const handleRoomCreated = ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
      setIsCreatingRoom(false);
      toast.info(`Room created: ${roomId}`);
    };

    const handleReceiverJoined = () => {
      setReceiverConnected(true);
      toast.success("Receiver device connected to room!");
    };

    const handlePeerDisconnected = () => {
      setReceiverConnected(false);
      toast.warn("Receiver device disconnected.");
    };

    socket.on("room-created", handleRoomCreated);
    socket.on("receiver-joined", handleReceiverJoined);
    socket.on("peer-disconnected", handlePeerDisconnected);

    fetchNetworkInfo().then((info) => {
      if (info) setNetworkInfo(info);
    });

    return () => {
      socket.off("room-created", handleRoomCreated);
      socket.off("receiver-joined", handleReceiverJoined);
      socket.off("peer-disconnected", handlePeerDisconnected);
    };
  }, []);

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getDirectLink = () => {
    if (typeof window === "undefined") return "";
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    if ((host === "localhost" || host === "127.0.0.1") && networkInfo?.primaryIp) {
      return `${protocol}//${networkInfo.primaryIp}${port}/receiver?code=${roomId}`;
    }
    return `${window.location.origin}/receiver?code=${roomId}`;
  };

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = getDirectLink();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Direct link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFullDisconnect = () => {
    disconnect();
    setRoomId("");
    setReceiverConnected(false);
    toast.info("Room closed.");
  };

  const getConnectionBadge = () => {
    switch (connectionState) {
      case "connected":
        return {
          label: "Broadcasting Active",
          color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
          pulse: "bg-emerald-400",
        };
      case "connecting":
        return {
          label: "Establishing Connection...",
          color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
          pulse: "bg-blue-400",
        };
      case "failed":
        return {
          label: "Connection Failed",
          color: "border-red-500/30 bg-red-500/10 text-red-400",
          pulse: "bg-red-400",
        };
      default:
        return receiverConnected
          ? {
              label: "Receiver Ready (Pick Screen)",
              color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
              pulse: "bg-indigo-400",
            }
          : {
              label: "Waiting for Receiver",
              color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
              pulse: "bg-amber-400",
            };
    }
  };

  const badge = getConnectionBadge();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-cyber-grid pb-20">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient" />

      <main className="relative mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white mb-6"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Overview
        </Link>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <FiRadio className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Screen Broadcaster
                  </h1>
                  <p className="text-xs text-slate-400">
                    Host a wireless display stream for other devices
                  </p>
                </div>
              </div>
            </div>

            {roomId && (
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium self-start sm:self-auto ${badge.color}`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${badge.pulse}`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${badge.pulse}`}
                  />
                </span>
                <span>{badge.label}</span>
              </div>
            )}
          </div>

          {/* Initial State: Create Room */}
          {!roomId ? (
            <div className="mt-8 text-center max-w-md mx-auto py-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mb-6">
                <FiMonitor className="h-10 w-10" />
              </div>

              <h2 className="text-xl font-bold text-white">Create a Cast Session</h2>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Generate a unique room code that target screens (TVs, laptops, phones) can
                connect to.
              </p>

              {/* Options */}
              <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-left">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableAudio}
                    onChange={(e) => setEnableAudio(e.target.checked)}
                    className="checkbox checkbox-primary checkbox-xs"
                  />
                  <span className="flex items-center gap-1.5">
                    <FiVolume2 className="text-blue-400" /> Share System / Tab Audio
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-xl shadow-blue-600/25 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <FiShare2 className="h-4 w-4" />
                {isCreatingRoom ? "Generating Session Code..." : "Create Casting Room"}
              </button>
            </div>
          ) : (
            /* Active Room State */
            <div className="mt-8 space-y-8">
              {/* Room Code Display Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center shadow-inner">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Target Device Session Code
                </p>

                {/* 6 Digit Split Box */}
                <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
                  {roomId.split("").map((digit, index) => (
                    <div
                      key={index}
                      className="flex h-14 w-11 sm:h-16 sm:w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-2xl sm:text-3xl font-black text-blue-400 shadow-md font-mono"
                    >
                      {digit}
                    </div>
                  ))}
                </div>

                {/* Code Sharing Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    {copiedCode ? (
                      <>
                        <FiCheck className="text-emerald-400" /> Copied Code
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy Code
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    {copiedLink ? (
                      <>
                        <FiCheck className="text-emerald-400" /> Copied URL
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy Direct Join Link
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQR(true)}
                    className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
                  >
                    <BsQrCode className="h-4 w-4" /> Scan with TV / Mobile QR
                  </button>
                </div>
              </div>

              {/* Stream Controls */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <FiMonitor className="text-blue-400" /> Stream Controls
                </h3>

                <div className="flex flex-wrap items-center gap-3">
                  {!isScreenSharing ? (
                    <button
                      type="button"
                      onClick={startScreenShare}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]"
                    >
                      <FiShare2 className="h-4 w-4" />
                      Choose Display & Start Stream
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopScreenShare}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 py-3 px-6 text-sm font-bold text-amber-400 transition hover:bg-amber-500/30"
                    >
                      <FiStopCircle className="h-4 w-4" />
                      Pause / Stop Sharing
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleFullDisconnect}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 px-5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                  >
                    <FiPower className="h-4 w-4" /> End Session
                  </button>
                </div>

                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Live Preview Window when screen sharing */}
              {isScreenSharing && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <FiEye className="text-emerald-400" />
                      Live Stream Preview
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {streamResolution && (
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-300 font-mono">
                          {streamResolution}
                        </span>
                      )}
                      <span
                        className={`rounded-md px-2 py-0.5 font-medium ${
                          hasAudioTrack
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {hasAudioTrack ? "Audio On" : "Audio Off"}
                      </span>
                    </div>
                  </div>

                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-black">
                    <video
                      ref={previewVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* QR Code Modal for TV / Mobile */}
      <QRCodeModal
        roomId={roomId}
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        lanIp={networkInfo?.primaryIp}
      />
    </div>
  );
};

export default Sender;
