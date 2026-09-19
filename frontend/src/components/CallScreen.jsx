import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, RefreshCw, PhoneOff, Shield, ShieldCheck } from 'lucide-react';
import { useCall } from '../context/CallContext';

export const CallScreen = () => {
  const {
    callState,
    callType,
    peerUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    connectionBadge,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Attach remote stream to remote video/audio element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play().catch((err) => {
        console.warn('Remote media play warning:', err);
      });
    }
  }, [remoteStream]);

  if (callState === 'idle' || callState === 'incoming') return null;

  // Format call duration into HH:MM:SS
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#06080d] flex flex-col justify-between overflow-hidden animate-fadeIn select-none">
      
      {/* Background / Remote Media Stream */}
      {callType === 'video' ? (
        <div className="absolute inset-0 z-0 bg-slate-950">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Fallback if remote video track disabled or connecting */}
          {!hasRemoteVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 p-1 shadow-2xl mb-4 animate-pulse">
                <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-4xl font-extrabold text-white">
                  {peerUser?.username ? peerUser.username[0].toUpperCase() : 'U'}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">{peerUser?.username}</h3>
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {connectionBadge === 'connected' ? 'Video Connecting...' : connectionBadge}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Voice Call Audio Visualizer View */
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a0d14] via-[#121824] to-[#0a0d14] flex flex-col items-center justify-center p-6 text-center">
          <audio ref={remoteVideoRef} autoPlay playsInline />
          <div className="relative mb-6">
            <div className="absolute -inset-6 rounded-full bg-rose-500/20 blur-xl animate-pulse-slow" />
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-500 p-1 shadow-2xl shadow-rose-500/30">
              <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-5xl font-extrabold text-white">
                {peerUser?.username ? peerUser.username[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">{peerUser?.username}</h2>
          <p className="text-sm text-slate-400 mt-1 capitalize">
            {peerUser?.gender} · {peerUser?.state}{peerUser?.district ? `, ${peerUser.district}` : ''}
          </p>

          <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Encrypted Voice Call · Zero Recording
          </div>
        </div>
      )}

      {/* Floating Picture-in-Picture Local Video Stream */}
      {callType === 'video' && (
        <div className="absolute top-5 right-5 z-20 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900 glass-panel">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
              <VideoOff className="w-6 h-6 mb-1" />
              <span className="text-[10px]">Cam Off</span>
            </div>
          )}
        </div>
      )}

      {/* Top Header Information Overlay */}
      <div className="relative z-10 p-6 flex items-start justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{peerUser?.username}</h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full capitalize">
              {connectionBadge}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            {formatDuration(callDuration)}
          </p>
        </div>

        <div className="flex items-center gap-1 text-slate-300 text-xs bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span>E2EE Peer-to-Peer</span>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="relative z-10 p-6 flex items-center justify-center bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-8">
        <div className="flex items-center gap-4 sm:gap-6 bg-slate-900/90 backdrop-blur-xl px-6 py-3.5 rounded-3xl border border-slate-800 shadow-2xl">
          
          {/* Mute Mic Toggle */}
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center gap-1 group`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isMuted
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* Camera Video Toggle (Video call only) */}
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`flex flex-col items-center gap-1 group`}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isVideoOff
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                {isVideoOff ? 'Cam On' : 'Camera'}
              </span>
            </button>
          )}

          {/* Flip Camera (Mobile video call only) */}
          {callType === 'video' && (
            <button
              onClick={switchCamera}
              className="flex flex-col items-center gap-1 group"
              title="Flip Camera"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-slate-400">Flip</span>
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="flex flex-col items-center gap-1 group ml-2"
            title="End Call"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform active:scale-95">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold text-rose-400">End</span>
          </button>
        </div>
      </div>
    </div>
  );
};
