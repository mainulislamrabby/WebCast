import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  FiShare2,
  FiTv,
  FiZap,
  FiShield,
  FiMaximize2,
  FiVolume2,
  FiArrowRight,
  FiLayers,
} from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";

const Home = () => {
  const navigate = useNavigate();
  const [quickRoomCode, setQuickRoomCode] = useState("");

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = quickRoomCode.trim();
    if (cleanCode.length >= 4) {
      navigate(`/receiver?code=${cleanCode}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-cyber-grid pb-20">
      {/* Background Radial Glow */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient" />

      <main className="relative mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Version / P2P Status Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md mb-6 shadow-lg shadow-blue-500/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            Next-Gen Browser WebRTC Screen Mirroring
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Cast Your Screen{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Wirelessly
            </span>
          </h1>

          <p className="mt-6 text-base text-slate-400 sm:text-lg leading-relaxed">
            Ultra-low latency, peer-to-peer screen streaming directly between your devices.
            Zero cables, zero plugins, zero accounts. Stream your desktop, apps, or media to
            smart TVs, phones, or another computer in seconds.
          </p>

          {/* Quick Action CTA buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/sender"
              className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FiShare2 className="h-5 w-5" />
              Share My Screen
            </Link>

            <Link
              to="/receiver"
              className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/80 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition hover:border-slate-600 hover:bg-slate-800/90 active:scale-[0.98]"
            >
              <FiTv className="h-5 w-5 text-indigo-400" />
              Receive Screen
            </Link>
          </div>

          {/* Direct Quick Join Box */}
          <div className="mt-10 mx-auto max-w-md">
            <form
              onSubmit={handleQuickJoin}
              className="glass-panel flex items-center rounded-2xl p-2 shadow-2xl transition focus-within:border-blue-500/50"
            >
              <input
                type="text"
                value={quickRoomCode}
                onChange={(e) => setQuickRoomCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit room code..."
                maxLength={6}
                className="flex-1 bg-transparent px-4 py-2 text-center text-sm font-semibold tracking-widest text-white placeholder-slate-500 outline-none font-mono"
              />
              <button
                type="submit"
                disabled={quickRoomCode.trim().length < 4}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer"
              >
                Join <FiArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="glass-panel-interactive rounded-2xl p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5">
              <FiZap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Sub-100ms Latency</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Direct peer-to-peer WebRTC streaming utilizes your local network bandwidth
              without routing through cloud relays. Experience instantaneous cursor response.
            </p>
          </div>

          <div className="glass-panel-interactive rounded-2xl p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-5">
              <BsQrCode className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instant QR Code Pair</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Display an on-screen QR code for your smart TV or smartphone camera. Scan and
              watch instantly with zero manual IP setup or typing.
            </p>
          </div>

          <div className="glass-panel-interactive rounded-2xl p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-5">
              <FiVolume2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Audio & Tab Support</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Capture system audio alongside your screen. Stream video tutorials, presentations,
              gaming, or browser video tabs with high fidelity audio.
            </p>
          </div>

          <div className="glass-panel-interactive rounded-2xl p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5">
              <FiShield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Private & Secure</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              WebRTC media is encrypted with DTLS-SRTP end-to-end. Video tracks never touch
              the server disk or third-party servers.
            </p>
          </div>

          <div className="glass-panel-interactive rounded-2xl p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-5">
              <FiMaximize2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Full-Screen & PiP</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Switch effortlessly into borderless fullscreen or float the stream with
              Picture-in-Picture while working on other tasks.
            </p>
          </div>

          <div className="glass-panel-interactive rounded-2xl p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-5">
              <FiLayers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Universal Compatibility</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Works across Chrome, Edge, Firefox, Safari on Windows, macOS, Linux, iOS,
              Android, and modern Smart TVs without installing any software.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-24 rounded-3xl border border-slate-800 bg-slate-900/50 p-8 sm:p-12 backdrop-blur-xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              How WebCast Works in 3 Simple Steps
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Start streaming from one browser to another in less than 10 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-xl mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-white">Start a Cast Room</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Click &apos;Share My Screen&apos; to generate a unique 6-digit session code.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-black text-xl mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-white">Connect Receiver</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Open WebCast on your target device and input the 6-digit code or scan the QR code.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-black text-xl mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-white">Select Display & Stream</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Choose the screen, window, or browser tab to broadcast. Real-time streaming begins immediately.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
