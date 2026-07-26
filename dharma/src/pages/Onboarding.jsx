import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Flame } from 'lucide-react';
import MandalaBg from '../components/svgs/MandalaBg';
import krishnaImg from '../assets/krishna.png';
import kaImg from '../assets/ka.png';

// ─── Phase order ────────────────────────────────────────────────────────────
// dark → stars → figures → dialogue → verse → ready → closing → done
const PHASE_TIMINGS = [
  { phase: 'stars', delay: 500 },
  { phase: 'figures', delay: 1400 },
  { phase: 'dialogue', delay: 2600 },
  { phase: 'verse', delay: 4200 },
  { phase: 'ready', delay: 5800 },
];

// ─── Typewriter ──────────────────────────────────────────────────────────────
function TypeWriter({ text, speed = 50, startDelay = 0, className = '' }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        setShown(prev => {
          if (prev >= text.length) { clearInterval(iv); return prev; }
          return prev + 1;
        });
      }, speed);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t);
  }, [text, startDelay, speed]);

  return (
    <span className={className}>
      {text.slice(0, shown)}
      {shown < text.length && <span className="animate-pulse opacity-70 text-[#F05A36]">|</span>}
    </span>
  );
}

// ─── Star field ──────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 65 }, (_, i) => ({
  id: i,
  x: Math.sin(i * 137.5 * Math.PI / 180) * 50 + 50,
  y: (i * 1.618) % 100,
  r: [0.8, 1, 1.2, 1.5, 0.6][i % 5],
  delay: (i * 0.13) % 3,
  dur: 2.5 + (i % 4) * 0.8,
}));

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('dark');
  const [closing, setClosing] = useState(false);
  const timersRef = useRef([]);

  // Auto-advance phases
  useEffect(() => {
    timersRef.current = PHASE_TIMINGS.map(({ phase: p, delay }) =>
      setTimeout(() => setPhase(p), delay)
    );
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // Skip to ready on tap (before ready phase)
  function handleSkip() {
    if (phase === 'ready' || phase === 'closing') return;
    timersRef.current.forEach(clearTimeout);
    setPhase('ready');
  }

  // Begin — temple-door closing animation then navigate
  function handleBegin(e) {
    e.stopPropagation();
    setClosing(true);
    setTimeout(() => {
      onComplete();
      navigate('/home');
    }, 900);
  }

  const vis = (p) => phase === p || PHASE_TIMINGS.findIndex(x => x.phase === p) <
    PHASE_TIMINGS.findIndex(x => x.phase === phase) ||
    (phase === 'ready' || phase === 'closing');

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none cursor-pointer"
      style={{ background: 'radial-gradient(circle at 50% 30%, #161830 0%, #080916 60%, #03040a 100%)' }}
      onClick={handleSkip}
    >
      {/* ── Stars ────────────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          opacity: vis('stars') ? 1 : 0,
          transition: 'opacity 1.5s ease',
        }}
      >
        {STARS.map(s => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white">
            <animate
              attributeName="opacity"
              values="0.15;0.85;0.15"
              dur={`${s.dur}s`}
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>

      {/* ── Ambient Gold Horizon Glow ───────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(240,90,54,0.18) 0%, rgba(201,169,97,0.08) 50%, transparent 80%)',
          opacity: vis('stars') ? 1 : 0,
          transition: 'opacity 2s ease',
        }}
      />

      {/* ── Mandala background ───────────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10"
        style={{
          opacity: vis('figures') ? 0.09 : 0,
          transition: 'opacity 2s ease',
        }}
      >
        <MandalaBg size={Math.min(window.innerWidth, 680)} color="#F05A36" opacity={1} className="chakra-rotate" />
      </div>

      {/* ── Battlefield ground line ──────────────────────────────── */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '18%',
          left: 0, right: 0,
          height: '1.5px',
          background: 'linear-gradient(90deg, transparent, rgba(240,90,54,0.3) 20%, rgba(201,169,97,0.7) 50%, rgba(240,90,54,0.3) 80%, transparent)',
          opacity: vis('figures') ? 1 : 0,
          transition: 'opacity 1.5s ease',
        }}
      />

      {/* ── Figures area ─────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: '8%', bottom: '20%' }}
      >
        {/* Krishna (left) — normal orientation */}
        <img
          src={krishnaImg}
          alt="Krishna"
          style={{
            position: 'absolute',
            left: '2%',
            bottom: 0,
            width: 'clamp(140px, 28vw, 300px)',
            height: 'auto',
            objectFit: 'contain',
            objectPosition: 'bottom',
            opacity: vis('figures') ? 1 : 0,
            transform: vis('figures') ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 1.2s ease 0.1s, transform 1.2s ease 0.1s',
            filter: 'drop-shadow(0 0 28px rgba(240,90,54,0.4))',
          }}
        />

        {/* Arjuna (right) — mirrored */}
        <img
          src={krishnaImg}
          alt="Arjuna"
          style={{
            position: 'absolute',
            right: '2%',
            bottom: 0,
            width: 'clamp(140px, 28vw, 300px)',
            height: 'auto',
            objectFit: 'contain',
            objectPosition: 'bottom',
            opacity: vis('figures') ? 1 : 0,
            transform: vis('figures') ? 'translateY(0) scaleX(-1)' : 'translateY(30px) scaleX(-1)',
            transition: 'opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s',
            filter: 'drop-shadow(0 0 24px rgba(201,169,97,0.35))',
          }}
        />

        {/* Divine light aura between figures */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '20%',
            transform: 'translateX(-50%)',
            width: 'clamp(90px, 18vw, 160px)',
            height: 'clamp(90px, 18vw, 160px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,90,54,0.25) 0%, rgba(201,169,97,0.12) 50%, transparent 75%)',
            opacity: vis('dialogue') ? 1 : 0,
            transition: 'opacity 1.5s ease',
            animation: vis('dialogue') ? 'breath-pulse 4s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* ── Centre content ───────────────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none z-10">

        {/* ka.png logo */}
        <div
          style={{
            opacity: vis('stars') ? 1 : 0,
            transform: vis('stars') ? 'scale(1)' : 'scale(0.6)',
            transition: 'opacity 1.5s ease, transform 1.5s ease',
            marginBottom: 'clamp(10px, 2vh, 22px)',
            animation: 'breath-pulse 5s ease-in-out infinite',
          }}
        >
          <img src={kaImg} alt="Dharma" style={{
            width: 'clamp(60px, 11vw, 92px)',
            height: 'auto',
            filter: 'drop-shadow(0 0 20px rgba(240,90,54,0.6))',
          }} />
        </div>

        {/* Dialogue exchange */}
        {vis('dialogue') && (
          <div
            style={{
              opacity: vis('dialogue') ? 1 : 0,
              transition: 'opacity 0.8s ease',
              maxWidth: 'clamp(280px, 55vw, 520px)',
              width: '100%',
              marginBottom: 'clamp(12px, 2.5vh, 24px)',
            }}
            className="space-y-3"
          >
            {/* Arjuna's words */}
            <div
              className="rounded-3xl p-4 text-center backdrop-blur-xl bg-black/40 border border-[#C9A961]/25 shadow-2xl"
            >
              <p className="text-[10px] uppercase font-extrabold tracking-[0.25em] mb-1 text-[#C9A961]/70">
                अर्जुन उवाच
              </p>
              <p className="font-dev text-white/90" style={{ fontSize: 'clamp(12px, 2vw, 15px)', lineHeight: 1.7 }}>
                <TypeWriter
                  text="नष्टो मोहः स्मृतिर्लब्धा — मेरा भ्रम नष्ट हो गया है।"
                  speed={45}
                  startDelay={200}
                />
              </p>
            </div>

            {/* Krishna's reply */}
            <div
              className="rounded-3xl p-4 text-center backdrop-blur-xl bg-[#F05A36]/10 border border-[#F05A36]/30 shadow-2xl"
            >
              <p className="text-[10px] uppercase font-extrabold tracking-[0.25em] mb-1 text-[#F05A36]">
                श्रीकृष्ण उवाच
              </p>
              <p className="font-dev text-white" style={{ fontSize: 'clamp(12px, 2vw, 15px)', lineHeight: 1.7 }}>
                <TypeWriter
                  text="उत्तिष्ठ — अर्जुन। तुम्हारा धर्म तुम्हारी प्रतीक्षा में है।"
                  speed={45}
                  startDelay={1800}
                />
              </p>
            </div>
          </div>
        )}

        {/* Verse */}
        {vis('verse') && (
          <div
            style={{
              opacity: vis('verse') ? 1 : 0,
              transition: 'opacity 0.8s ease',
              maxWidth: 'clamp(280px, 52vw, 500px)',
              width: '100%',
              textAlign: 'center',
              marginBottom: 'clamp(14px, 3vh, 28px)',
            }}
          >
            <div
              className="rounded-3xl p-5 backdrop-blur-xl bg-black/50 border border-amber-500/25 shadow-2xl"
            >
              <p
                className="font-dev mb-2 font-extrabold"
                style={{
                  fontSize: 'clamp(14px, 2.5vw, 19px)',
                  background: 'linear-gradient(135deg, #F05A36, #FFD700, #C9A961)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 2,
                }}
              >
                <TypeWriter
                  text="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन"
                  speed={40}
                  startDelay={200}
                />
              </p>
              <p
                className="font-verse italic text-stone-300/80 font-medium"
                style={{
                  fontSize: 'clamp(11px, 1.8vw, 14px)',
                  opacity: vis('ready') ? 0.9 : 0,
                  transition: 'opacity 1s ease',
                }}
              >
                "You have a right to perform your duty — never to its fruits."
              </p>
              <p
                className="text-[10px] uppercase font-bold tracking-widest mt-2 text-[#C9A961]/60"
                style={{
                  opacity: vis('ready') ? 1 : 0,
                  transition: 'opacity 1s ease 0.3s',
                }}
              >
                Bhagavad Gita · 2.47
              </p>
            </div>
          </div>
        )}

        {/* Premium Upgrade Begin Practice Button */}
        <div
          style={{
            opacity: vis('ready') ? 1 : 0,
            transform: vis('ready') ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            pointerEvents: vis('ready') ? 'auto' : 'none',
          }}
          className="flex flex-col items-center gap-3 mt-2"
        >
          <button
            onClick={handleBegin}
            className="group relative px-8 py-4 sm:px-10 sm:py-4.5 rounded-2xl bg-gradient-to-r from-[#F05A36] via-[#E8843C] to-[#C9A961] text-white font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_40px_rgba(240,90,54,0.5)] hover:shadow-[0_0_65px_rgba(240,90,54,0.75)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 border border-white/30"
          >
            <Sparkles size={18} className="text-yellow-200 animate-pulse" />
            <span>Begin Daily Practice</span>
            <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300 text-white" />
          </button>

          <p className="text-[10px] sm:text-xs font-extrabold text-amber-200/40 uppercase tracking-[0.25em] animate-pulse">
            Tap anywhere to skip
          </p>
        </div>
      </div>

      {/* ── Temple doors ─────────────────────────────────────────── */}
      {/* Left door */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '50%', height: '100%',
          background: 'linear-gradient(135deg, #06071a 0%, #0d1030 100%)',
          borderRight: '1px solid rgba(201,169,97,0.3)',
          zIndex: 50,
          transform: closing ? 'translateX(0)' : 'translateX(-100%)',
          transition: closing ? 'transform 0.85s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 24,
        }}
      >
        <div style={{ opacity: 0.25 }}>
          <svg viewBox="0 0 60 160" width="40" height="110">
            <rect x="4" y="4" width="52" height="152" rx="6" fill="none" stroke="#C9A961" strokeWidth="1.5" />
            <rect x="10" y="10" width="40" height="140" rx="4" fill="none" stroke="#C9A961" strokeWidth="0.8" />
            <circle cx="30" cy="80" r="12" fill="none" stroke="#C9A961" strokeWidth="1" />
            <path d="M30 62 L30 58 M30 98 L30 102 M18 80 L14 80 M42 80 L46 80"
              stroke="#C9A961" strokeWidth="1" strokeLinecap="round" />
            <circle cx="30" cy="80" r="4" fill="#C9A961" opacity="0.4" />
            <path d="M20 30 Q30 24 40 30 M20 130 Q30 136 40 130"
              stroke="#C9A961" strokeWidth="1" fill="none" />
          </svg>
        </div>
      </div>

      {/* Right door */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0,
          width: '50%', height: '100%',
          background: 'linear-gradient(225deg, #06071a 0%, #0d1030 100%)',
          borderLeft: '1px solid rgba(201,169,97,0.3)',
          zIndex: 50,
          transform: closing ? 'translateX(0)' : 'translateX(100%)',
          transition: closing ? 'transform 0.85s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: 24,
        }}
      >
        <div style={{ opacity: 0.25 }}>
          <svg viewBox="0 0 60 160" width="40" height="110">
            <rect x="4" y="4" width="52" height="152" rx="6" fill="none" stroke="#C9A961" strokeWidth="1.5" />
            <rect x="10" y="10" width="40" height="140" rx="4" fill="none" stroke="#C9A961" strokeWidth="0.8" />
            <circle cx="30" cy="80" r="12" fill="none" stroke="#C9A961" strokeWidth="1" />
            <path d="M30 62 L30 58 M30 98 L30 102 M18 80 L14 80 M42 80 L46 80"
              stroke="#C9A961" strokeWidth="1" strokeLinecap="round" />
            <circle cx="30" cy="80" r="4" fill="#C9A961" opacity="0.4" />
            <path d="M20 30 Q30 24 40 30 M20 130 Q30 136 40 130"
              stroke="#C9A961" strokeWidth="1" fill="none" />
          </svg>
        </div>
      </div>

      {/* OM flash on door close */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity: closing ? 1 : 0,
          transition: closing ? 'opacity 0.3s ease 0.4s' : 'none',
        }}
      >
        <img src={kaImg} alt="Dharma" style={{
          width: 'clamp(64px, 12vw, 100px)',
          height: 'auto',
          filter: 'drop-shadow(0 0 24px rgba(240,90,54,0.8))',
        }} />
      </div>
    </div>
  );
}
