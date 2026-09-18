import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Lock, Calendar, MapPin, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateAge } from '../../../backend/utils/ageValidator'; // Frontend age calculator

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('female');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Kerala');
  const [district, setDistrict] = useState('Malappuram');
  const [dob, setDob] = useState('');
  const [confirm18Plus, setConfirm18Plus] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic location cascades
  const [countriesList, setCountriesList] = useState(['India', 'United States', 'United Kingdom', 'Canada', 'United Arab Emirates']);
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

  // Calculate age on frontend
  const computedAge = dob ? calculateAge(dob) : 0;
  const isUnder18 = dob && computedAge < 18;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password || !dob) {
      toast.error('Please fill in all required registration fields.');
      return;
    }

    if (isUnder18) {
      toast.error('Registration blocked. You must be at least 18 years old to create an account.');
      return;
    }

    if (!confirm18Plus || !confirmTerms) {
      toast.error('Please check both confirmation boxes to proceed.');
      return;
    }

    setLoading(true);
    const success = await register({
      username: username.trim(),
      password,
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
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="ChatMate Logo"
            className="w-44 sm:w-48 h-auto mx-auto mb-2 object-contain filter drop-shadow-lg hover:scale-105 transition-transform duration-300"
          />
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-400 mt-1">Random People. Real Conversations. (18+)</p>
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
                placeholder="Choose a unique handle (e.g. Anu_Kerala)"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          {/* Cascading Location: Country -> State -> District */}
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

          {/* Date of Birth Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Date of Birth (Used only for 18+ verification)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={`w-full bg-slate-900/90 border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                  isUnder18 ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-800 focus:border-rose-500'
                }`}
              />
            </div>
            {dob && (
              <p className={`text-xs mt-1 font-semibold ${isUnder18 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isUnder18 ? `🚫 Age ${computedAge} — Under 18 accounts are strictly forbidden.` : `✅ Age ${computedAge} verified (18+ Compliant). Your DOB will never be shown publicly.`}
              </p>
            )}
          </div>

          {/* Checkboxes */}
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
                I confirm that I am strictly 18 years old or older.
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || isUnder18}
            className="w-full mt-2 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 rounded-xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account & E2EE Keys...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-rose-400 font-semibold hover:underline">
            Log in here
          </Link>
        </p>

      </div>
    </div>
  );
};
