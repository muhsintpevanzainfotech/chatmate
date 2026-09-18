import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Users, MapPin, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { UserCard } from '../components/UserCard';
import { FilterDrawer } from '../components/FilterDrawer';
import { ReportModal } from '../components/ReportModal';
import { BlockModal } from '../components/BlockModal';
import { CardSkeleton } from '../components/SkeletonLoader';

export const MeetPeoplePage = () => {
  const { token, user } = useAuth();
  const socketContext = useSocket();
  const onlineUsersMap = socketContext?.onlineUsersMap || new Map();
  const onlineCount = socketContext?.onlineCount || 0;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    gender: 'everyone',
    country: user?.country || 'India',
    state: user?.state || 'Kerala',
    district: 'All',
    onlyOnline: false,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [selectedBlockUser, setSelectedBlockUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.gender && filters.gender !== 'everyone') query.append('gender', filters.gender);
      if (filters.country) query.append('country', filters.country);
      if (filters.state && filters.state !== 'All') query.append('state', filters.state);
      if (filters.district && filters.district !== 'All') query.append('district', filters.district);

      const res = await fetch(`/api/users/discover?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        let fetchedList = data.users || [];
        if (filters.onlyOnline) {
          fetchedList = fetchedList.filter((u) => onlineUsersMap.get(u._id));
        }
        setUsers(fetchedList);
      }
    } catch (err) {
      console.error('Fetch discovery users error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, token, onlineUsersMap]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      gender: 'everyone',
      country: 'India',
      state: 'Kerala',
      district: 'All',
      onlyOnline: false,
    });
  };

  const handleBlockedSuccess = (blockedId) => {
    setUsers((prev) => prev.filter((u) => u._id !== blockedId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Page Title & Filter Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-rose-500" />
              Meet People
            </h1>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineCount > 0 ? onlineCount : 1} Online</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Discover compatible 18+ members by gender and place.
          </p>
        </div>

        {/* Quick Filter Selection Bar */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Gender Select */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {['female', 'male', 'everyone'].map((g) => (
              <button
                key={g}
                onClick={() => setFilters((prev) => ({ ...prev, gender: g }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
                  filters.gender === g
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Quick Filter Drawer Trigger */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-semibold text-slate-200 rounded-2xl transition-all"
          >
            <Filter className="w-4 h-4 text-rose-500" />
            <span>Filter Location</span>
            {(filters.state !== 'All' || filters.district !== 'All') && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchUsers}
            title="Refresh List"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Filter Tags */}
      <div className="flex items-center gap-2 mb-6 text-xs text-slate-400 flex-wrap">
        <span className="font-semibold text-slate-500">Active Filters:</span>
        <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-rose-400 capitalize">
          Gender: {filters.gender}
        </span>
        <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-rose-400">
          State: {filters.state}
        </span>
        {filters.district !== 'All' && (
          <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-rose-400">
            District: {filters.district}
          </span>
        )}
      </div>

      {/* User Discovery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((targetUser) => (
            <UserCard
              key={targetUser._id}
              targetUser={targetUser}
              isOnline={!!onlineUsersMap.get(targetUser._id)}
              onBlock={(u) => setSelectedBlockUser(u)}
              onReport={(u) => setSelectedReportUser(u)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 my-12 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Search className="w-8 h-8 text-rose-500/70" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">No people found</h3>
          <p className="text-sm text-slate-400 mb-6">
            Try changing your gender or place filters to see more members near you.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/25 transition-all"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={!!selectedReportUser}
        onClose={() => setSelectedReportUser(null)}
        targetUser={selectedReportUser}
      />

      {/* Block Modal */}
      <BlockModal
        isOpen={!!selectedBlockUser}
        onClose={() => setSelectedBlockUser(null)}
        targetUser={selectedBlockUser}
        onBlockedSuccess={handleBlockedSuccess}
      />

    </div>
  );
};
