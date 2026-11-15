import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // localStorage survives a refresh, useState triggers a re-render
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  // { id, name, email, role } of the logged-in person
  const [user, setUser] = useState(null);

  // After a refresh we only have the token: ask the API who we are
  useEffect(() => {
    if (!token) return;
    apiFetch('/api/auth/me').then(setUser).catch(() => {});
  }, [token]);

  // Login and signup both answer { token, user }
  function saveSession(data) {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data);
  }

  async function signup(name, email, password, role) {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    saveSession(data);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  // Token died mid-session (401) -> back to the login screen
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, []);

  const value = { token, user, login, signup, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
