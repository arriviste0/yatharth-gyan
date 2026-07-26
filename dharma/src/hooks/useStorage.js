import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dharma_app_v1';

const DEFAULT_FOLDERS = [
  { id: 'f-1', title: 'Daily Notes', color: '#E8843C', icon: 'calendar' },
  { id: 'f-2', title: 'Reflections', color: '#C9A961', icon: 'folder' },
  { id: 'f-3', title: 'Ideas & Insights', color: '#5A8A8A', icon: 'sparkles' },
  { id: 'f-4', title: 'Random Notes', color: '#2D3561', icon: 'trophy' },
];

function getInitialState() {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  return {
    settings: {
      theme: prefersDark ? 'dark' : 'light',
      silentMode: false,
      soundEnabled: false,
      onboardingComplete: false,
      name: '',
      accentColor: 'saffron',
      wordCountGoal: 0,
      reminderEnabled: false,
      reminderTime: '20:00',
    },
    pillars: [],
    logs: {},
    notebook: [],
    folders: DEFAULT_FOLDERS,
    bookmarks: [],
    chapterProgress: [],
    intentions: {},
    focusLog: [],
    shlokaAnnotations: {},
    readingPlanStart: null,
  };
}

const initialState = getInitialState();

function loadState() {
  const defaults = getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      pillars: parsed.pillars ?? [],
    };
  } catch {
    return defaults;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

let _globalState = loadState();
let _listeners = [];
let _syncCallback = null; // optional cloud-sync hook set by AuthProvider

function getState() { return _globalState; }

function setState(updater) {
  _globalState = typeof updater === 'function' ? updater(_globalState) : { ..._globalState, ...updater };
  saveState(_globalState);
  _listeners.forEach((fn) => fn(_globalState));
  _syncCallback?.(_globalState);
}

/* Called by AuthProvider to register a debounced cloud-sync trigger */
export function setCloudSyncCallback(fn) {
  _syncCallback = fn;
}

/* Called after login/register to hydrate local state from cloud */
export function loadFromCloud(data) {
  if (!data) return;
  const defaults = getInitialState();
  const merged = {
    ...defaults,
    ...data,
    settings: { ...defaults.settings, ...(data.settings || {}) },
    pillars: data.pillars ?? [],
  };
  _globalState = merged;
  saveState(merged);
  _listeners.forEach((fn) => fn(merged));
  if (merged.settings?.theme) {
    document.documentElement.classList.toggle('dark', merged.settings.theme === 'dark');
  }
}

export function useStorage() {
  const [state, setLocalState] = useState(_globalState);

  useEffect(() => {
    const listener = (s) => setLocalState({ ...s });
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter((l) => l !== listener); };
  }, []);

  const updateSettings = useCallback((updates) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...updates } }));
  }, []);

  const setPillars = useCallback((pillars) => {
    setState((s) => ({ ...s, pillars }));
  }, []);

  const logTarget = useCallback((dateStr, targetId, entry) => {
    setState((s) => ({
      ...s,
      logs: {
        ...s.logs,
        [dateStr]: {
          ...(s.logs[dateStr] || {}),
          [targetId]: entry,
        },
      },
    }));
  }, []);

  const addNotebookEntry = useCallback((entry) => {
    setState((s) => ({
      ...s,
      notebook: [entry, ...s.notebook.filter((e) => e.id !== entry.id)],
    }));
  }, []);

  const deleteNotebookEntry = useCallback((entryId) => {
    setState((s) => ({
      ...s,
      notebook: s.notebook.filter((e) => e.id !== entryId),
    }));
  }, []);

  const addFolder = useCallback((folder) => {
    setState((s) => ({
      ...s,
      folders: [...(s.folders || []), folder],
    }));
  }, []);

  const updateFolder = useCallback((id, updates) => {
    setState((s) => ({
      ...s,
      folders: (s.folders || []).map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  }, []);

  const deleteFolder = useCallback((id) => {
    setState((s) => ({
      ...s,
      folders: (s.folders || []).filter((f) => f.id !== id),
      notebook: (s.notebook || []).filter((e) => e.folderId !== id),
    }));
  }, []);

  const toggleBookmark = useCallback((shlokaId) => {
    setState((s) => ({
      ...s,
      bookmarks: s.bookmarks.includes(shlokaId)
        ? s.bookmarks.filter((id) => id !== shlokaId)
        : [...s.bookmarks, shlokaId],
    }));
  }, []);

  const markChapterRead = useCallback((chapterNum) => {
    setState((s) => ({
      ...s,
      chapterProgress: s.chapterProgress.includes(chapterNum)
        ? s.chapterProgress
        : [...s.chapterProgress, chapterNum],
    }));
  }, []);

  const setIntention = useCallback((dateStr, text) => {
    setState((s) => ({
      ...s,
      intentions: { ...s.intentions, [dateStr]: text },
    }));
  }, []);

  const logFocusSession = useCallback((session) => {
    setState((s) => ({
      ...s,
      focusLog: [session, ...(s.focusLog || [])].slice(0, 200),
    }));
  }, []);

  const saveShlokaAnnotation = useCallback((shlokaId, text) => {
    setState((s) => ({
      ...s,
      shlokaAnnotations: { ...(s.shlokaAnnotations || {}), [shlokaId]: text },
    }));
  }, []);

  const setReadingPlanStart = useCallback((date) => {
    setState((s) => ({ ...s, readingPlanStart: date }));
  }, []);

  const exportJournalMarkdown = useCallback(() => {
    const entries = [..._globalState.notebook].sort((a, b) => {
      const ka = a.date || a.weekStart;
      const kb = b.date || b.weekStart;
      return kb.localeCompare(ka);
    });
    const lines = ['# Dharma Journal\n'];
    for (const e of entries) {
      const dateStr = e.date || e.weekStart;
      lines.push(`## ${dateStr}${e.mood ? ` · mood ${e.mood}` : ''}`);
      if (e.tags?.length) lines.push(`_Tags: ${e.tags.map(t => '#' + t).join(' ')}_\n`);
      if (e.problem) lines.push(`**Problem noticed:**\n${e.problem}\n`);
      if (e.curiosity) lines.push(`**Curiosity explored:**\n${e.curiosity}\n`);
      if (e.gratitude) lines.push(`**Gratitude:**\n${e.gratitude}\n`);
      if (e.wins) lines.push(`**Wins:**\n${e.wins}\n`);
      lines.push('---\n');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dharma-journal-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(_globalState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dharma-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importData = useCallback((raw) => {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const defaults = getInitialState();
      const merged = {
        ...defaults,
        ...data,
        settings: { ...defaults.settings, ...(data.settings || {}) },
      };
      setState(merged);
      if (merged.settings?.theme) {
        document.documentElement.classList.toggle('dark', merged.settings.theme === 'dark');
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetAllData = useCallback(() => {
    setState({ ...initialState });
  }, []);

  return {
    state,
    updateSettings,
    setPillars,
    logTarget,
    addNotebookEntry,
    deleteNotebookEntry,
    addFolder,
    updateFolder,
    deleteFolder,
    toggleBookmark,
    markChapterRead,
    setIntention,
    logFocusSession,
    saveShlokaAnnotation,
    setReadingPlanStart,
    exportJournalMarkdown,
    exportData,
    importData,
    resetAllData,
  };
}
