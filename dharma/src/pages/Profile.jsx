import { useState, useRef } from 'react';
import { LogOut, Camera, Save, Lock, Cloud, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../hooks/useStorage';

const AVATAR_COLORS = [
  '#E8843C', '#C9A961', '#2D3561', '#5B6BAF',
  '#059669', '#E11D48', '#7C3AED', '#0EA5E9',
];

function AvatarCircle({ name, color, photo, size = 64 }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  if (photo) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}>
        <img src={photo} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold select-none flex-shrink-0"
      style={{ width: size, height: size, background: color, color: 'white', fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function resizeImageToBase64(file, size = 150) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Profile({ onClose }) {
  const { user, logoutUser, updateUserProfile, changePassword, syncing, lastSync } = useAuth();
  const { state } = useStorage();
  const fileInputRef = useRef(null);

  const [name,     setName]     = useState(user?.name        || '');
  const [bio,      setBio]      = useState(user?.bio         || '');
  const [color,    setColor]    = useState(user?.avatarColor || '#E8843C');
  const [photo,    setPhoto]    = useState(user?.avatarPhoto || null);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');

  const [currPw,  setCurrPw]   = useState('');
  const [newPw,   setNewPw]    = useState('');
  const [pwMsg,   setPwMsg]    = useState('');
  const [pwBusy,  setPwBusy]   = useState(false);

  const isGoogleUser = !!user?.googleId;

  /* Stats from local storage */
  const totalDays = Object.keys(state.logs || {}).filter((d) => {
    const dayLog = state.logs[d] || {};
    return Object.values(dayLog).some((e) => e?.done);
  }).length;
  const bookmarkCount  = (state.bookmarks || []).length;
  const journalEntries = (state.notebook  || []).length;
  const focusSessions  = (state.focusLog  || []).length;

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImageToBase64(file, 150);
    setPhoto(base64);
  }

  function handleRemovePhoto() {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await updateUserProfile({ name: name.trim(), bio: bio.trim(), avatarColor: color, avatarPhoto: photo });
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

      <div className="relative w-full max-w-md rounded-3xl z-10 page-transition overflow-y-auto max-h-[90svh] scrollbar-thin bg-[#F4F2EE] dark:bg-[#0f0e1a] border border-black/8 dark:border-white/8"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-4 px-5 py-4 border-b border-black/6 dark:border-white/6 bg-[#F4F2EE]/95 dark:bg-[#0f0e1a]/95 backdrop-blur-xl">
          <AvatarCircle name={name || user?.name} color={color} photo={photo} size={48} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-[#1a1a2e] dark:text-white truncate">{user?.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-stone-400 truncate">
              {user?.email}
              {isGoogleUser && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4' }}>
                  Google
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-stone-400">
            {syncing ? (
              <><Cloud size={12} className="animate-pulse" /> syncing…</>
            ) : lastSync ? (
              <><CheckCircle2 size={12} className="text-emerald-500" /> synced</>
            ) : null}
          </div>
          <button onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xl leading-none ml-1">×</button>
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
              <div key={l} className="text-center py-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/8">
                <div className="text-xl font-bold text-[#E8843C] tabular-nums">{v}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          {/* Edit profile */}
          <form onSubmit={handleSaveProfile} className="space-y-4 p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/8">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Profile</div>

            {/* Avatar photo upload */}
            <div>
              <p className="text-xs text-stone-400 mb-2">Profile photo</p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <AvatarCircle name={name || user?.name} color={color} photo={photo} size={56} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-all hover:scale-110"
                    style={{ background: 'linear-gradient(135deg,#E8843C,#C9A961)' }}
                    title="Upload photo"
                  >
                    <Camera size={11} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-xl font-medium text-stone-600 dark:text-stone-300 border border-black/10 dark:border-white/10 hover:border-[#E8843C] transition-colors"
                  >
                    Upload photo
                  </button>
                  {photo && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <X size={10} /> Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            {/* Avatar color picker */}
            <div>
              <p className="text-xs text-stone-400 mb-2">Avatar colour {photo && <span className="text-stone-300">(used when no photo)</span>}</p>
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
            </div>

            <div>
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60}
                className="mt-1 w-full text-sm bg-stone-50 dark:bg-white/8 border border-black/8 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={2}
                placeholder="A short intention or mantra…"
                className="mt-1 w-full text-sm bg-stone-50 dark:bg-white/8 border border-black/8 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[#E8843C] transition-colors resize-none font-verse italic" />
            </div>

            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#E8843C,#C9A961)' }}>
                <Save size={13} />
                {saving ? 'Saving…' : 'Save profile'}
              </button>
              {saveMsg && (
                <span className={`text-xs font-medium flex items-center gap-1 ${saveMsg === 'saved' ? 'text-emerald-500' : 'text-red-400'}`}>
                  {saveMsg === 'saved' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {saveMsg === 'saved' ? 'Saved!' : saveMsg}
                </span>
              )}
            </div>
          </form>

          {/* Change password — hidden for Google-only accounts */}
          {!isGoogleUser && (
            <form onSubmit={handleChangePassword} className="space-y-3 p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/8">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                <Lock size={10} /> Change Password
              </div>
              <input value={currPw} onChange={(e) => setCurrPw(e.target.value)} required type="password" placeholder="Current password"
                className="w-full text-sm bg-stone-50 dark:bg-white/8 border border-black/8 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
              <input value={newPw} onChange={(e) => setNewPw(e.target.value)} required type="password" placeholder="New password (min 8 chars)"
                className="w-full text-sm bg-stone-50 dark:bg-white/8 border border-black/8 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
              <div className="flex items-center gap-2">
                <button type="submit" disabled={pwBusy}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#2D3561,#5B6BAF)' }}>
                  {pwBusy ? 'Changing…' : 'Change'}
                </button>
                {pwMsg && (
                  <span className={`text-xs font-medium ${pwMsg === 'Password changed' ? 'text-emerald-500' : 'text-red-400'}`}>
                    {pwMsg}
                  </span>
                )}
              </div>
            </form>
          )}

          {/* Sign out */}
          <button onClick={logoutUser}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
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
