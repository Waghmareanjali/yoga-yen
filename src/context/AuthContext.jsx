import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/authApi';
import { previewAccount } from '../constants/previewAccount';
import { getPreviewProfile, isPreviewMode, updatePreviewProfile } from '../data/previewData';

const AuthContext = createContext(null);
const TOKEN_KEY = 'yoga-yen-token';
const USER_KEY = 'yoga-yen-user';
const PREVIEW_SESSION_KEY = 'yoga-yen-preview-session';
const LEGACY_DEMO_KEYS = ['yoga-yen-accounts', 'yoga-yen-session', 'yoga-yen-demo-profile'];

function isPreviewSession() {
  return Boolean(previewAccount && sessionStorage.getItem(PREVIEW_SESSION_KEY) === 'active');
}

function clearLegacyDemoData() {
  LEGACY_DEMO_KEYS.forEach((key) => localStorage.removeItem(key));
  if (localStorage.getItem(TOKEN_KEY) === 'demo-token') localStorage.removeItem(TOKEN_KEY);
  if (sessionStorage.getItem(TOKEN_KEY) === 'demo-token') sessionStorage.removeItem(TOKEN_KEY);
}

function readSavedUser() {
  clearLegacyDemoData();
  if (import.meta.env.DEV && isPreviewSession()) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return getPreviewProfile();
  }
  if (!localStorage.getItem(TOKEN_KEY)) return null;
  const savedUser = localStorage.getItem(USER_KEY);
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error('Unable to read the saved Yoga Yen user profile.', error);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function saveSession(user, token) {
  if (!user || !token) {
    throw new Error('The authentication response was incomplete. Please try again.');
  }
  const normalizedUser = {
    ...user,
    name: user.full_name || user.name || user.email?.split('@')[0] || '',
  };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  return normalizedUser;
}

function clearSession() {
  sessionStorage.removeItem(PREVIEW_SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(readSavedUser);
  const userRef = useRef(user);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY) && !(import.meta.env.DEV && isPreviewSession())));

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (import.meta.env.DEV && isPreviewSession()) return undefined;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return undefined;

    let active = true;
    authApi.me(token)
      .then(({ user: currentUser }) => {
        if (!currentUser) throw new Error('The authentication service did not return a user profile.');
        if (active) {
          const restoredUser = saveSession(currentUser, token);
          userRef.current = restoredUser;
          setUserState(restoredUser);
        }
      })
      .catch((error) => {
        if (!active) return;
        console.error('Unable to restore the Yoga Yen session.', error);
        if (error?.status === 401) clearSession();
        userRef.current = null;
        setUserState(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const setUser = useCallback((update) => {
    const next = typeof update === 'function' ? update(userRef.current) : update;
    if (!next) return;
    const normalizedUser = {
      ...next,
      name: next.full_name || next.name || '',
    };
    if (import.meta.env.DEV && isPreviewMode()) {
      updatePreviewProfile(normalizedUser);
      userRef.current = normalizedUser;
      setUserState(normalizedUser);
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    userRef.current = normalizedUser;
    setUserState(normalizedUser);
  }, []);

  const login = useCallback(async (details) => {
    const email = details.email.trim().toLowerCase();
    if (previewAccount && email === previewAccount.email) {
      if (details.password !== previewAccount.password) {
        throw new Error('Invalid email or password.');
      }
      clearSession();
      sessionStorage.setItem(PREVIEW_SESSION_KEY, 'active');
      userRef.current = previewAccount.user;
      setUserState(previewAccount.user);
      return { user: previewAccount.user, preview: true };
    }

    const result = await authApi.login(details);
    const authenticatedUser = saveSession(result.user, result.token);
    userRef.current = authenticatedUser;
    setUserState(authenticatedUser);
    return { user: authenticatedUser };
  }, []);

  const register = useCallback(async (details) => {
    const result = await authApi.register(details);
    if (!result.token) return { registered: true };
    const authenticatedUser = saveSession(result.user, result.token);
    userRef.current = authenticatedUser;
    setUserState(authenticatedUser);
    return { user: authenticatedUser, authenticated: true };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    userRef.current = null;
    setUserState(null);
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user),
    loading,
  }), [user, setUser, login, register, logout, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
