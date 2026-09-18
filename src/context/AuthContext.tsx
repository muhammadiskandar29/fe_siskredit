import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => Promise<void>;
  hasPermission: (permissionName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('spk_token'));
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const savedToken = localStorage.getItem('spk_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/user');
          if (res.data.success) {
            setUser(res.data.data.user);
            setPermissions(res.data.data.permissions || []);
          }
        } catch (err) {
          console.error('Session expired', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, password = 'password') => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user, permissions } = res.data.data;
        localStorage.setItem('spk_token', token);
        localStorage.setItem('spk_user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        setPermissions(permissions || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('spk_token');
    localStorage.removeItem('spk_user');
    setToken(null);
    setUser(null);
    setPermissions([]);
  };

  const switchRoleQuick = async (targetRole: UserRole) => {
    let email = 'achmad.sobari@alazhar.org';
    if (targetRole === 'petugas_simpin') email = 'petugas.simpin@alazhar.org';
    if (targetRole === 'ketua_koperasi') email = 'ketua.koperasi@alazhar.org';

    await login(email, 'password');
  };

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.includes(permissionName);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        switchRoleQuick,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
