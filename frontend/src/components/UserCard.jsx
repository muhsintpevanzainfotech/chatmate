import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Phone, Video, ShieldCheck, MoreVertical, Ban, Flag, MapPin } from 'lucide-react';
import { useCall } from '../context/CallContext';

export const UserCard = ({ targetUser, isOnline, onBlock, onReport }) => {
  const navigate = useNavigate();
  const { initiateCall } = useCall();
  const [showMenu, setShowMenu] = useState(false);

  const genderColors = {
    female: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    male: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    other: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  const handleMessage = () => {
    navigate(`/messages?userId=${targetUser._id}`);
  };

  const handleVoiceCall = () => {
    initiateCall(targetUser, 'voice');
  };

  const handleVideoCall = () => {
    initiateCall(targetUser, 'video');
  };

  return (
    <div className="relative group glass-panel rounded-2xl p-5 border border-slate-800 hover:border-rose-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/10 flex flex-col justify-between">
      
      {/* Top Bar: Online status + More Options */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-medium text-slate-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 mt-1 w-36 glass-panel bg-[#121824] rounded-xl shadow-xl border border-slate-800 py-1 z-20"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onReport && onReport(targetUser);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                Report User
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onBlock && onBlock(targetUser);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Center info */}
      <div className="flex flex-col items-center text-center my-2">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
            <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-rose-400 to-pink-300">
              {targetUser.username ? targetUser.username[0].toUpperCase() : 'U'}
            </div>
          </div>
          <span
            className="absolute bottom-0 right-0 p-1 bg-[#0a0d14] rounded-full border border-slate-800 text-rose-400"
            title="18+ Verified Account"
          >
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>

        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
          {targetUser.username}
        </h3>

        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border capitalize ${
              genderColors[targetUser.gender] || genderColors.other
            }`}
          >
            {targetUser.gender}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            {targetUser.state ? `${targetUser.state}${targetUser.district ? `, ${targetUser.district}` : ''}` : 'Location hidden'}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
        <button
          onClick={handleMessage}
          className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all text-xs font-medium"
        >
          <MessageSquare className="w-4 h-4 text-rose-400" />
          <span>Message</span>
        </button>

        <button
          onClick={handleVoiceCall}
          className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all text-xs font-medium"
        >
          <Phone className="w-4 h-4 text-emerald-400" />
          <span>Voice</span>
        </button>

        <button
          onClick={handleVideoCall}
          className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-md shadow-rose-600/20 transition-all text-xs font-semibold"
        >
          <Video className="w-4 h-4" />
          <span>Video</span>
        </button>
      </div>
    </div>
  );
};
