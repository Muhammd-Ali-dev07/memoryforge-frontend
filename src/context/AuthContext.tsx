import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  userId: string;
  username: string;
  sessionToken: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('memoryforge_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch('https://postmeningeal-unversified-casandra.ngrok-free.dev/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    const userData: User = {
      userId: data.userId,
      username: data.username,
      sessionToken: data.sessionToken,
    };

    setUser(userData);
    localStorage.setItem('memoryforge_user', JSON.stringify(userData));
  };

  const register = async (username: string, password: string, email?: string) => {
    const response = await fetch('https://postmeningeal-unversified-casandra.ngrok-free.dev/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    const userData: User = {
      userId: data.userId,
      username: data.username,
      sessionToken: data.sessionToken,
    };

    setUser(userData);
    localStorage.setItem('memoryforge_user', JSON.stringify(userData));
  };

  const logout = () => {
    if (user) {
      fetch('https://postmeningeal-unversified-casandra.ngrok-free.dev/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.sessionToken}` },
      }).catch(console.error);
    }

    setUser(null);
    localStorage.removeItem('memoryforge_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};