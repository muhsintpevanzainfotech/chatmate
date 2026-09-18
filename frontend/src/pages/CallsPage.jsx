import React from 'react';
import { Phone, Video, Shield, PhoneCall } from 'lucide-react';
import { useCall } from '../context/CallContext';

export const CallsPage = () => {
  const { callState, peerUser, initiateCall } = useCall();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <PhoneCall className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-white">Free WebRTC Calls</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Start encrypted voice or video calls directly from any member's profile or active chat. Absolutely zero recordings or third-party call storage.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Free Voice Calls</h4>
              <p className="text-[11px] text-slate-400">Pure audio streams, low bandwidth</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Free Video Calls</h4>
              <p className="text-[11px] text-slate-400">Full screen HD peer-to-peer media</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-center gap-2 max-w-md mx-auto">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>Camera and microphone permissions are only requested after you click call.</span>
        </div>
      </div>
    </div>
  );
};
