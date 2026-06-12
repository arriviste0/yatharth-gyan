export default function ShankhaSVG({ className = '', size = 32, color = '#C9A961' }) {
  return (
    <svg
      viewBox="0 0 60 70"
      width={size}
      height={size * 1.2}
      className={className}
    >
      {/* Main conch body */}
      <path
        d="M30 8 Q50 10 54 28 Q56 42 48 52 Q40 62 28 64 Q16 64 12 54 Q8 44 12 34 Q16 22 30 8 Z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Spiral interior */}
      <path
        d="M30 18 Q42 20 44 30 Q45 38 40 44 Q35 50 28 50"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 24 Q38 26 39 34 Q39 40 35 44"
        stroke={color}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M30 30 Q35 32 35 38"
        stroke={color}
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Tip */}
      <path
        d="M30 8 Q26 4 24 2"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M24 2 Q20 1 18 3"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Opening */}
      <path
        d="M28 64 Q22 66 16 62"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Ridge lines */}
      <path d="M18 42 Q14 36 16 28" stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M50 36 Q52 28 48 20" stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}
