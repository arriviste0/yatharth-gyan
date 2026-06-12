import { useEffect, useRef } from 'react';
import ShankhaSVG from './svgs/ShankhaSVG';

function Particle({ x, y, color, size, delay }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        backgroundColor: color,
        animation: `confetti-fall 1.8s ease-out ${delay}s both`,
      }}
    />
  );
}

const COLORS = ['#C9A961', '#E8843C', '#5B6BAF', '#5A8A8A', '#fff', '#f0d080'];
const PARTICLES = Array.from({ length: 42 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: -10 + Math.random() * 30,
  color: COLORS[i % COLORS.length],
  size: 4 + Math.random() * 6,
  delay: Math.random() * 0.8,
}));

export default function DayCelebration({ onClose }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 3200);
    return () => clearTimeout(timerRef.current);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{ background: 'rgba(7,7,15,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <style>{`
        @keyframes confetti-fall {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(110vh) rotate(720deg) scale(0.4); }
        }
        @keyframes celebrate-in {
          0%   { opacity: 0; transform: scale(0.7) translateY(20px); }
          60%  { transform: scale(1.06) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => <Particle key={p.id} {...p} />)}
      </div>

      {/* Card */}
      <div
        className="relative z-10 text-center px-8 py-10 rounded-3xl max-w-xs w-full mx-4"
        style={{
          background: 'linear-gradient(145deg, #0d0f28 0%, #1a1a3e 100%)',
          border: '1px solid rgba(201,169,97,0.35)',
          boxShadow: '0 0 60px rgba(201,169,97,0.2), 0 24px 60px rgba(0,0,0,0.6)',
          animation: 'celebrate-in 0.55s cubic-bezier(0.34,1.4,0.64,1) both',
        }}
      >
        <div className="flex justify-center mb-4">
          <ShankhaSVG size={52} color="#C9A961" />
        </div>
        <div
          className="font-dev text-5xl mb-2"
          style={{ color: '#C9A961', textShadow: '0 0 20px rgba(201,169,97,0.5)' }}
        >
          धर्म
        </div>
        <div className="text-white font-bold text-xl mb-2">All done for today</div>
        <p className="font-verse italic text-sm leading-relaxed mb-5" style={{ color: 'rgba(201,169,97,0.8)' }}>
          "कर्तव्यमाचर" — You fulfilled your duty.
        </p>
        <button
          onClick={onClose}
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          tap to close
        </button>
      </div>
    </div>
  );
}
