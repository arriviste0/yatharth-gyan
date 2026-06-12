export default function PeacockFeather({ className = '', size = 120, animated = false }) {
  return (
    <svg
      viewBox="0 0 80 160"
      width={size * 0.5}
      height={size}
      className={className}
      style={animated ? { animation: 'breath-pulse 3s ease-in-out infinite' } : {}}
    >
      {/* Main quill */}
      <path
        d="M40 155 Q38 120 39 80 Q39.5 40 40 15"
        stroke="#5A8A8A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Barbs - left side */}
      {[20, 35, 50, 65, 80, 95, 110, 125, 138].map((y, i) => {
        const spread = 3 + i * 1.5;
        const curve = spread * 0.6;
        return (
          <path
            key={`l${i}`}
            d={`M ${39 - i * 0.2} ${y} Q ${39 - spread * 0.6} ${y + 4} ${39 - spread} ${y + 2}`}
            stroke="#C9A961"
            strokeWidth={1.2 - i * 0.05}
            fill="none"
            strokeLinecap="round"
            opacity={0.7 + i * 0.03}
          />
        );
      })}

      {/* Barbs - right side */}
      {[20, 35, 50, 65, 80, 95, 110, 125, 138].map((y, i) => {
        const spread = 3 + i * 1.5;
        return (
          <path
            key={`r${i}`}
            d={`M ${41 + i * 0.2} ${y} Q ${41 + spread * 0.6} ${y + 4} ${41 + spread} ${y + 2}`}
            stroke="#C9A961"
            strokeWidth={1.2 - i * 0.05}
            fill="none"
            strokeLinecap="round"
            opacity={0.7 + i * 0.03}
          />
        );
      })}

      {/* Eye of the feather */}
      <ellipse cx="40" cy="22" rx="10" ry="14" fill="#2D3561" opacity="0.15" />
      <ellipse cx="40" cy="22" rx="7" ry="10" fill="#2D3561" opacity="0.25" />
      <ellipse cx="40" cy="22" rx="4" ry="6" fill="#5A8A8A" opacity="0.7" />
      <ellipse cx="40" cy="22" rx="2" ry="3" fill="#2D3561" />
      <circle cx="39" cy="21" r="1" fill="white" opacity="0.5" />

      {/* Iridescent shimmer lines */}
      <path d="M33 18 Q36 14 40 12 Q44 14 47 18" stroke="#E8843C" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M31 23 Q35 28 40 30 Q45 28 49 23" stroke="#C9A961" strokeWidth="0.8" fill="none" opacity="0.4" />
    </svg>
  );
}
