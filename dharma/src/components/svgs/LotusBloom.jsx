import { useEffect, useState } from 'react';

function Petal({ rotation, delay, bloomed }) {
  return (
    <g style={{ transformOrigin: '50% 70%', transform: `rotate(${rotation}deg)` }}>
      <ellipse
        cx="50"
        cy="38"
        rx="8"
        ry="18"
        fill="currentColor"
        opacity={bloomed ? 0.85 : 0}
        style={{
          transformOrigin: '50px 56px',
          transform: bloomed ? 'scaleY(1)' : 'scaleY(0)',
          transition: `transform 0.4s ease-in-out ${delay}s, opacity 0.4s ease-in-out ${delay}s`,
        }}
      />
    </g>
  );
}

export default function LotusBloom({ completion = 0, size = 80, className = '' }) {
  const [bloomed, setBloomed] = useState(false);
  const bloomed80 = completion >= 0.8;

  useEffect(() => {
    if (bloomed80 && !bloomed) {
      setBloomed(true);
    } else if (!bloomed80 && bloomed) {
      setBloomed(false);
    }
  }, [bloomed80]);

  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const innerAngles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Outer petals */}
      <g color="#E8843C">
        {petalAngles.map((angle, i) => (
          <Petal key={angle} rotation={angle} delay={i * 0.06} bloomed={bloomed} />
        ))}
      </g>
      {/* Inner petals */}
      <g color="#C9A961">
        {innerAngles.map((angle, i) => (
          <Petal key={angle} rotation={angle} delay={0.48 + i * 0.05} bloomed={bloomed} />
        ))}
      </g>
      {/* Center */}
      <circle
        cx="50"
        cy="56"
        r="10"
        fill="#C9A961"
        opacity={bloomed ? 1 : 0.3}
        style={{ transition: 'opacity 0.4s ease-in-out 0.88s' }}
      />
      <circle cx="50" cy="56" r="5" fill="#E8843C" />
      {/* Stem */}
      <line x1="50" y1="66" x2="50" y2="82" stroke="#5A8A8A" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 75 Q42 72 40 68" stroke="#5A8A8A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
