import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import { MatchProvider } from './context/MatchContext';

import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';

import { FirstEntryPage } from './pages/FirstEntryPage';
import { MatchPage } from './pages/MatchPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import {
  TermsPage,
  PrivacyPolicyPage,
  SafetyPage,
  CommunityGuidelinesPage,
} from './pages/LegalPages';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-rose-500 font-bold">
        Loading Aura...
      </div>
    );
  }
  return user ? children : <Navigate to="/" replace />;
};

const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-rose-500 font-bold">
        Loading Aura...
      </div>
    );
  }
  return user ? <MatchPage /> : <FirstEntryPage />;
};

export const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <MatchProvider>
              
              <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between pb-16 md:pb-0">
                <Navbar />
                
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<RootRoute />} />
                    <Route path="/match" element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />
                    <Route path="/discover" element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />
                    <Route path="/meet" element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />

                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/safety" element={<SafetyPage />} />
                    <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

                <MobileNav />
                
                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: '#121824',
                      color: '#fff',
                      border: '1px solid #1f293d',
                    },
                  }}
                />
              </div>

            </MatchProvider>
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
