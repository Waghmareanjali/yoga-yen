import { createContext, useContext, useMemo, useState } from 'react';
import { mockUser } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(mockUser);

  const value = useMemo(() => ({
    user,
    setUser,
    isAuthenticated: false,
    loading: false,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
