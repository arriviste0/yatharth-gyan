export default function ChariotSVG({ className = '', opacity = 1 }) {
  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      {/* Ground line */}
      <line x1="20" y1="185" x2="380" y2="185" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />

      {/* Wheels */}
      <circle cx="110" cy="175" r="30" stroke="#2D3561" strokeWidth="2" />
      <circle cx="110" cy="175" r="4" fill="#2D3561" />
      {[0,45,90,135].map((deg) => (
        <line
          key={deg}
          x1={110 + 4 * Math.cos(deg * Math.PI / 180)}
          y1={175 + 4 * Math.sin(deg * Math.PI / 180)}
          x2={110 + 26 * Math.cos(deg * Math.PI / 180)}
          y2={175 + 26 * Math.sin(deg * Math.PI / 180)}
          stroke="#2D3561" strokeWidth="1.5"
        />
      ))}
      {[22.5, 67.5, 112.5, 157.5].map((deg) => (
        <line
          key={deg}
          x1={110 + 4 * Math.cos(deg * Math.PI / 180)}
          y1={175 + 4 * Math.sin(deg * Math.PI / 180)}
          x2={110 + 26 * Math.cos(deg * Math.PI / 180)}
          y2={175 + 26 * Math.sin(deg * Math.PI / 180)}
          stroke="#2D3561" strokeWidth="1" opacity="0.6"
        />
      ))}

      <circle cx="270" cy="175" r="30" stroke="#2D3561" strokeWidth="2" />
      <circle cx="270" cy="175" r="4" fill="#2D3561" />
      {[0,45,90,135].map((deg) => (
        <line
          key={deg}
          x1={270 + 4 * Math.cos(deg * Math.PI / 180)}
          y1={175 + 4 * Math.sin(deg * Math.PI / 180)}
          x2={270 + 26 * Math.cos(deg * Math.PI / 180)}
          y2={175 + 26 * Math.sin(deg * Math.PI / 180)}
          stroke="#2D3561" strokeWidth="1.5"
        />
      ))}
      {[22.5, 67.5, 112.5, 157.5].map((deg) => (
        <line
          key={deg}
          x1={270 + 4 * Math.cos(deg * Math.PI / 180)}
          y1={175 + 4 * Math.sin(deg * Math.PI / 180)}
          x2={270 + 26 * Math.cos(deg * Math.PI / 180)}
          y2={175 + 26 * Math.sin(deg * Math.PI / 180)}
          stroke="#2D3561" strokeWidth="1" opacity="0.6"
        />
      ))}

      {/* Chariot body */}
      <path d="M95 145 L120 100 L270 100 L285 145 Z" stroke="#2D3561" strokeWidth="2" fill="none" />
      <line x1="95" y1="145" x2="285" y2="145" stroke="#2D3561" strokeWidth="2" />
      {/* Chariot decorations */}
      <line x1="120" y1="100" x2="120" y2="145" stroke="#2D3561" strokeWidth="1" opacity="0.5" />
      <line x1="160" y1="100" x2="155" y2="145" stroke="#2D3561" strokeWidth="1" opacity="0.5" />
      <line x1="200" y1="100" x2="195" y2="145" stroke="#2D3561" strokeWidth="1" opacity="0.5" />
      <line x1="240" y1="100" x2="242" y2="145" stroke="#2D3561" strokeWidth="1" opacity="0.5" />

      {/* Horses - stylized */}
      <path d="M40 145 Q55 120 70 110 Q75 100 80 98 Q82 95 85 98 L88 105 Q85 108 82 112 Q78 118 75 125 L80 145" stroke="#2D3561" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M25 145 Q40 120 55 110 Q60 100 65 98 Q67 95 70 98 L73 105 Q70 108 67 112 Q63 118 60 125 L65 145" stroke="#2D3561" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Horse heads */}
      <ellipse cx="84" cy="96" rx="5" ry="4" stroke="#2D3561" strokeWidth="1.5" fill="none" />
      <ellipse cx="69" cy="96" rx="5" ry="4" stroke="#2D3561" strokeWidth="1.5" fill="none" />
      {/* Manes */}
      <path d="M82 92 Q80 88 79 85" stroke="#2D3561" strokeWidth="1" fill="none" />
      <path d="M67 92 Q65 88 64 85" stroke="#2D3561" strokeWidth="1" fill="none" />
      {/* Reins */}
      <path d="M89 100 Q100 110 110 115" stroke="#2D3561" strokeWidth="1" fill="none" strokeDasharray="3,2" />
      <path d="M74 100 Q90 108 108 113" stroke="#2D3561" strokeWidth="1" fill="none" strokeDasharray="3,2" />

      {/* Krishna - charioteer (left figure) */}
      {/* Body */}
      <line x1="155" y1="130" x2="155" y2="103" stroke="#2D3561" strokeWidth="2.5" strokeLinecap="round" />
      {/* Head */}
      <circle cx="155" cy="98" r="7" stroke="#2D3561" strokeWidth="1.5" fill="none" />
      {/* Crown/peacock feather */}
      <path d="M152 91 Q154 85 155 83 Q156 85 158 91" stroke="#2D3561" strokeWidth="1" fill="none" />
      <circle cx="155" cy="82" r="2" fill="#C9A961" />
      {/* Arms holding reins */}
      <line x1="155" y1="115" x2="140" y2="120" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="155" y1="115" x2="142" y2="118" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />
      {/* Dhoti flowing */}
      <path d="M151 130 L148 145" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M159 130 L161 145" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />

      {/* Arjuna - warrior (right figure) */}
      <line x1="195" y1="130" x2="195" y2="103" stroke="#2D3561" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="195" cy="98" r="7" stroke="#2D3561" strokeWidth="1.5" fill="none" />
      {/* Helmet */}
      <path d="M188 98 Q188 91 195 88 Q202 91 202 98" stroke="#2D3561" strokeWidth="1.5" fill="none" />
      <line x1="195" y1="88" x2="195" y2="83" stroke="#2D3561" strokeWidth="1.5" />
      {/* Bow */}
      <path d="M200 110 Q215 115 218 130" stroke="#2D3561" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="200" y1="110" x2="218" y2="130" stroke="#2D3561" strokeWidth="1" strokeDasharray="2,2" />
      {/* Arrow */}
      <line x1="206" y1="112" x2="225" y2="108" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M225 108 L222 105 L225 108 L222 111" fill="#2D3561" />
      {/* Arms */}
      <line x1="195" y1="112" x2="205" y2="115" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M191 130 L189 145" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M199 130 L201 145" stroke="#2D3561" strokeWidth="1.5" strokeLinecap="round" />

      {/* Flag on chariot */}
      <line x1="240" y1="100" x2="240" y2="65" stroke="#2D3561" strokeWidth="1.5" />
      <path d="M240 65 L260 70 L240 78 Z" fill="#E8843C" opacity="0.7" />
      {/* Hanuman on flag - simplified */}
      <circle cx="250" cy="72" r="3" stroke="#2D3561" strokeWidth="1" fill="none" />
    </svg>
  );
}
