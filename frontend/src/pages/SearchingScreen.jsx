import React from 'react';
import { Search, X, ShieldCheck, Users } from 'lucide-react';
import { useMatch } from '../context/MatchContext';
import { useSocket } from '../context/SocketContext';

export const SearchingScreen = ({ localStream, isVideoOff }) => {
  const { genderPref, placePref, cancelMatch } = useMatch();
  const socketContext = useSocket();
  const onlineCount = socketContext?.onlineCount || 0;
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(() => {});
    }
  }, [localStream, isVideoOff]);

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center animate-fadeIn">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Local Camera Stream Preview during Matchmaking */}
        {localStream && !isVideoOff ? (
          <div className="relative w-36 h-36 mx-auto mb-6 rounded-3xl overflow-hidden border-2 border-rose-500/50 shadow-xl shadow-rose-500/20 bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-rose-500 rounded-3xl animate-ping opacity-30 pointer-events-none" />
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-bold text-white whitespace-nowrap">
              Your Camera Live
            </div>
          </div>
        ) : (
          /* Animated Radar Pulse */
          <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-rose-500/30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-600/30">
              <Search className="w-9 h-9 text-white animate-bounce" />
            </div>
          </div>
        )}

        <h2 className="text-2xl font-extrabold text-white tracking-tight">Finding someone...</h2>
        <p className="text-xs text-slate-400 mt-2">
          Looking for a compatible person matching your preferences.
        </p>

        {/* Live Online Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{onlineCount > 0 ? onlineCount : 1} Members Active Right Now</span>
        </div>

        {/* Preference Badges */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs flex-wrap">
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-rose-400 font-medium capitalize">
            Meeting: {genderPref}
          </span>
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-rose-400 font-medium capitalize">
            Place: {placePref}
          </span>
        </div>

        <div className="mt-6 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Random 1-to-1 Matchmaking Queue Active</span>
        </div>

        {/* Cancel Button */}
        <button
          onClick={cancelMatch}
          className="mt-8 px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all"
        >
          <X className="w-4 h-4 text-rose-500" />
          Cancel Searching
        </button>

      </div>
    </div>
  );
};

