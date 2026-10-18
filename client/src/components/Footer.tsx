import { FiShield, FiZap, FiMonitor, FiSmartphone, FiCpu } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#090d16]/80 py-10 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                WC
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                WebCast Wireless Display
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 max-w-md">
              Zero-install, browser-to-browser peer-to-peer screen casting. Powered by modern
              WebRTC protocols and WebSockets for ultra-low latency real-time streaming across your local network.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-2 py-1">
                <FiShield className="text-blue-400" /> End-to-End P2P Encrypted
              </span>
              <span className="flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-2 py-1">
                <FiZap className="text-amber-400" /> Sub-100ms Latency
              </span>
              <span className="flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-2 py-1">
                <FiCpu className="text-emerald-400" /> Hardware Accelerated
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Supported Targets
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <FiMonitor className="text-slate-500" /> Smart TVs & Projectors
              </li>
              <li className="flex items-center gap-2">
                <FiSmartphone className="text-slate-500" /> Mobile Phones & Tablets
              </li>
              <li className="flex items-center gap-2">
                <FiMonitor className="text-slate-500" /> PC, Mac & Chromebooks
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Performance Tips
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li>• Connect both devices to 5GHz Wi-Fi or Ethernet.</li>
              <li>• Use Chromium-based or Safari browsers for best decoding.</li>
              <li>• Close heavy background downloads during high FPS cast.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600">
          <p>© {new Date().getFullYear()} WebCast. Built with WebRTC, React & Tailwind CSS.</p>
          <p className="mt-2 sm:mt-0">Private & Local • No data stored on server</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
