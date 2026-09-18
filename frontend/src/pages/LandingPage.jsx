import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Video, Phone, Users, CheckCircle2, ShieldCheck, Zap, SkipForward } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const LandingPage = () => {
  const { user } = useAuth();
  const socketContext = useSocket();
  const onlineCount = socketContext?.onlineCount || 0;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-rose-600/20 via-pink-500/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 max-w-7xl mx-auto text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo.png"
            alt="ChatMate Logo"
            className="w-56 sm:w-72 md:w-80 h-auto object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider animate-pulse">
            <Shield className="w-4 h-4" />
            <span>Strictly 18+ Random Stranger Platform</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{onlineCount > 0 ? onlineCount : 1} People Online Now</span>
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto">
          Meet Someone New. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-400 to-amber-300 glow-text">
            Talk. Connect. Move On.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Random 1-to-1 conversations with people matching your preferences. Free text chat, voice calls, and WebRTC video calls.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={user ? "/match" : "/"}
            className="w-full sm:w-auto px-10 py-4 text-lg font-extrabold text-white bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 rounded-2xl shadow-xl shadow-rose-600/30 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Video className="w-5 h-5" />
            Start Chatting
          </Link>
        </div>

        {/* Key Highlight Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Free Text Chat</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Free Voice Calls</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Free Video Calls</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Privacy First</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-rose-500" /> 18+ Only</span>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-950/60 border-y border-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">How It Works</h2>
            <p className="text-slate-400 text-sm mt-2">Connect with a random stranger in seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Create Temporary Profile</h3>
              <p className="text-xs text-slate-400">Set username, gender, broad place, and verify 18+ age.</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Select Preferences</h3>
              <p className="text-xs text-slate-400">Choose who you want to meet by gender and location preference.</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Chat & Hit NEXT</h3>
              <p className="text-xs text-slate-400">Enjoy 1-to-1 video chat and hit ⏭️ NEXT anytime to meet someone new.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-900 bg-[#06080d] text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ChatMate Platform. Strictly 18+ Adults Only.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-slate-300">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
            <Link to="/safety" className="hover:text-slate-300">Safety Guide</Link>
            <Link to="/community-guidelines" className="hover:text-slate-300">Community Guidelines</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
