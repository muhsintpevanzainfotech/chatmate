import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Flag, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ReportModal = ({ isOpen, onClose, targetUser }) => {
  const { token } = useAuth();
  const [reason, setReason] = useState('underage_concern');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !targetUser) return null;

  const reasonsList = [
    { value: 'underage_concern', label: '⚠️ Underage Concern (Strict 18+ policy enforcement)' },
    { value: 'harassment', label: 'Harassment or Offensive Behavior' },
    { value: 'spam', label: 'Spam or Promotional Activity' },
    { value: 'fake_profile', label: 'Fake Profile / Misrepresentation' },
    { value: 'scam', label: 'Financial Scam or Solicitation' },
    { value: 'inappropriate_behavior', label: 'Inappropriate Content or Behavior' },
    { value: 'other', label: 'Other Safety Concern' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUserId: targetUser._id,
          reason,
          description,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Report submitted to moderators.');
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit report.');
      }
    } catch (err) {
      toast.error('Network error submitting report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0a0d14] border border-slate-800 rounded-2xl p-6 glass-panel shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Flag className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">Report {targetUser.username}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Reason for Report
            </label>
            <div className="space-y-2">
              {reasonsList.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === r.value
                      ? 'bg-rose-500/10 border-rose-500 text-white font-medium'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Additional Context / Details (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any helpful details for platform safety moderators..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl shadow-lg shadow-rose-600/25 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
