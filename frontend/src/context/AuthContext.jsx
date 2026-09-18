import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
  importPublicKey,
} from '../crypto/e2ee';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('privacy_token') || '');
  const [keyPair, setKeyPair] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session automatically on page load
  useEffect(() => {
    const restoreSession = async () => {
      if (token) {
        try {
          const res = await fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            setUser(data.user);
            await ensureKeyPair(data.user);
          } else {
            clearSessionData();
          }
        } catch (err) {
          console.error('Session restore error:', err);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, [token]);

  // Ensure E2EE keypair is ready
  const ensureKeyPair = async (currentUser) => {
    try {
      let privKeyStr = sessionStorage.getItem(`e2ee_priv_${currentUser._id}`);
      let pubKeyStr = currentUser.publicKey || sessionStorage.getItem(`e2ee_pub_${currentUser._id}`);

      if (!privKeyStr) {
        const kp = await generateKeyPair();
        pubKeyStr = await exportPublicKey(kp.publicKey);
        privKeyStr = await exportPrivateKey(kp.privateKey);

        sessionStorage.setItem(`e2ee_priv_${currentUser._id}`, privKeyStr);
        sessionStorage.setItem(`e2ee_pub_${currentUser._id}`, pubKeyStr);

        setKeyPair(kp);

        await fetch('/api/users/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('privacy_token')}`,
          },
          body: JSON.stringify({ publicKey: pubKeyStr }),
        });
      } else {
        const privateKey = await importPrivateKey(privKeyStr);
        const publicKey = await importPublicKey(pubKeyStr);
        setKeyPair({ privateKey, publicKey });
      }
    } catch (err) {
      console.error('Failed to initialize E2EE keypair:', err);
    }
  };

  const createProfile = async (formData) => {
    try {
      // 1. Generate local E2EE keypair before creating profile
      const kp = await generateKeyPair();
      const pubKeyStr = await exportPublicKey(kp.publicKey);
      const privKeyStr = await exportPrivateKey(kp.privateKey);

      // 2. Call backend profile creation endpoint
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publicKey: pubKeyStr,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create profile');
        return false;
      }

      sessionStorage.setItem(`e2ee_priv_${data.user._id}`, privKeyStr);
      sessionStorage.setItem(`e2ee_pub_${data.user._id}`, pubKeyStr);
      setKeyPair(kp);

      localStorage.setItem('privacy_token', data.token);
      setToken(data.token);
      setUser(data.user);
      toast.success(`Welcome to Aura, ${data.user.username}!`);
      return true;
    } catch (err) {
      toast.error('Network error during profile setup.');
      return false;
    }
  };

  const clearSessionData = () => {
    localStorage.removeItem('privacy_token');
    if (user) {
      sessionStorage.removeItem(`e2ee_priv_${user._id}`);
      sessionStorage.removeItem(`e2ee_pub_${user._id}`);
    }
    setToken('');
    setUser(null);
    setKeyPair(null);
  };

  const clearSession = async () => {
    try {
      if (token) {
        await fetch('/api/auth/leave', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      // Ignore network errors on session clear
    }
    clearSessionData();
    toast.success('Session cleared from this device.');
  };

  const updateProfile = async (updatedData) => {
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        toast.success(data.message || 'Profile updated successfully.');
        return true;
      } else {
        toast.error(data.error || 'Failed to update profile');
        return false;
      }
    } catch (err) {
      toast.error('Network error updating profile');
      return false;
    }
  };

  const deleteProfile = async () => {
    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Your profile and data have been deleted.');
        clearSessionData();
        return true;
      } else {
        toast.error(data.error || 'Failed to delete profile');
        return false;
      }
    } catch (err) {
      toast.error('Network error executing profile deletion');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        keyPair,
        loading,
        createProfile,
        clearSession,
        updateProfile,
        deleteProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
