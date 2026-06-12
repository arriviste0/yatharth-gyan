import { useState, useRef } from 'react';
import { Moon, Sun, Download, Upload, Trash2, ChevronRight, User, Bell, FileText } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';

const ACCENT_COLORS = [
  { id: 'saffron', label: 'Saffron',    primary: '#E8843C', secondary: '#C9A961' },
  { id: 'ocean',   label: 'Ocean',      primary: '#2563EB', secondary: '#0EA5E9' },
  { id: 'forest',  label: 'Forest',     primary: '#059669', secondary: '#34D399' },
  { id: 'rose',    label: 'Rose',       primary: '#E11D48', secondary: '#FB7185' },
];

function ToggleRow({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-1">
        <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{label}</div>
        {description && <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button onClick={() => onChange(!enabled)}
        className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 mt-0.5 relative ${
          enabled ? 'bg-[#2D3561]' : 'bg-stone-200 dark:bg-white/10'
        }`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${enabled ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { state, updateSettings, exportData, exportJournalMarkdown, importData, resetAllData } = useStorage();
  const { settings, focusLog = [] } = state;
  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [nameEdit, setNameEdit]         = useState(settings.name || '');
  const [notifStatus, setNotifStatus]   = useState(null);
  const fileRef = useRef(null);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target.result);
      setImportStatus(ok ? 'success' : 'error');
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function requestNotification() {
    if (!('Notification' in window)) { setNotifStatus('unsupported'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      updateSettings({ reminderEnabled: true });
      setNotifStatus('granted');
    } else {
      setNotifStatus('denied');
    }
    setTimeout(() => setNotifStatus(null), 3000);
  }

  const totalFocusMins = focusLog.reduce((s, f) => s + (f.duration || 0), 0);
  const focusSessions  = focusLog.length;
  const accentColor    = settings.accentColor || 'saffron';

  return (
    <div className="page-container page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">Settings</h1>
        <div className="text-sm text-stone-400">Preferences</div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

        {/* ── Left column ─────────────────────────────────────── */}
        <div>
          {/* Profile */}
          <div className="card mb-4">
            <div className="section-label mb-3">Profile</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-stone-100 dark:bg-white/8">
                <User size={18} className="text-stone-400" />
              </div>
              <input
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                onBlur={() => updateSettings({ name: nameEdit.trim() })}
                onKeyDown={(e) => { if (e.key === 'Enter') { updateSettings({ name: nameEdit.trim() }); e.target.blur(); } }}
                placeholder="Your name (for greeting)"
                className="flex-1 text-sm text-[#1a1a2e] dark:text-white placeholder-stone-400 bg-transparent outline-none border-b border-black/10 dark:border-white/10 focus:border-[#E8843C] transition-colors py-1"
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="card mb-4">
            <div className="section-label mb-3">Appearance</div>
            <button onClick={toggleTheme} className="flex items-center gap-3 w-full mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.theme === 'dark' ? 'bg-[#2D3561]/20' : 'bg-amber-50'}`}>
                {settings.theme === 'dark' ? <Moon size={18} style={{ color: '#8B9FE0' }} /> : <Sun size={18} className="text-amber-500" />}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                <div className="text-xs text-stone-400">Tap to toggle · auto-follows system on first open</div>
              </div>
              <ChevronRight size={16} className="text-stone-300" />
            </button>

            {/* Accent color */}
            <div>
              <p className="text-xs text-stone-400 mb-2">Accent colour</p>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button key={c.id} onClick={() => updateSettings({ accentColor: c.id })}
                    className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl border transition-all"
                    style={{
                      borderColor: accentColor === c.id ? c.primary : 'rgba(0,0,0,0.08)',
                      background: accentColor === c.id ? c.primary + '10' : 'transparent',
                    }}>
                    <div className="w-5 h-5 rounded-full" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})` }} />
                    <span className="text-[9px] font-semibold" style={{ color: accentColor === c.id ? c.primary : '#9CA3AF' }}>{c.label}</span>
                  </button>
                ))}
              </div>
              {accentColor !== 'saffron' && (
                <p className="text-[10px] text-stone-400 mt-2 italic">Accent colour applies on next reload.</p>
              )}
            </div>
          </div>

          {/* Practice */}
          <div className="card mb-4">
            <div className="section-label mb-1">Practice</div>
            <div className="divide-y divide-stone-100 dark:divide-white/5">
              <ToggleRow label="Silent Mode" description="Hide streak counts and statistics. Practise without watching the score."
                enabled={settings.silentMode} onChange={(v) => updateSettings({ silentMode: v })} />
              <ToggleRow label="Sound" description="Subtle chime on day completion (silent by default)."
                enabled={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
            </div>
          </div>

          {/* Reminders */}
          <div className="card mb-4">
            <div className="section-label mb-3">Daily Reminder</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-stone-100 dark:bg-white/8">
                <Bell size={18} className="text-stone-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Evening reminder</div>
                <div className="text-xs text-stone-400">Browser notification to log your practice</div>
              </div>
              <button onClick={() => updateSettings({ reminderEnabled: !settings.reminderEnabled })}
                className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 relative ${settings.reminderEnabled ? 'bg-[#2D3561]' : 'bg-stone-200 dark:bg-white/10'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.reminderEnabled ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            {settings.reminderEnabled && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-500">Remind at</span>
                <input type="time" value={settings.reminderTime || '20:00'}
                  onChange={(e) => updateSettings({ reminderTime: e.target.value })}
                  className="text-sm text-[#1a1a2e] dark:text-white bg-white dark:bg-white/10 border border-black/10 dark:border-white/12 rounded-xl px-3 py-2 outline-none focus:border-[#E8843C] transition-colors" />
                <button onClick={requestNotification}
                  className="text-xs px-3 py-2 rounded-xl font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#2D3561,#5B6BAF)' }}>
                  Allow
                </button>
              </div>
            )}
            {notifStatus && (
              <div className={`mt-2 text-xs px-3 py-2 rounded-xl text-center font-medium ${
                notifStatus === 'granted' ? 'bg-emerald-50 text-emerald-600' :
                notifStatus === 'denied' ? 'bg-red-50 text-red-500' :
                'bg-stone-100 text-stone-500'
              }`}>
                {notifStatus === 'granted' ? '✓ Notifications enabled'
                  : notifStatus === 'denied' ? '✗ Permission denied — enable in browser settings'
                  : '✗ Notifications not supported in this browser'}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ────────────────────────────────────── */}
        <div>
          {/* Focus stats */}
          {focusSessions > 0 && (
            <div className="card mb-4">
              <div className="section-label mb-3">Focus Practice</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(232,132,60,0.07)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#E8843C' }}>{focusSessions}</div>
                  <div className="text-xs text-stone-400 mt-0.5">sessions</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(45,53,97,0.07)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#5B6BAF' }}>{totalFocusMins}m</div>
                  <div className="text-xs text-stone-400 mt-0.5">total focused</div>
                </div>
              </div>
            </div>
          )}

          {/* Data */}
          <div className="card mb-4">
            <div className="section-label mb-3">Data</div>
            <div className="space-y-2">
              <button onClick={exportData}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 transition-all">
                <Download size={16} className="text-stone-400" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Export Data</div>
                  <div className="text-xs text-stone-400">Download all data as JSON</div>
                </div>
              </button>

              <button onClick={exportJournalMarkdown}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 transition-all">
                <FileText size={16} className="text-stone-400" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Export Journal</div>
                  <div className="text-xs text-stone-400">Download journal as readable Markdown</div>
                </div>
              </button>

              <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 transition-all">
                <Upload size={16} className="text-stone-400" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-[#1a1a2e] dark:text-white">Import Data</div>
                  <div className="text-xs text-stone-400">Restore from a previously exported JSON</div>
                </div>
              </button>

              {importStatus && (
                <div className={`text-xs px-3 py-2 rounded-xl text-center font-medium transition-all ${
                  importStatus === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {importStatus === 'success' ? '✓ Data imported successfully' : '✗ Invalid file — please use a Dharma export'}
                </div>
              )}

              {confirmReset ? (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3 font-verse">
                    This will delete all logs, pillars, notebook entries, and bookmarks. Cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { resetAllData(); setConfirmReset(false); }}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-red-500">
                      Yes, Reset Everything
                    </button>
                    <button onClick={() => setConfirmReset(false)}
                      className="flex-1 py-2 rounded-xl text-sm border border-stone-200 dark:border-white/10 text-stone-500">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmReset(true)}
                  className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all">
                  <Trash2 size={16} className="text-red-400" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-red-500">Reset All Data</div>
                    <div className="text-xs text-red-400/70">Start fresh. This cannot be undone.</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* About */}
          <div className="card">
            <div className="section-label mb-3">About</div>
            <div className="text-center py-4">
              <div className="font-dev text-4xl text-[#2D3561] dark:text-[#C9A961] mb-2">धर्म</div>
              <div className="text-sm text-stone-500 dark:text-stone-400 mb-1">Private Sadhana</div>
              <div className="font-verse italic text-xs text-stone-400 leading-relaxed max-w-xs mx-auto">
                "यतो धर्मस्ततो जयः"<br />
                Where there is dharma, there is victory.
              </div>
              <div className="mt-4 text-[10px] text-stone-300 dark:text-stone-600">
                No servers. No analytics. No ads.<br />Fully private. Fully yours.
              </div>
            </div>
          </div>
        </div>

      </div>
      <div className="h-8" />
    </div>
  );
}
