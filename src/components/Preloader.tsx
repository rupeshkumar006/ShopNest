import React, { useEffect, useRef, useState } from 'react';

const Sparkle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div
    className="absolute pointer-events-none animate-sparkle"
    style={{
      ...style,
      background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)',
    }}
  />
);

const Preloader: React.FC = () => {
  const [showFill, setShowFill] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showLine, setShowLine] = useState(false);
  const textRef = useRef<SVGTextElement>(null);

  // Generate random sparkles
  const sparkles = React.useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 80 + 10}%`,
      width: `${Math.random() * 6 + 2}px`,
      height: `${Math.random() * 6 + 2}px`,
      animationDelay: `${Math.random() * 2}s`,
      opacity: Math.random() * 0.7 + 0.3,
    }));
  }, []);

  useEffect(() => {
    // Sequence
    setTimeout(() => setShowFill(true), 1400);
    setTimeout(() => setShowGlow(true), 1600);
    setTimeout(() => setShowLine(true), 2000);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-stone-100 z-50 overflow-hidden">
      {/* Subtle gold glow background */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ${showGlow ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Sparkles */}
      {showGlow && sparkles.map((s, i) => (
        <Sparkle key={i} style={s} />
      ))}

      <svg
        width="800"
        height="300"
        viewBox="0 0 800 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <g>
          {/* Stroke Text */}
          <text
            ref={textRef}
            x="50%"
            y="50%"
            dy=".35em"
            textAnchor="middle"
            fontFamily="'Playfair Display', serif"
            fontSize="72"
            fontWeight="700"
            stroke="#D4AF37"
            strokeWidth="1.2"
            fill="none"
            style={{
              strokeDasharray: 1500,
              strokeDashoffset: showFill ? 0 : 1500,
              transition: 'stroke-dashoffset 2s cubic-bezier(0.77,0,0.18,1)',
              filter: showGlow ? 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))' : 'none',
              letterSpacing: '0.08em'
            }}
          >
            ShopNest
          </text>

          {/* Fill Text */}
          <text
            x="50%"
            y="50%"
            dy=".35em"
            textAnchor="middle"
            fontFamily="'Playfair Display', serif"
            fontSize="72"
            fontWeight="700"
            fill="url(#gold-gradient)"
            opacity={showFill ? 1 : 0}
            style={{
              filter: showGlow ? 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.3))' : 'none',
              transition: 'opacity 0.8s ease-in-out',
              letterSpacing: '0.08em'
            }}
          >
            ShopNest
          </text>
        </g>

        {/* Flourish Line */}
        {showLine && (
          <path
            d="M280,180 Q400,210 520,180"
            stroke="url(#line-gradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            style={{
              opacity: 0.9,
              strokeDasharray: 350,
              strokeDashoffset: showLine ? 0 : 350,
              transition: 'stroke-dashoffset 1.5s ease-out',
            }}
          />
        )}

        <defs>
          <linearGradient id="gold-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C5A028" />
            <stop offset="40%" stopColor="#F3E5AB" />
            <stop offset="60%" stopColor="#EBD77C" />
            <stop offset="100%" stopColor="#856911" />
          </linearGradient>
          <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Preloader;