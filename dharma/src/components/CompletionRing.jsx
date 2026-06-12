import { useState, useEffect } from 'react';
import LotusBloom from './svgs/LotusBloom';

export default function CompletionRing({ completion = 0, done = 0, total = 0, size = 120 }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    // Start from 0 then animate to actual completion on mount
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setAnimated(completion), 80);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // After initial mount, track real completion changes instantly
  useEffect(() => {
    setAnimated(completion);
  }, [completion]);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animated);
  const pct = Math.round(completion * 100);

  const strokeColor = pct >= 80 ? '#C9A961' : pct >= 50 ? '#E8843C' : '#5A8A8A';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="#E8E0D0" className="dark:opacity-20" strokeWidth="7" fill="none" />
        <circle
          cx="50" cy="50" r={radius}
          stroke={strokeColor}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.75s cubic-bezier(0.34,1.2,0.64,1), stroke 0.4s ease' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {completion >= 0.8 ? (
          <LotusBloom completion={completion} size={52} />
        ) : (
          <>
            <span className="text-2xl font-bold font-sans" style={{ color: strokeColor }}>
              {pct}%
            </span>
            <span className="text-[10px] text-stone-400 mt-0.5">
              {done}/{total}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
