export default function MandalaBg({ className = '', opacity = 0.04, size = 400, color = '#2D3561' }) {
  const rings = 6;
  const petals = 12;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={{ opacity }}
    >
      {/* Concentric circles */}
      {Array.from({ length: rings }).map((_, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={30 + i * 28}
          stroke={color}
          strokeWidth="0.5"
          fill="none"
        />
      ))}

      {/* Petal rings */}
      {[1, 2, 3].map((ring) => {
        const r = 30 + ring * 28;
        return Array.from({ length: petals }).map((_, i) => {
          const angle = (i / petals) * 2 * Math.PI;
          const x1 = cx + (r - 12) * Math.cos(angle);
          const y1 = cy + (r - 12) * Math.sin(angle);
          const x2 = cx + (r + 12) * Math.cos(angle);
          const y2 = cy + (r + 12) * Math.sin(angle);
          const mx = cx + r * Math.cos(angle + Math.PI / petals);
          const my = cy + r * Math.sin(angle + Math.PI / petals);
          return (
            <path
              key={`${ring}-${i}`}
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              stroke={color}
              strokeWidth="0.5"
              fill="none"
            />
          );
        });
      })}

      {/* Cross lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 2 * Math.PI;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + (size / 2 - 10) * Math.cos(angle)}
            y2={cy + (size / 2 - 10) * Math.sin(angle)}
            stroke={color}
            strokeWidth="0.3"
          />
        );
      })}

      {/* OM symbol in center */}
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fontSize="28"
        fontFamily="serif"
        fill={color}
        opacity="0.5"
      >
        ॐ
      </text>
    </svg>
  );
}
