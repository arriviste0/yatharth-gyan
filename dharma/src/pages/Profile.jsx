import { useState } from 'react';
import { LogOut, Camera, Save, Lock, Cloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../hooks/useStorage';

const AVATAR_COLORS = [
  '#E8843C', '#C9A961', '#2D3561', '#5B6BAF',
  '#059669', '#E11D48', '#7C3AED', '#0EA5E9',
];

function AvatarCircle({ name, color, size = 64 }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center font-bold select-none flex-shrink-0"
      style={{ width: size, height: size, background: color, color: 'white', fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export default function Profile({ onClose }) {
  const { user, logoutUser, updateUserProfile, changePassword, syncing, lastSync } = useAuth();
  const { state } = useStorage();

  const [name,     setName]     = useState(user?.name     || '');
  const [bio,      setBio]      = useState(user?.bio      || '');
  const [color,    setColor]    = useState(user?.avatarColor || '#E8843C');
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');

  const [currPw,  setCurrPw]   = useState('');
  const [newPw,   setNewPw]    = useState('');
  const [pwMsg,   setPwMsg]    = useState('');
  const [pwBusy,  setPwBusy]   = useState(false);

  /* Stats from local storage */
  const totalDays = Object.keys(state.logs || {}).filter((d) => {
    const dayLog = state.logs[d] || {};
    return Object.values(dayLog).some((e) => e?.done);
  }).length;
  const bookmarkCount  = (state.bookmarks || []).length;
  const journalEntries = (state.notebook  || []).length;
  const focusSessions  = (state.focusLog  || []).length;

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await updateUserProfile({ name: name.trim(), bio: bio.trim(), avatarColor: color });
      setSaveMsg('saved');
    } catch (err) {
      setSaveMsg(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg('');
    try {
      await changePassword(currPw, newPw);
      setPwMsg('Password changed');
      setCurrPw(''); setNewPw('');
    } catch (err) {
      setPwMsg(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwBusy(false);
      setTimeout(() => setPwMsg(''), 3000);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl z-10 page-transition overflow-y-auto max-h-[90svh]"
        style={{
          background: '#F4F2EE',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-4 px-5 py-4 border-b border-black/6"
          style={{ background: 'rgba(244,242,238,0.95)', backdropFilter: 'blur(12px)' }}>
          <AvatarCircle name={name || user?.name} color={color} size={48} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-[#1a1a2e] truncate">{user?.name}</div>
            <div className="text-xs text-stone-400 truncate">{user?.email}</div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-stone-400">
            {syncing ? (
              <><Cloud size={12} className="animate-pulse" /> syncing…</>
            ) : lastSync ? (
              <><CheckCircle2 size={12} className="text-emerald-500" /> synced</>
            ) : null}
          </div>
          <button onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl leading-none ml-1">×</button>
        </div>

        <div className="px-5 py-5 space-y-5">

          {/* Practice stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: totalDays,      l: 'Days'     },
              { v: journalEntries, l: 'Journal'  },
              { v: bookmarkCount,  l: 'Saved'    },
              { v: focusSessions,  l: 'Focus'    },
            ].map(({ v, l }) => (
              <div key={l} className="card text-center py-3">
                <div className="text-xl font-bold text-[#E8843C] tabular-nums">{v}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          {/* Edit profile */}
          <form onSubmit={handleSaveProfile} className="card space-y-4">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Profile</div>

            {/* Avatar color picker */}
            <div>
              <p className="text-xs text-stone-400 mb-2">Avatar colour</p>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full transition-all"
                    style={{
                      background: c,
                      outline: color === c ? `3px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }} />
                ))}
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3 mt-3">
                <AvatarCircle name={name || user?.name} color={color} size={44} />
                <p className="text-xs text-stone-400 italic">Preview</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60}
                className="mt-1 w-full text-sm text-[#1a1a2e] bg-stone-50 border border-black/8 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={2}
                placeholder="A short intention or mantra…"
                className="mt-1 w-full text-sm text-[#1a1a2e] placeholder-stone-400 bg-stone-50 border border-black/8 rounded-xl px-3 py-2 outline-none focus:border-[#E8843C] transition-colors resize-none font-verse italic" />
            </div>

            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#E8843C,#C9A961)' }}>
                <Save size={13} />
                {saving ? 'Saving…' : 'Save profile'}
              </button>
              {saveMsg && (
                <span className={`text-xs font-medium flex items-center gap-1 ${saveMsg === 'saved' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {saveMsg === 'saved' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {saveMsg === 'saved' ? 'Saved!' : saveMsg}
                </span>
              )}
            </div>
          </form>

          {/* Change password */}
          <form onSubmit={handleChangePassword} className="card space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
              <Lock size={10} /> Change Password
            </div>
            <input value={currPw} onChange={(e) => setCurrPw(e.target.value)} required type="password" placeholder="Current password"
              className="w-full text-sm text-[#1a1a2e] bg-stone-50 border border-black/8 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
            <input value={newPw} onChange={(e) => setNewPw(e.target.value)} required type="password" placeholder="New password (min 8 chars)"
              className="w-full text-sm text-[#1a1a2e] bg-stone-50 border border-black/8 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
            <div className="flex items-center gap-2">
              <button type="submit" disabled={pwBusy}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#2D3561,#5B6BAF)' }}>
                {pwBusy ? 'Changing…' : 'Change'}
              </button>
              {pwMsg && (
                <span className={`text-xs font-medium ${pwMsg === 'Password changed' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pwMsg}
                </span>
              )}
            </div>
          </form>

          {/* Sign out */}
          <button onClick={logoutUser}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-all">
            <LogOut size={15} />
            Sign Out
          </button>

          <p className="text-[10px] text-stone-400 text-center pb-2">
            Joined {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
