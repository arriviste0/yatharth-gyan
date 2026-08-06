import { useState } from 'react';
import { X, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, onSuccess }) {
  const { register, loginUser, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  const customGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setBusy(true);
      try {
        await loginWithGoogle({ access_token: tokenResponse.access_token });
        onSuccess?.();
        onClose();
      } catch (err) {
        setError(err.response?.data?.error || 'Google sign-in failed');
      } finally {
        setBusy(false);
      }
    },
    onError: () => setError('Google sign-in failed'),
  });

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-[32px] p-6 z-10 bg-white dark:bg-[#181A26] border border-stone-100 dark:border-white/10 shadow-2xl text-stone-900 dark:text-white page-transition">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 transition-all"
        >
          <X size={16} />
        </button>

        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="font-dev text-4xl text-stone-900 dark:text-white mb-1 font-bold">धर्म</div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            {mode === 'login' ? 'Welcome back to your practice' : 'Begin your journey'}
          </p>
        </div>

        {/* Google sign-in */}
        <div className="mb-5 space-y-3">
          <button
            type="button"
            onClick={() => customGoogleLogin()}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full bg-stone-50 dark:bg-white/5 text-stone-800 dark:text-white border border-stone-200 dark:border-white/10 shadow-xs hover:bg-stone-100 font-bold text-xs transition-all"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] uppercase tracking-wider text-stone-400 font-extrabold bg-white dark:bg-[#181A26]">
                or use email
              </span>
            </div>
          </div>
        </div>

        {/* Tab Toggle Switch */}
        <div className="flex gap-1 bg-stone-100 dark:bg-white/5 p-1 rounded-full mb-5">
          {[
            { id: 'login', label: 'Sign In', Icon: LogIn },
            { id: 'register', label: 'Register', Icon: UserPlus },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { setMode(id); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold transition-all ${
                mode === id
                  ? 'bg-[#18191E] text-white dark:bg-[#00F0FF] dark:text-[#080C18] shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5 block">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="input-pill w-full"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              placeholder="you@example.com"
              className="input-pill w-full"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                className="input-pill w-full pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full p-2.5 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full btn-pill-dark py-3.5 text-xs font-extrabold uppercase tracking-wider disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-[11px] text-stone-400 text-center mt-4 font-medium">
          Your data is stored privately. No tracking.
        </p>
      </div>
    </div>
  );
}
