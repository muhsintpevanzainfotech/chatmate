import React, { useState, useEffect } from 'react';
import { Filter, X, RefreshCw, MapPin, Users } from 'lucide-react';

export const FilterDrawer = ({ isOpen, onClose, filters, onApplyFilters, onResetFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [countriesList, setCountriesList] = useState(['India', 'United States', 'United Kingdom', 'Canada', 'United Arab Emirates']);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Fetch States when Country changes
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch(`/api/locations/states?country=${encodeURIComponent(localFilters.country || 'India')}`);
        const data = await res.json();
        if (res.ok) {
          setStatesList(['All', ...data.states]);
        }
      } catch (err) {
        console.error('Failed to load states:', err);
      }
    };
    fetchStates();
  }, [localFilters.country]);

  // Fetch Districts when State changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!localFilters.state || localFilters.state === 'All') {
        setDistrictsList(['All']);
        return;
      }
      try {
        const res = await fetch(
          `/api/locations/districts?country=${encodeURIComponent(localFilters.country || 'India')}&state=${encodeURIComponent(localFilters.state)}`
        );
        const data = await res.json();
        if (res.ok) {
          setDistrictsList(['All', ...data.districts]);
        }
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, [localFilters.country, localFilters.state]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setLocalFilters((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'country') {
        updated.state = 'All';
        updated.district = 'All';
      } else if (field === 'state') {
        updated.district = 'All';
      }
      return updated;
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0a0d14] border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-white">Filter People</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gender Filter */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-rose-400" />
              Who do you want to meet?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['female', 'male', 'everyone'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleChange('gender', g)}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border capitalize transition-all ${
                    localFilters.gender === g
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-500 shadow-md shadow-rose-500/20'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filters */}
          <div className="mt-6 space-y-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Broad Location Selection
            </label>

            {/* Country */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Country</label>
              <select
                value={localFilters.country || 'India'}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              >
                {countriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">State / Region</label>
              <select
                value={localFilters.state || 'All'}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              >
                {statesList.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All States' : s}
                  </option>
                ))}
              </select>
            </div>

            {/* District / Place */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">District / Place</label>
              <select
                value={localFilters.district || 'All'}
                onChange={(e) => handleChange('district', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              >
                {districtsList.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Places' : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Online Toggle */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Only show online users</span>
            <input
              type="checkbox"
              checked={localFilters.onlyOnline || false}
              onChange={(e) => handleChange('onlyOnline', e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/25 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
