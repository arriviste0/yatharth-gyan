import { useState } from 'react';
import { X, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, onSuccess }) {
  const { register, loginUser } = useAuth();
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), password);
      } else {
        await loginUser(email.trim(), password);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-3xl p-6 z-10 page-transition"
        style={{
          background: 'linear-gradient(160deg, #0d0d1f 0%, #131325 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-300"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <X size={15} />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="font-dev text-4xl text-[#C9A961] mb-1">धर्म</div>
          <p className="text-xs text-stone-500">
            {mode === 'login' ? 'Welcome back to your practice' : 'Begin your dharma journey'}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 rounded-xl p-1 mb-5" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {[
            { id: 'login',    label: 'Sign In',  Icon: LogIn },
            { id: 'register', label: 'Register', Icon: UserPlus },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setMode(id); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === id
                  ? 'bg-white/10 text-white'
                  : 'text-stone-500 hover:text-stone-300'
              }`}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name"
                className="mt-1 w-full text-sm text-white placeholder-stone-600 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com"
              className="mt-1 w-full text-sm text-white placeholder-stone-600 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-[#E8843C] transition-colors" />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Password</label>
            <div className="relative mt-1">
              <input value={password} onChange={(e) => setPassword(e.target.value)} required
                type={showPw ? 'text' : 'password'} placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                className="w-full text-sm text-white placeholder-stone-600 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-10 outline-none focus:border-[#E8843C] transition-colors" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-400 transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-900/20 rounded-xl px-3 py-2 text-center">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: busy ? 'rgba(232,132,60,0.4)' : 'linear-gradient(135deg,#E8843C,#C9A961)' }}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-[10px] text-stone-600 text-center mt-4">
          Your data is stored privately. No tracking.
        </p>
      </div>
    </div>
  );
}
