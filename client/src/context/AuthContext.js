import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE = 'https://pwani-sparks.onrender.com';

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  const getFirebaseToken = useCallback(async (fbUser) => {
    try {
      return await fbUser.getIdToken();
    } catch {
      return '';
    }
  }, []);

  const fetchProfile = useCallback(async (idToken, fbUser) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(idToken);
        localStorage.setItem('token', idToken);
      } else {
        const data = await res.json();
        if (data.msg?.includes('register')) {
          setUser(null);
          setToken(idToken);
          localStorage.setItem('token', idToken);
        }
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const idToken = await getFirebaseToken(fbUser);
        await fetchProfile(idToken, fbUser);
        setEmailVerified(fbUser.emailVerified);
      } else {
        setUser(null);
        setToken('');
        setEmailVerified(false);
        localStorage.removeItem('token');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [getFirebaseToken, fetchProfile]);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.msg || 'Login failed');
    }
    const data = await res.json();
    setUser(data.user);
    setToken(idToken);
    setEmailVerified(cred.user.emailVerified);
    localStorage.setItem('token', idToken);
  };

  const register = async (email, password, username, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    const idToken = await cred.user.getIdToken();
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({ username, name })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.msg || 'Registration failed');
    }
    const data = await res.json();
    setUser(data.user);
    setToken(idToken);
    setEmailVerified(false);
    localStorage.setItem('token', idToken);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await firebaseUser.reload();
      setEmailVerified(firebaseUser.emailVerified);
      const idToken = await getFirebaseToken(firebaseUser);
      await fetchProfile(idToken, firebaseUser);
    }
  };

  const value = {
    token,
    user,
    login,
    register,
    logout,
    loading,
    refreshUser,
    firebaseUser,
    emailVerified,
    sendEmailVerification: () => firebaseUser && sendEmailVerification(firebaseUser)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
