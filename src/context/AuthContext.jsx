import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    sessionStorage.getItem('yoga-yen-token') || localStorage.getItem('yoga-yen-token') || '',
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = sessionStorage.getItem('yoga-yen-token') || localStorage.getItem('yoga-yen-token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const { user: currentUser } = await authApi.me(savedToken);
        setUser(currentUser);
        setToken(savedToken);
      } catch {
        sessionStorage.removeItem('yoga-yen-token');
        localStorage.removeItem('yoga-yen-token');
        setToken('');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (payload, { rememberMe = false } = {}) => {
    const { user: nextUser, token: nextToken, demo } = await authApi.login(payload);
    if (!nextToken || !nextUser) throw new Error('Unable to establish a signed-in session. Please try again.');
    setUser(nextUser);
    setToken(nextToken);
    sessionStorage.removeItem('yoga-yen-token');
    localStorage.removeItem('yoga-yen-token');
    (rememberMe ? localStorage : sessionStorage).setItem('yoga-yen-token', nextToken);
    return { user: nextUser, demo };
  };

  const register = async (payload) => {
    const result = await authApi.register(payload);
    if (!result.token || !result.user) return result;
    setUser(result.user);
    setToken(result.token);
    localStorage.removeItem('yoga-yen-token');
    sessionStorage.setItem('yoga-yen-token', result.token);
    return { ...result, authenticated: true };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout request failed', error);
    }
    setUser(null);
    setToken('');
    sessionStorage.removeItem('yoga-yen-token');
    localStorage.removeItem('yoga-yen-token');
  };

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    register,
    logout,
    setUser,
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
