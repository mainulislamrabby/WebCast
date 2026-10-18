import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../services/socket";
import type { Role, WebRTCConnectionState } from "../types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface UseWebRTCOptions {
  enableAudio?: boolean;
}

const useWebRTC = (
  roomId: string,
  role: Role,
  options: UseWebRTCOptions = { enableAudio: true }
) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDescription = useRef(false);

  const [connectionState, setConnectionState] =
    useState<WebRTCConnectionState>("new");
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamResolution, setStreamResolution] = useState<string>("");
  const [hasAudioTrack, setHasAudioTrack] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or get RTCPeerConnection
  const getOrCreatePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;
    hasRemoteDescription.current = false;
    iceCandidatesQueue.current = [];

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as WebRTCConnectionState;
      setConnectionState(state);
      if (state === "failed" || state === "disconnected") {
        console.warn(`WebRTC connection state: ${state}`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        pc.restartIce();
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.width && settings.height) {
            setStreamResolution(`${settings.width}x${settings.height}`);
          }
          videoTrack.onended = () => {
            setRemoteStream(null);
          };
        }

        setHasAudioTrack(stream.getAudioTracks().length > 0);
      }
    };

    return pc;
  }, []);

  // Flush queued ICE candidates after remote description is set
  const processQueuedIceCandidates = async (pc: RTCPeerConnection) => {
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding queued ICE candidate:", err);
        }
      }
    }
  };

  // Start Screen Capture
  const startScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setErrorMessage(null);
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            frameRate: { ideal: 60, max: 60 },
          },
          audio: options.enableAudio ? true : false,
        });
      } catch (audioErr) {
        // Fallback without audio if audio constraint fails
        console.warn("Screen capture with audio failed, falling back to video-only:", audioErr);
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
      }

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setStreamResolution(`${settings.width}x${settings.height}`);
        }

        // Native browser "Stop sharing" button event
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      setHasAudioTrack(stream.getAudioTracks().length > 0);

      const pc = getOrCreatePeerConnection();

      // Replace or add tracks
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const existingSender = senders.find(
          (s) => s.track && s.track.kind === track.kind
        );
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          pc.addTrack(track, stream);
        }
      });

      // Create & send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", offer);

      return stream;
    } catch (err: unknown) {
      const errObj = err as Error;
      if (errObj.name !== "NotAllowedError") {
        console.error("Screen sharing failed:", err);
        setErrorMessage(errObj.message || "Failed to start screen share.");
      }
      return null;
    }
  }, [options.enableAudio, getOrCreatePeerConnection]);

  // Stop Screen Capture
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    setScreenStream(null);
    setIsScreenSharing(false);
    setStreamResolution("");
    setHasAudioTrack(false);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          try {
            peerConnectionRef.current?.removeTrack(sender);
          } catch (e) {
            console.warn("Error removing track:", e);
          }
        }
      });
    }

    socket.emit("stop-sharing");
  }, []);

  // Full Disconnect
  const disconnect = useCallback(() => {
    stopScreenShare();

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    hasRemoteDescription.current = false;
    iceCandidatesQueue.current = [];

    socket.emit("disconnect-room");
    setRemoteStream(null);
    setConnectionState("closed");
  }, [stopScreenShare]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const pc = getOrCreatePeerConnection();

    const handleReceiverJoined = async () => {
      if (role !== "sender") return;
      setConnectionState("connecting");

      // If sender already picked their screen, generate offer
      if (screenStreamRef.current) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", offer);
        } catch (e) {
          console.error("Failed to create offer on receiver-joined:", e);
        }
      }
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      if (role !== "receiver") return;
      setConnectionState("connecting");

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        hasRemoteDescription.current = true;
        await processQueuedIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", answer);
      } catch (err) {
        console.error("Error handling WebRTC offer:", err);
      }
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
      if (role !== "sender") return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        hasRemoteDescription.current = true;
        await processQueuedIceCandidates(pc);
      } catch (err) {
        console.error("Error handling WebRTC answer:", err);
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      if (!hasRemoteDescription.current) {
        iceCandidatesQueue.current.push(candidate);
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    };

    const handlePeerDisconnected = () => {
      setRemoteStream(null);
      setConnectionState("disconnected");
    };

    const handlePeerStoppedSharing = () => {
      setRemoteStream(null);
    };

    socket.on("receiver-joined", handleReceiverJoined);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("peer-disconnected", handlePeerDisconnected);
    socket.on("peer-stopped-sharing", handlePeerStoppedSharing);

    return () => {
      socket.off("receiver-joined", handleReceiverJoined);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("peer-disconnected", handlePeerDisconnected);
      socket.off("peer-stopped-sharing", handlePeerStoppedSharing);

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [roomId, role, getOrCreatePeerConnection]);

  return {
    connectionState,
    screenStream,
    remoteStream,
    isScreenSharing,
    streamResolution,
    hasAudioTrack,
    errorMessage,
    startScreenShare,
    stopScreenShare,
    disconnect,
  };
};

export default useWebRTC;