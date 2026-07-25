import { useState } from 'react';
import { X, Eye, EyeOff, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, onSuccess }) {
  const { register, loginUser, loginWithGoogle } = useAuth();
  const [mode,     setMode]     = useState('login');
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

  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-3xl p-7 z-10 page-transition bg-[#FAF6F0] dark:bg-[#181925] border border-black/5 dark:border-white/10 shadow-2xl">

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white bg-black/5 dark:bg-white/5 transition-all">
          <X size={15} />
        </button>

        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#EF5A34] to-[#E6A04E] flex items-center justify-center font-bold text-2xl text-white shadow-lg mb-3">
            ॐ
          </div>
          <h3 className="text-xl font-extrabold text-[#18191E] dark:text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {mode === 'login' ? 'Sign in to sync your sadhana logs' : 'Begin your journey with Dharma Practice'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl p-1 mb-5 bg-black/5 dark:bg-white/5">
          <button onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-[#232638] text-[#EF5A34] shadow-sm'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-white'
            }`}>
            Sign In
          </button>
          <button onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-[#232638] text-[#EF5A34] shadow-sm'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-white'
            }`}>
            Sign Up
          </button>
        </div>

        {/* Google sign-in */}
        {googleClientId && (
          <div className="mb-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
                theme="outline"
                shape="pill"
                text="continue_with"
                size="large"
              />
            </div>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-stone-400 bg-[#FAF6F0] dark:bg-[#181925]">or</span>
              </div>
            </div>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Arjuna"
                required
                className="w-full text-xs text-[#18191E] dark:text-white placeholder-stone-400 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-[#EF5A34] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seeker@dharma.com"
              required
              className="w-full text-xs text-[#18191E] dark:text-white placeholder-stone-400 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-[#EF5A34] transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-xs text-[#18191E] dark:text-white placeholder-stone-400 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-4 pr-10 py-3 outline-none focus:border-[#EF5A34] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 mt-2 rounded-2xl text-xs font-bold uppercase tracking-wider text-white shadow-xl transition-all active:scale-98 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #EF5A34 0%, #E84D25 100%)' }}
          >
            {busy ? 'Processing…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
