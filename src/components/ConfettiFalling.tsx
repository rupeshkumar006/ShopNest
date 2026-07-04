import React from 'react';

const confettiColors = [
  '#FF4CA0', // hot pink
  '#79DAFF', // sky blue
  '#FFD966', // warm yellow
  '#C9A7F5', // pastel purple
  '#A5F2D1', // mint
];

export default function ConfettiFalling({ className = '' }) {
  // Generate random confetti pieces
  const confetti = Array.from({ length: 15 }).map((_, i) => {
    const color = confettiColors[i % confettiColors.length];
    const left = Math.random() * 95 + '%';
    const size = 8 + Math.random() * 8;
    const delay = Math.random() * 2;
    const shape = i % 3;
    return (
      <div
        key={i}
        className={`absolute top-0 animate-confetti-fall`}
        style={{
          left,
          width: size,
          height: size,
          animationDelay: `${delay}s`,
          zIndex: 20,
        }}
      >
        {shape === 0 ? (
          <div style={{ width: size, height: size, borderRadius: '50%', background: color }} />
        ) : shape === 1 ? (
          <div style={{ width: size, height: size * 0.6, borderRadius: 3, background: color }} />
        ) : (
          <svg width={size} height={size}>
            <polygon points={`${size / 2},0 ${size},${size} 0,${size}`} fill={color} />
          </svg>
        )}
      </div>
    );
  });
  return (
    <div className={`pointer-events-none w-full h-full ${className}`} style={{ position: 'absolute', inset: 0 }}>
      {confetti}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(420px) rotate(360deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall 3.5s linear infinite;
        }
      `}</style>
    </div>
  );
} 