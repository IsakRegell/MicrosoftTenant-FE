import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage for existing auth on app start
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setUser(parsed);
      } catch (error) {
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const login = (role: UserRole) => {
    // TODO: Replace with real Entra ID integration
    const mockUser: User = {
      role,
      name: role === 'admin' ? 'Admin Användare' : 'Kund Användare',
      email: role === 'admin' ? 'admin@company.se' : 'customer@company.se'
    };
    
    setUser(mockUser);
    localStorage.setItem('auth', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}