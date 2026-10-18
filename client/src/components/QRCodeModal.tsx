import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { FiX, FiCopy, FiCheck, FiDownload } from "react-icons/fi";

interface QRCodeModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  lanIp?: string;
}

const QRCodeModal = ({ roomId, isOpen, onClose, lanIp }: QRCodeModalProps) => {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Compute best URL: if on localhost and we know the host LAN IP, use LAN IP
  const getJoinUrl = () => {
    if (typeof window === "undefined") return `http://localhost:5174/receiver?code=${roomId}`;
    
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    if ((host === "localhost" || host === "127.0.0.1") && lanIp) {
      return `${protocol}//${lanIp}${port}/receiver?code=${roomId}`;
    }

    return `${window.location.origin}/receiver?code=${roomId}`;
  };

  const joinUrl = getJoinUrl();

  useEffect(() => {
    if (!roomId || !isOpen) return;

    QRCode.toDataURL(joinUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error("Error generating QR code:", err));
  }, [roomId, joinUrl, isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `webcast-room-${roomId}.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
          aria-label="Close modal"
        >
          <FiX className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold text-white">Scan to Connect</h3>
        <p className="mt-1 text-xs text-slate-400">
          Scan with your phone, tablet or TV camera to watch instantly
        </p>

        {/* QR Code Canvas / Image */}
        <div className="mt-5 flex justify-center">
          <div className="rounded-2xl bg-white p-3 shadow-lg shadow-black/40">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR code for Room ${roomId}`}
                className="h-56 w-56 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-slate-400 text-xs">
                Generating QR code...
              </div>
            )}
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="mt-4">
          <span className="text-xs text-slate-400">Room Code:</span>
          <div className="mt-1 text-2xl font-black tracking-[0.25em] text-blue-400 font-mono">
            {roomId}
          </div>
        </div>

        {/* Direct Link & Actions */}
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95"
          >
            {copied ? (
              <>
                <FiCheck className="text-emerald-400" /> Copied Link!
              </>
            ) : (
              <>
                <FiCopy /> Copy Direct Link
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 p-2.5 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
            title="Download QR Image"
          >
            <FiDownload className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
