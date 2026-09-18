import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, Shield, MapPin, Trash2, Ban, LogOut, Save, Edit3, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateAge } from '../../../backend/utils/ageValidator';

export const ProfilePage = () => {
  const { user, token, updateProfile, clearSession, deleteProfile } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [gender, setGender] = useState(user?.gender || 'female');
  const [country, setCountry] = useState(user?.country || 'India');
  const [state, setState] = useState(user?.state || 'Kerala');
  const [district, setDistrict] = useState(user?.district || 'Malappuram');
  const [dob, setDob] = useState('');

  const [countriesList] = useState(['India', 'United States', 'United Kingdom', 'Canada', 'United Arab Emirates']);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  const [privacySettings, setPrivacySettings] = useState({
    discoverable: true,
    showOnlineStatus: true,
    allowMessages: 'everyone',
    allowCalls: 'everyone',
    allowVideoCalls: 'everyone',
    showPlace: true,
  });

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setGender(user.gender || 'female');
      setCountry(user.country || 'India');
      setState(user.state || 'Kerala');
      setDistrict(user.district || 'Malappuram');
      if (user.privacySettings) {
        setPrivacySettings(user.privacySettings);
      }
    }
  }, [user]);

  // Load States for Country
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch(`/api/locations/states?country=${encodeURIComponent(country)}`);
        const data = await res.json();
        if (res.ok) setStatesList(data.states);
      } catch (err) {
        console.error('Failed to load states:', err);
      }
    };
    fetchStates();
  }, [country]);

  // Load Districts for State
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!state) return;
      try {
        const res = await fetch(`/api/locations/districts?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`);
        const data = await res.json();
        if (res.ok) setDistrictsList(data.districts);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, [country, state]);

  // Fetch Blocked Users
  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/users/blocked', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setBlockedUsers(data.blockedUsers || []);
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, [token]);

  const handleUnblock = async (blockedUserId) => {
    try {
      const res = await fetch(`/api/users/${blockedUserId}/block`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('User unblocked.');
        fetchBlockedUsers();
      }
    } catch (err) {
      toast.error('Failed to unblock user.');
    }
  };

  const computedAge = dob ? calculateAge(dob) : 0;
  const isUnder18 = dob && computedAge < 18;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isUnder18) {
      toast.error('This platform is available only to people aged 18 and above.');
      return;
    }

    setLoadingSave(true);
    const updatePayload = {
      username: username.trim(),
      gender,
      country,
      state,
      district,
      privacySettings,
    };

    if (dob) {
      updatePayload.dob = dob;
    }

    const success = await updateProfile(updatePayload);
    setLoadingSave(false);
  };

  const handleDeleteProfileConfirm = async () => {
    setLoadingDelete(true);
    await deleteProfile();
    setLoadingDelete(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Profile Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-500 p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-[#0a0d14] flex items-center justify-center text-3xl font-extrabold text-white">
              {user.username ? user.username[0].toUpperCase() : 'U'}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 justify-center sm:justify-start">
              {user.username}
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                18+ Active Profile
              </span>
            </h1>
            <p className="text-xs text-slate-400 capitalize mt-1">
              Gender: {user.gender} · {user.state}, {user.district}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Browser session active since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Leave Device Button */}
        <button
          onClick={clearSession}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Leave This Device
        </button>
      </div>

      {/* Profile Details Editor */}
      <form onSubmit={handleSaveProfile} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white">Edit Profile Details</h2>
          </div>
          <button
            type="submit"
            disabled={loadingSave || isUnder18}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loadingSave ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Username Handle
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 capitalize"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Location Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {countriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {statesList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">District / Place</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {districtsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Update DOB / Re-verify 18+ */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Update Date of Birth (Optional - Re-verifies 18+ Status)
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={`w-full bg-slate-900 border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none ${
                isUnder18 ? 'border-rose-500' : 'border-slate-800 focus:border-rose-500'
              }`}
            />
          </div>
          {dob && (
            <p className={`text-xs mt-1 font-semibold ${isUnder18 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isUnder18
                ? 'This platform is available only to people aged 18 and above.'
                : `✅ Age ${computedAge} re-verified (18+ Compliant).`}
            </p>
          )}
        </div>
      </form>

      {/* Privacy Controls */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-800">
          <Shield className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-bold text-white">Privacy Controls</h2>
        </div>

        <div className="space-y-6 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-white">Who can discover me?</span>
              <p className="text-xs text-slate-400">Controls whether your card appears in Meet People</p>
            </div>
            <select
              value={privacySettings.discoverable ? 'everyone' : 'none'}
              onChange={(e) =>
                setPrivacySettings((prev) => ({ ...prev, discoverable: e.target.value === 'everyone' }))
              }
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="everyone">Everyone</option>
              <option value="none">Nobody (Hidden Profile)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">Show online status</span>
              <p className="text-xs text-slate-400">Broadcast green presence badge when active</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.showOnlineStatus}
              onChange={(e) =>
                setPrivacySettings((prev) => ({ ...prev, showOnlineStatus: e.target.checked }))
              }
              className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-white">Allow messages</span>
              <p className="text-xs text-slate-400">Who can send you E2EE direct messages</p>
            </div>
            <select
              value={privacySettings.allowMessages}
              onChange={(e) => setPrivacySettings((prev) => ({ ...prev, allowMessages: e.target.value }))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="everyone">Everyone</option>
              <option value="blocked_none">Blocked None</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-white">Allow voice calls</span>
              <p className="text-xs text-slate-400">Who can initiate WebRTC audio calls</p>
            </div>
            <select
              value={privacySettings.allowCalls}
              onChange={(e) => setPrivacySettings((prev) => ({ ...prev, allowCalls: e.target.value }))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="everyone">Everyone</option>
              <option value="blocked_none">Blocked None</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-white">Allow video calls</span>
              <p className="text-xs text-slate-400">Who can initiate WebRTC video calls</p>
            </div>
            <select
              value={privacySettings.allowVideoCalls}
              onChange={(e) => setPrivacySettings((prev) => ({ ...prev, allowVideoCalls: e.target.value }))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="everyone">Everyone</option>
              <option value="blocked_none">Blocked None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blocked Accounts Manager */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Ban className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-bold text-white">Blocked Accounts ({blockedUsers.length})</h2>
        </div>

        {blockedUsers.length > 0 ? (
          <div className="space-y-3">
            {blockedUsers.map((b) => (
              <div
                key={b.blockId}
                className="flex items-center justify-between p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{b.user.username}</h4>
                  <p className="text-xs text-slate-400 capitalize">{b.user.gender} · {b.user.state}</p>
                </div>
                <button
                  onClick={() => handleUnblock(b.user._id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No accounts currently blocked.</p>
        )}
      </div>

      {/* Delete Profile Section (Spec #23) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/30 bg-rose-500/5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Delete My Profile
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Permanently remove your profile and invalidate your current browser session.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/25 transition-all"
          >
            Delete Profile
          </button>
        </div>
      </div>

      {/* Delete Profile Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0a0d14] border border-slate-800 rounded-3xl p-6 glass-panel text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-white">Delete Profile</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This will remove your profile and invalidate your current session. All your blocks, reports, and temporary encrypted data will be purged.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfileConfirm}
                disabled={loadingDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/25 disabled:opacity-50"
              >
                {loadingDelete ? 'Purging...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
