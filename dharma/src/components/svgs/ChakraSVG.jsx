export default function ChakraSVG({ className = '', size = 60, color = '#C9A961', rotating = true }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const spokes = 24;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={rotating ? { animation: 'chakra-spin 25s linear infinite' } : {}}
    >
      {/* Outer rim */}
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="2" fill="none" />
      {/* Inner rim */}
      <circle cx={cx} cy={cy} r={r * 0.6} stroke={color} strokeWidth="1.2" fill="none" />
      {/* Hub */}
      <circle cx={cx} cy={cy} r={r * 0.15} fill={color} />

      {/* Spokes */}
      {Array.from({ length: spokes }).map((_, i) => {
        const angle = (i / spokes) * 2 * Math.PI;
        const x1 = cx + r * 0.15 * Math.cos(angle);
        const y1 = cy + r * 0.15 * Math.sin(angle);
        const x2 = cx + r * 0.58 * Math.cos(angle);
        const y2 = cy + r * 0.58 * Math.sin(angle);
        const x3 = cx + r * 0.62 * Math.cos(angle);
        const y3 = cy + r * 0.62 * Math.sin(angle);
        const x4 = cx + r * 0.98 * Math.cos(angle);
        const y4 = cy + r * 0.98 * Math.sin(angle);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" />
            <line x1={x3} y1={y3} x2={x4} y2={y4} stroke={color} strokeWidth="1" />
          </g>
        );
      })}

      {/* Outer decorative points */}
      {Array.from({ length: spokes / 2 }).map((_, i) => {
        const angle = (i / (spokes / 2)) * 2 * Math.PI;
        const px = cx + (r + 1) * Math.cos(angle);
        const py = cy + (r + 1) * Math.sin(angle);
        return <circle key={i} cx={px} cy={py} r="1.5" fill={color} />;
      })}
    </svg>
  );
}
