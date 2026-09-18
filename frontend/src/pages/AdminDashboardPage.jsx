import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldAlert, Users, Flag, Ban, CheckCircle2, Search, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const AdminDashboardPage = () => {
  const { token, user } = useAuth();
  const { onlineUsersMap } = useSocket();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    bannedUsers: 0,
    pendingReports: 0,
  });

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'reports'
  const [usersList, setUsersList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  };

  // Fetch Users Table
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/admin/users${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsersList(data.users || []);
    } catch (err) {
      console.error('Failed to fetch admin users list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Reports Table
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setReportsList(data.reports || []);
    } catch (err) {
      console.error('Failed to fetch admin reports list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      if (activeTab === 'users') fetchUsers();
      else fetchReports();
    }
  }, [user, activeTab, searchTerm, token]);

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchStats();
        fetchUsers();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleUpdateReport = async (reportId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success('Report updated.');
        fetchStats();
        fetchReports();
      }
    } catch (err) {
      toast.error('Failed to update report.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel rounded-3xl text-center text-rose-400">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-xs text-slate-400 mt-1">This panel is strictly reserved for platform administrators.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            Platform Safety & Moderation Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage user accounts, review safety reports, and enforce 18+ policy guidelines.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>E2EE Active (No Chat Reading Access)</span>
        </div>
      </div>

      {/* Dashboard Stat Cards (Spec #25) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Users</span>
          <p className="text-2xl font-extrabold text-white mt-1">{stats.totalUsers}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase">Active Users</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.activeUsers}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase">Online Now</span>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{onlineUsersMap.size}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase">Pending Reports</span>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{stats.pendingReports}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase">Suspended</span>
          <p className="text-2xl font-extrabold text-slate-400 mt-1">{stats.suspendedUsers + stats.bannedUsers}</p>
        </div>

      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'reports'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Flag className="w-4 h-4" />
          Safety Reports
          {stats.pendingReports > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-400 text-black font-extrabold rounded-full">
              {stats.pendingReports}
            </span>
          )}
        </button>
      </div>

      {/* Users Tab View */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search handle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Gender</th>
                    <th className="px-6 py-4">Place</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-900/40">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        {u.username}
                        {u.role === 'admin' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">Admin</span>
                        )}
                      </td>
                      <td className="px-6 py-4 capitalize">{u.gender}</td>
                      <td className="px-6 py-4">{u.state}, {u.district}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            u.accountStatus === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : u.accountStatus === 'suspended'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.accountStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {u.accountStatus === 'active' ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(u._id, 'suspended')}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg font-semibold"
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(u._id, 'banned')}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg font-semibold"
                            >
                              Ban
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(u._id, 'active')}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-semibold"
                          >
                            Unban / Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Reports Tab View */}
      {activeTab === 'reports' && (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Reported User</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reportsList.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-900/40">
                    <td className="px-6 py-4 font-medium text-white">
                      {r.reporterId ? r.reporterId.username : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-400">
                      {r.reportedUserId ? r.reportedUserId.username : 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-semibold capitalize">
                        {r.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{r.description || '—'}</td>
                    <td className="px-6 py-4 capitalize font-semibold">{r.status}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateReport(r._id, 'reviewed')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleUpdateReport(r._id, 'dismissed')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded font-medium"
                      >
                        Dismiss
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
