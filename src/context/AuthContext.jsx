import { createContext, useContext, useMemo, useState } from 'react';
import { mockUser } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(mockUser);

  const enterPreview = (details = {}) => {
    const name = details.full_name?.trim()
      || details.name?.trim()
      || details.email?.trim().split('@')[0]
      || mockUser.name;
    const previewUser = { ...mockUser, ...details, name };
    setUser(previewUser);
    return { user: previewUser, demo: true };
  };

  const value = useMemo(() => ({
    user,
    setUser: (update) => setUser((current) => typeof update === 'function' ? update(current) : update),
    login: async (details = {}) => enterPreview(details),
    register: async (details = {}) => ({ ...enterPreview(details), authenticated: true }),
    isAuthenticated: true,
    loading: false,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
