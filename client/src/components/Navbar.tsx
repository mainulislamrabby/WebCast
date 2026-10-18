import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  FiCast,
  FiShare2,
  FiTv,
  FiSettings,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { socket, getStoredServerUrl, updateServerUrl } from "../services/socket";

const Navbar = () => {
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getStoredServerUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const handleSaveServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrlInput.trim()) return;
    updateServerUrl(serverUrlInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowSettings(false);
    }, 1200);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 shadow-lg shadow-blue-500/25">
              <FiCast className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Web<span className="text-blue-400">Cast</span>
                </span>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  P2P
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1">
            <Link
              to="/"
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive("/")
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Overview
            </Link>
            <Link
              to="/sender"
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive("/sender")
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FiShare2 className="h-3.5 w-3.5" />
              Share Screen
            </Link>
            <Link
              to="/receiver"
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive("/receiver")
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FiTv className="h-3.5 w-3.5" />
              Receive Screen
            </Link>
          </nav>

          {/* Actions & Status */}
          <div className="flex items-center gap-3">
            {/* Live Socket Status */}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${
                isConnected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
              }`}
              title={
                isConnected
                  ? "Connected to signaling server"
                  : "Reconnecting to signaling server..."
              }
            >
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  <span className="hidden sm:inline">Reconnecting</span>
                </>
              )}
            </div>

            {/* Server Settings button */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 transition hover:border-slate-700 hover:text-white"
              title="Server Configuration"
            >
              <FiSettings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold text-lg">
                <FiSettings className="text-blue-400" />
                Signaling Server Setup
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServer} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Signaling WebSocket URL
                </label>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  placeholder="e.g. http://192.168.1.100:5000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Tip: If accessing from your TV or mobile on the same Wi-Fi, ensure this matches your computer&apos;s LAN IP.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const defaultUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
                    setServerUrlInput(defaultUrl);
                  }}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Reset to Auto-Detect
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    {savedSuccess ? (
                      <>
                        <FiCheck /> Saved
                      </>
                    ) : (
                      "Apply & Reconnect"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
