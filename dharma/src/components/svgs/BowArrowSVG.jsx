export default function BowArrowSVG({ className = '', size = 28, color = '#E8843C' }) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={className}
    >
      {/* Bow */}
      <path
        d="M20 10 Q8 40 20 70"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bowstring */}
      <line x1="20" y1="10" x2="20" y2="70" stroke={color} strokeWidth="1" strokeDasharray="3,3" />

      {/* Arrow shaft */}
      <line x1="22" y1="40" x2="72" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* Arrowhead */}
      <path d="M72 32 L62 28 L66 35 Z" fill={color} />

      {/* Fletching */}
      <path d="M22 40 L16 34 L22 40 L16 46" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
