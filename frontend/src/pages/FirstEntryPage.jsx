import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, User, Calendar, MapPin, ArrowRight, ShieldCheck, Info, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { calculateAge } from '../../../backend/utils/ageValidator';

export const FirstEntryPage = () => {
  const navigate = useNavigate();
  const { createProfile, user } = useAuth();
  const socketContext = useSocket();
  const onlineCount = socketContext?.onlineCount || 0;

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('female');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Kerala');
  const [district, setDistrict] = useState('Malappuram');
  const [dob, setDob] = useState('');
  const [confirm18Plus, setConfirm18Plus] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic location cascades
  const [countriesList] = useState(['India', 'United States', 'United Kingdom', 'Canada', 'United Arab Emirates']);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  useEffect(() => {
    if (user) {
      navigate('/discover');
    }
  }, [user, navigate]);

  // Load States for Country
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch(`/api/locations/states?country=${encodeURIComponent(country)}`);
        const data = await res.json();
        if (res.ok) {
          setStatesList(data.states);
          if (data.states.length > 0 && !data.states.includes(state)) {
            setState(data.states[0]);
          }
        }
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
        if (res.ok) {
          setDistrictsList(data.districts);
          if (data.districts.length > 0 && !data.districts.includes(district)) {
            setDistrict(data.districts[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, [country, state]);

  const computedAge = dob ? calculateAge(dob) : 0;
  const isUnder18 = dob && computedAge < 18;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !dob) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (isUnder18) {
      toast.error('This platform is available only to people aged 18 and above.');
      return;
    }

    if (!confirm18Plus || !confirmTerms) {
      toast.error('Please check both confirmation boxes to continue.');
      return;
    }

    setLoading(true);
    const success = await createProfile({
      username: username.trim(),
      gender,
      country,
      state,
      district,
      dob,
      confirm18Plus,
      confirmTerms,
    });

    setLoading(false);
    if (success) {
      navigate('/discover');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#0a0d14] relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-rose-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative z-10">
        
        {/* First Entry Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="ChatMate Logo"
            className="w-48 sm:w-56 h-auto mx-auto mb-3 object-contain filter drop-shadow-xl hover:scale-105 transition-transform duration-300"
          />

          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              Strictly 18+ Only
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineCount > 0 ? onlineCount : 1} Online Now</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-3">
            Meet People. Talk Freely. Stay Private.
          </h1>

          <p className="text-xs text-slate-400 mt-2 font-medium">
            Create your simple profile to continue. (No password, no email, no phone required)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose handle (e.g. Anu_Kerala)"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors capitalize"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Cascading Location Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {countriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {statesList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                District / Place
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {districtsList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date of Birth (Used only for 18+ validation) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Date of Birth (Used for 18+ Verification)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={`w-full bg-slate-900/90 border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                  isUnder18 ? 'border-rose-500' : 'border-slate-800 focus:border-rose-500'
                }`}
              />
            </div>
            {dob && (
              <p className={`text-xs mt-1 font-semibold ${isUnder18 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isUnder18
                  ? 'This platform is available only to people aged 18 and above.'
                  : `✅ Age ${computedAge} verified (18+ Compliant). Your DOB will never be displayed publicly.`}
              </p>
            )}
          </div>

          {/* Session Device Explanation Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              Your profile is linked to this browser session. If you clear your browser data or change devices, your previous session may no longer be available.
            </p>
          </div>

          {/* Confirmation Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={confirm18Plus}
                onChange={(e) => setConfirm18Plus(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300 font-medium">
                I confirm that I am 18 years old or older.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={confirmTerms}
                onChange={(e) => setConfirmTerms(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300">
                I agree to the <Link to="/terms" className="text-rose-400 underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-rose-400 underline">Privacy Policy</Link>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isUnder18}
            className="w-full mt-2 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 rounded-xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Initializing Session & E2EE Keys...' : 'Enter App'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
