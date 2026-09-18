import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 animate-pulse flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="w-16 h-3 bg-slate-800 rounded" />
        <div className="w-6 h-6 bg-slate-800 rounded-lg" />
      </div>

      <div className="flex flex-col items-center my-2">
        <div className="w-20 h-20 rounded-full bg-slate-800 mb-3" />
        <div className="w-28 h-5 bg-slate-800 rounded mb-2" />
        <div className="w-36 h-3 bg-slate-800 rounded" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
        <div className="h-9 bg-slate-800 rounded-xl" />
        <div className="h-9 bg-slate-800 rounded-xl" />
        <div className="h-9 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
};

export const ChatSkeleton = () => {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      <div className="flex justify-start">
        <div className="w-48 h-12 bg-slate-800 rounded-2xl rounded-tl-none" />
      </div>
      <div className="flex justify-end">
        <div className="w-64 h-14 bg-slate-800 rounded-2xl rounded-tr-none" />
      </div>
      <div className="flex justify-start">
        <div className="w-56 h-10 bg-slate-800 rounded-2xl rounded-tl-none" />
      </div>
    </div>
  );
};
