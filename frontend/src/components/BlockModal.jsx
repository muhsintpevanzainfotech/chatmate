import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Ban, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BlockModal = ({ isOpen, onClose, targetUser, onBlockedSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUser._id}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Blocked ${targetUser.username}.`);
        onBlockedSuccess && onBlockedSuccess(targetUser._id);
        onClose();
      } else {
        toast.error(data.error || 'Failed to block user');
      }
    } catch (err) {
      toast.error('Network error blocking user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-[#0a0d14] border border-slate-800 rounded-2xl p-6 glass-panel shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-rose-500">
            <Ban className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">Block {targetUser.username}?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-300">
            When you block <strong className="text-white">{targetUser.username}</strong>:
          </p>
          <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <li>They will not be able to message you or view your profile.</li>
            <li>Voice and video calls will be automatically blocked.</li>
            <li>Neither of you will appear in each other's Meet People discovery list.</li>
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBlock}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/25 disabled:opacity-50"
          >
            {loading ? 'Blocking...' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  );
};
