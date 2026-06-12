import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as authApi    from '../api/auth';
import * as progressApi from '../api/progress';
import { setCloudSyncCallback } from '../hooks/useStorage';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = 'dharma_token';

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const syncTimerRef = useRef(null);

  /* ── Cloud sync helpers ──────────────────────────────────────── */
  const syncToCloud = useCallback(async (appState) => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    setSyncing(true);
    try {
      const { syncedAt } = await progressApi.saveProgress(appState);
      setLastSync(new Date(syncedAt));
    } catch { /* silent — local data is safe */ }
    finally { setSyncing(false); }
  }, []);

  /* Debounced: fires 4 s after last state change */
  const scheduledSync = useCallback((appState) => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncToCloud(appState), 4000);
  }, [syncToCloud]);

  /* Register the debounced sync into the storage layer */
  useEffect(() => {
    setCloudSyncCallback(scheduledSync);
    return () => setCloudSyncCallback(null);
  }, [scheduledSync]);

  /* Restore session on mount */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    authApi.fetchMe()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  /* ── Auth actions ────────────────────────────────────────────── */
  const register = useCallback(async (name, email, password) => {
    const { token, user: u } = await authApi.register(name, email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  }, []);

  const loginUser = useCallback(async (email, password) => {
    const { token, user: u } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  }, []);

  const logoutUser = useCallback(async () => {
    clearTimeout(syncTimerRef.current);
    await authApi.logout();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setLastSync(null);
  }, []);

  const pullFromCloud = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    try {
      const { data } = await progressApi.fetchProgress();
      return data;
    } catch { return null; }
  }, []);

  const updateUserProfile = useCallback(async (updates) => {
    const updated = await progressApi.updateProfile(updates);
    setUser(updated);
    return updated;
  }, []);

  const changePassword = useCallback(async (curr, next) => {
    return progressApi.changePassword(curr, next);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, syncing, lastSync,
      register, loginUser, logoutUser,
      syncToCloud, pullFromCloud,
      updateUserProfile, changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
