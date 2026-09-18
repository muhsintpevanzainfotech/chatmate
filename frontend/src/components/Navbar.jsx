import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Navbar = () => {
  const { user, clearSession } = useAuth();
  const socketContext = useSocket();
  const onlineCount = socketContext?.onlineCount || 0;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/60 bg-[#0a0d14]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Online Badge */}
        <div className="flex items-center gap-3">
          <Link to={user ? "/match" : "/"} className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="ChatMate Logo"
              className="h-10 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
            />
            <div className="hidden xs:block">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                Chat<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">Mate</span>
              </span>
              <span className="hidden lg:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                Random People. Real Conversations.
              </span>
            </div>
          </Link>

          {/* Live Online Users Count Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{onlineCount > 0 ? onlineCount : 1} Online</span>
          </div>
        </div>

        {/* Right User Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Welcome Back Greeting */}
              <span className="hidden lg:inline-block text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                Welcome back, {user.username} 👋
              </span>

              {/* Admin Button if admin */}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}

              {/* Profile button */}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white text-xs font-bold flex items-center justify-center">
                  {user.username ? user.username[0].toUpperCase() : 'U'}
                </div>
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">
                  {user.username}
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              </Link>

              {/* Leave Device / Clear Session Button */}
              <button
                onClick={clearSession}
                title="Leave This Device (Clear Session)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-800 transition-all"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Leave Device</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                🔒 Instant 18+ Access
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
