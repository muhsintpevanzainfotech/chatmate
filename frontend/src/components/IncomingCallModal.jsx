import React from 'react';
import { Phone, Video, PhoneOff, Check, Shield } from 'lucide-react';
import { useCall } from '../context/CallContext';

export const IncomingCallModal = () => {
  const { callState, callType, peerUser, acceptCall, rejectCall } = useCall();

  if (callState !== 'incoming' || !peerUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#0a0d14] border border-rose-500/40 rounded-3xl p-6 glass-panel shadow-2xl shadow-rose-500/20 text-center flex flex-col items-center">
        
        {/* Pulsating Call Ring Avatar */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 opacity-75 blur-md animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-3xl font-extrabold text-white">
              {peerUser.username ? peerUser.username[0].toUpperCase() : 'U'}
            </div>
          </div>
        </div>

        {/* Incoming Call Details */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
          {callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          <span>Incoming Encrypted {callType === 'video' ? 'Video' : 'Voice'} Call</span>
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">
          {peerUser.username}
        </h3>

        <p className="text-xs text-slate-400 mt-1 capitalize">
          {peerUser.gender} · {peerUser.state}{peerUser.district ? `, ${peerUser.district}` : ''}
        </p>

        <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Peer-to-Peer Encrypted WebRTC · Zero Recording</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center gap-6 w-full">
          {/* Decline Button */}
          <button
            onClick={rejectCall}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-110 transition-transform">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-rose-400">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <Check className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-400">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};
