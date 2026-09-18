import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Send,
  Lock,
  Mic,
  MicOff,
  Video,
  VideoOff,
  RefreshCw,
  PhoneOff,
  SkipForward,
  Ban,
  Flag,
  Shield,
  ShieldCheck,
  Search,
  Camera,
  Info,
  LayoutGrid,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useMatch } from '../context/MatchContext';
import { WebRTCManager } from '../webrtc/webRTCManager';
import {
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  importPublicKey,
} from '../crypto/e2ee';
import { SearchingScreen } from './SearchingScreen';
import { ReportModal } from '../components/ReportModal';
import { BlockModal } from '../components/BlockModal';

export const MatchPage = () => {
  const { user, keyPair } = useAuth();
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const onlineCount = socketContext?.onlineCount || 0;
  const {
    matchState,
    setMatchState,
    partner,
    matchId,
    isInitiator,
    genderPref,
    placePref,
    setGenderPref,
    setPlacePref,
    startMatching,
    nextMatch,
    cancelMatch,
  } = useMatch();

  // WebRTC Local & Remote Media Streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Permission & Layout States
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'unknown' | 'granted' | 'denied' | 'audio-only' | 'text-only'
  const [layoutMode, setLayoutMode] = useState('split'); // 'split' (dual equal boxes) | 'pip' (picture-in-picture)

  // E2EE Chat State
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [sharedKey, setSharedKey] = useState(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const rtcManagerRef = useRef(null);
  const timerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const partnerRef = useRef(partner);
  const socketRef = useRef(socket);

  useEffect(() => {
    partnerRef.current = partner;
    socketRef.current = socket;
  }, [partner, socket]);

  useEffect(() => {
    sharedKeyRef.current = sharedKey;
  }, [sharedKey]);

  // Initialize WebRTC Manager once on mount
  useEffect(() => {
    rtcManagerRef.current = new WebRTCManager({
      onLocalStream: (stream) => setLocalStream(stream),
      onRemoteStream: (stream) => setRemoteStream(stream),
      onPermissionStatus: (status) => setPermissionStatus(status),
      onIceCandidate: (candidate) => {
        if (socketRef.current && partnerRef.current) {
          socketRef.current.emit('webrtc:ice-candidate', {
            targetUserId: partnerRef.current._id,
            candidate,
          });
        }
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') {
          startCallTimer();
        }
      },
    });

    // Auto-open video camera preview immediately on mount
    rtcManagerRef.current.acquireMedia('video').catch((err) => {
      console.warn('Auto media acquisition on mount:', err);
    });

    return () => {
      stopCallTimer();
      if (rtcManagerRef.current) {
        rtcManagerRef.current.closePeerConnection(false);
      }
    };
  }, []);

  // Handle Partner Match Pairing & WebRTC Offer/Answer
  useEffect(() => {
    if (matchState !== 'matched' || !partner || !socket) return;

    const setupMatchMedia = async () => {
      try {
        // 1. Acquire Camera & Microphone with fallbacks
        await rtcManagerRef.current.acquireMedia('video');

        // 2. Derive E2EE Shared Key
        if (keyPair && keyPair.privateKey && partner.publicKey) {
          const recipientPubKey = await importPublicKey(partner.publicKey);
          if (recipientPubKey) {
            const derivedKey = await deriveSharedKey(keyPair.privateKey, recipientPubKey);
            setSharedKey(derivedKey);
            sharedKeyRef.current = derivedKey;
          }
        }

        // 3. Initiate WebRTC Offer if initiator
        if (isInitiator) {
          const offer = await rtcManagerRef.current.createOffer();
          socket.emit('webrtc:offer', { targetUserId: partner._id, offer });
        }
      } catch (err) {
        console.warn('Match media setup warning:', err);
      }
    };

    setupMatchMedia();
  }, [matchState, partner, isInitiator, socket, keyPair]);

  // Attach Video Streams with explicit playback triggers for mobile browsers
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isVideoOff, layoutMode]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream, layoutMode]);

  // Socket WebRTC & Message Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('webrtc:offer', async ({ senderId, offer }) => {
      try {
        if (rtcManagerRef.current) {
          if (!rtcManagerRef.current.localStream) {
            await rtcManagerRef.current.acquireMedia('video');
          }
          const answer = await rtcManagerRef.current.handleOffer(offer);
          socket.emit('webrtc:answer', { targetUserId: senderId, answer });
        }
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    socket.on('webrtc:answer', async ({ answer }) => {
      try {
        await rtcManagerRef.current.handleAnswer(answer);
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    });

    socket.on('webrtc:ice-candidate', async ({ candidate }) => {
      try {
        await rtcManagerRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('message:receive', async ({ senderId, ciphertext, iv, timestamp }) => {
      let text = '[Encrypted Message]';
      const keyToUse = sharedKeyRef.current;
      if (keyToUse) {
        text = await decryptMessage(ciphertext, iv, keyToUse);
      }
      setMessages((prev) => [
        ...prev,
        { senderId, text, timestamp: timestamp || new Date().toISOString() },
      ]);
      scrollToBottom();
    });

    socket.on('typing:start', ({ senderId }) => {
      if (partner && senderId === partner._id) setIsPartnerTyping(true);
    });

    socket.on('typing:stop', ({ senderId }) => {
      if (partner && senderId === partner._id) setIsPartnerTyping(false);
    });

    return () => {
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('message:receive');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [socket, partner]);

  const startCallTimer = () => {
    stopCallTimer();
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleTestPermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some((d) => d.kind === 'videoinput');
        if (!hasVideo) {
          setPermissionStatus('audio-only');
          toast('No camera hardware detected. Audio mode enabled.', { icon: '🎙️' });
          return;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionStatus('granted');
      toast.success('Camera & Microphone permissions granted!');
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        toast.error('Camera access denied in browser settings.');
      } else {
        setPermissionStatus('audio-only');
        toast('Camera hardware unavailable. Audio mode enabled.', { icon: '🎙️' });
      }
    }
  };

  const handleReAcquireCamera = async () => {
    if (!rtcManagerRef.current) return;
    try {
      await rtcManagerRef.current.reAcquireCamera();
      setIsVideoOff(false);
      toast.success('Camera connected and video stream activated!');
    } catch (err) {
      toast.error('Camera permission denied or camera in use by another app.');
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (socket && partner) {
      socket.emit('typing:start', { recipientId: partner._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { recipientId: partner._id });
      }, 1500);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !partner || !socket) return;

    const text = inputMessage.trim();
    setInputMessage('');

    const keyToUse = sharedKeyRef.current;
    if (!keyToUse) {
      toast.error('Establishing E2EE key agreement... Please try in a second.');
      return;
    }

    try {
      const { ciphertext, iv } = await encryptMessage(text, keyToUse);
      socket.emit('message:send', {
        matchId,
        recipientId: partner._id,
        ciphertext,
        iv,
      });

      setMessages((prev) => [
        ...prev,
        { senderId: user._id, text, timestamp: new Date().toISOString() },
      ]);
      scrollToBottom();

      if (socket && partner) {
        socket.emit('typing:stop', { recipientId: partner._id });
      }
    } catch (err) {
      console.error('Message encryption error:', err);
      toast.error('Failed to encrypt message');
    }
  };

  const handleNext = () => {
    if (rtcManagerRef.current) {
      rtcManagerRef.current.closePeerConnection(true);
    }
    stopCallTimer();
    setRemoteStream(null);
    setMessages([]);
    setSharedKey(null);
    sharedKeyRef.current = null;
    nextMatch();
  };

  const toggleMute = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    if (rtcManagerRef.current) rtcManagerRef.current.toggleAudio(!nextVal);
  };

  const toggleVideo = () => {
    const nextVal = !isVideoOff;
    setIsVideoOff(nextVal);
    if (rtcManagerRef.current) rtcManagerRef.current.toggleVideo(!nextVal);
  };

  const switchCamera = () => {
    if (rtcManagerRef.current) rtcManagerRef.current.switchCamera();
  };

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (matchState === 'searching') {
    return <SearchingScreen localStream={localStream} isVideoOff={isVideoOff} />;
  }

  if (matchState === 'idle' || !partner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-600/30">
            <Video className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">Meet Someone New</h1>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{onlineCount > 0 ? onlineCount : 1} Strangers Online Now</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Select your preferences and start random 1-to-1 video chat.
          </p>

          {/* Live Camera Preview Box */}
          <div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center my-6 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {(!localStream || isVideoOff) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-4">
                <Camera className="w-9 h-9 text-rose-500 mb-2 animate-pulse" />
                <h4 className="text-xs font-bold text-white">Live Camera Preview</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {permissionStatus === 'denied'
                    ? 'Camera permission blocked in browser settings'
                    : 'Click Test Camera below if video preview is not showing'}
                </p>
                {permissionStatus === 'denied' && (
                  <button
                    onClick={handleReAcquireCamera}
                    className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
                  >
                    Enable Camera Access
                  </button>
                )}
              </div>
            )}
            <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${localStream ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              {localStream ? 'Live Camera Ready' : 'Camera Initializing...'}
            </div>
          </div>

          {/* Camera Permission Status & Test Control */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-rose-500" />
                <div>
                  <h4 className="text-xs font-bold text-white">Camera & Microphone Access</h4>
                  <p className="text-[11px] text-slate-400">
                    Required for live video & voice chat with your partner.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestPermission}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Test Camera</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Permission Status:</span>
              {permissionStatus === 'granted' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Granted & Active
                </span>
              )}
              {permissionStatus === 'denied' && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Blocked in Browser
                </span>
              )}
              {permissionStatus === 'audio-only' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Audio Only Mode
                </span>
              )}
              {(permissionStatus === 'unknown' || permissionStatus === 'text-only') && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium">
                  Prompted on Start
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4 text-left max-w-md mx-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Who do you want to meet?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['everyone', 'female', 'male'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderPref(g)}
                    className={`py-3 px-3 text-xs font-bold rounded-xl border capitalize transition-all ${
                      genderPref === g
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Place Preference
              </label>
              <select
                value={placePref}
                onChange={(e) => setPlacePref(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="all">All Places</option>
                <option value="Kerala">Kerala</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi NCR">Delhi NCR</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => startMatching(genderPref, placePref)}
            className="mt-8 w-full max-w-md py-4 text-base font-extrabold text-white bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 rounded-2xl shadow-xl shadow-rose-600/30 transition-all transform hover:scale-[1.02]"
          >
            START RANDOM CHAT
          </button>
        </div>
      </div>
    );
  }

  if (matchState === 'partner_left') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-rose-500">
            <PhoneOff className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">The other person disconnected</h2>
          <p className="text-xs text-slate-400 mt-1">Ready to meet someone new?</p>
          <button
            onClick={handleNext}
            className="mt-6 w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Find Someone New
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 h-[calc(100vh-5rem)] flex flex-col justify-between">
      
      <div className="glass-panel rounded-3xl border border-slate-800 h-full flex flex-col md:flex-row overflow-hidden shadow-2xl">
        
        {/* Left / Top Pane: WebRTC Dual Video Feeds */}
        <div className="relative flex-1 bg-slate-950 flex flex-col justify-between overflow-hidden min-h-[340px] md:min-h-0">
          
          {/* Top Status & Layout Bar */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
            {/* Permission Status Pill */}
            <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold">{partner.username}</span>
              <span className="text-slate-400">· {partner.state}</span>
              
              {permissionStatus === 'denied' && (
                <button
                  onClick={handleReAcquireCamera}
                  className="ml-2 px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg shadow"
                >
                  Grant Camera
                </button>
              )}
            </div>

            {/* Layout Toggle (Split vs PIP) */}
            <div className="pointer-events-auto flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
              <button
                onClick={() => setLayoutMode('split')}
                title="Split Screen Dual View"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  layoutMode === 'split' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('pip')}
                title="Picture in Picture View"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  layoutMode === 'pip' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DUAL VIDEO LAYOUT RENDERING */}
          {layoutMode === 'split' ? (
            /* SPLIT SCREEN MODE: 50% Partner, 50% You */
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-1 bg-slate-950 p-1 pt-12">
              
              {/* Box 1: Partner Video */}
              <div className="relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Partner Video Fallback Overlay */}
                {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 p-1 shadow-xl mb-2 animate-pulse">
                      <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-2xl font-extrabold text-white">
                        {partner.username ? partner.username[0].toUpperCase() : 'U'}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white">{partner.username}</h3>
                    <p className="text-[11px] text-rose-400 capitalize">
                      {partner.gender} · {partner.state}
                    </p>
                  </div>
                )}

                {/* Partner Label */}
                <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Partner: {partner.username}
                </div>
              </div>

              {/* Box 2: Your Video */}
              <div className="relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />

                {/* Your Video Fallback / Camera Off Overlay */}
                {isVideoOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 text-slate-400">
                      <VideoOff className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Your Camera is Off</h4>
                    <button
                      onClick={handleReAcquireCamera}
                      className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg shadow"
                    >
                      Enable Camera Access
                    </button>
                  </div>
                )}

                {/* Your Label */}
                <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  You ({user?.username || 'You'}) {isMuted ? '· Muted' : ''}
                </div>
              </div>

            </div>
          ) : (
            /* PIP MODE: Full screen partner + Floating PIP for local camera */
            <div className="relative w-full h-full bg-slate-950">
              {/* Partner Full Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Partner Video Fallback */}
              {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 p-1 shadow-2xl mb-3 animate-pulse">
                    <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-3xl font-extrabold text-white">
                      {partner.username ? partner.username[0].toUpperCase() : 'U'}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white">{partner.username}</h3>
                  <p className="text-xs text-rose-400 mt-1 capitalize">
                    {partner.gender} · {partner.state}, {partner.district}
                  </p>
                </div>
              )}

              {/* Floating Local PIP Stream */}
              <div className="absolute top-14 right-3 z-20 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-900 shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-2 text-center">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">Cam Off</span>
                    <button
                      onClick={handleReAcquireCamera}
                      className="mt-1 text-[9px] text-rose-400 font-bold underline"
                    >
                      Enable
                    </button>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white">
                  You
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right / Bottom Pane: Text Chat Pane */}
        <div className="w-full md:w-96 bg-[#0a0d14]/90 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-64 md:h-full">
          
          {/* Chat Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white">Encrypted Chat</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowReportModal(true)}
                title="Report User"
                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800"
              >
                <Flag className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowBlockModal(true)}
                title="Block User"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((m, idx) => {
              const isMe = m.senderId === user._id;
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-rose-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className="block text-[9px] text-right mt-1 opacity-60">
                      {formatTime(m.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
            {isPartnerTyping && (
              <div className="text-[10px] text-rose-400 italic font-medium animate-pulse">
                {partner.username} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder="Type encrypted message..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Main Bottom Omegle Toolbar */}
      <div className="mt-3 flex items-center justify-center gap-3 sm:gap-4 bg-slate-900/90 backdrop-blur-xl px-4 py-3 rounded-2xl border border-slate-800 shadow-2xl">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-xl border transition-all ${
            isMuted ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Toggle Mic"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-xl border transition-all ${
            isVideoOff ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Toggle Camera"
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Flip Camera */}
        <button
          onClick={switchCamera}
          className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-all"
          title="Flip Camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* PRIMARY HIGHLIGHT: ⏭️ NEXT BUTTON */}
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transform active:scale-95 transition-all"
        >
          <SkipForward className="w-5 h-5" />
          <span>NEXT</span>
        </button>

        {/* Block */}
        <button
          onClick={() => setShowBlockModal(true)}
          className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 transition-all"
          title="Block User"
        >
          <Ban className="w-5 h-5" />
        </button>

        {/* Report */}
        <button
          onClick={() => setShowReportModal(true)}
          className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 transition-all"
          title="Report User"
        >
          <Flag className="w-5 h-5" />
        </button>
      </div>

      {/* Modals */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetUser={partner}
      />

      <BlockModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        targetUser={partner}
        onBlockedSuccess={handleNext}
      />
    </div>
  );
};
