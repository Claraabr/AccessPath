import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api/client.js';

const AuthContext = createContext(null);
// The hook lives next to its context; fast refresh simply reloads this file in full
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // localStorage survives a refresh, useState triggers a re-render
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  // { id, name, email, role } of the logged-in person.
  // Kept in localStorage too, so after a refresh the menu is drawn right away
  // instead of appearing a moment later and pushing the page down (Lighthouse: layout shift).
  // The role here only picks which menu to show; the server still checks it on every request.
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

  // After a refresh we only have the token: ask the API who we are
  useEffect(() => {
    if (!token) return;
    apiFetch('/api/auth/me').then(setUser).catch(() => {});
  }, [token]);

  // Login and signup both answer { token, user }
  function saveSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
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
    localStorage.removeItem('user');
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
