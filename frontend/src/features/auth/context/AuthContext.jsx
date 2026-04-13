import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authService } from '../services/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function loadFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function saveToStorage(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = loadFromStorage();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);

  const _applySession = useCallback((access_token, userData) => {
    saveToStorage(access_token, userData);
    setToken(access_token);
    setUser(userData);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password });
    _applySession(data.access_token, data.user);
    return data;
  }, [_applySession]);

  const register = useCallback(async (name, email, password) => {
    const data = await authService.register({ name, email, password });
    _applySession(data.access_token, data.user);
    return data;
  }, [_applySession]);

  const logout = useCallback(() => {
    clearStorage();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  }), [user, token, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
