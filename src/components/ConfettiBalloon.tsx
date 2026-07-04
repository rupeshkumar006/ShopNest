import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiBalloonProps {
  className?: string;
}

const balloonColors = [
  { stops: ['#ef4444', '#dc2626', '#991b1b'], shadow: 'rgba(239, 68, 68, 0.3)', knot: '#991b1b', main: '#ef4444' }, // red
  { stops: ['#ec4899', '#db2777', '#831843'], shadow: 'rgba(236, 72, 153, 0.3)', knot: '#831843', main: '#ec4899' }, // pink
  { stops: ['#3b82f6', '#2563eb', '#1e3a8a'], shadow: 'rgba(59, 130, 246, 0.3)', knot: '#1e3a8a', main: '#3b82f6' }, // blue
  { stops: ['#a855f7', '#7c3aed', '#581c87'], shadow: 'rgba(168, 85, 247, 0.3)', knot: '#581c87', main: '#a855f7' }, // purple
  { stops: ['#fde047', '#facc15', '#ca8a04'], shadow: 'rgba(253, 224, 71, 0.3)', knot: '#ca8a04', main: '#fde047' }, // yellow
  { stops: ['#22c55e', '#16a34a', '#166534'], shadow: 'rgba(34, 197, 94, 0.3)', knot: '#166534', main: '#22c55e' }, // green
  { stops: ['#fb923c', '#ea580c', '#7c2d12'], shadow: 'rgba(251, 146, 60, 0.3)', knot: '#7c2d12', main: '#fb923c' }, // orange
  { stops: ['#14b8a6', '#0d9488', '#134e4a'], shadow: 'rgba(20, 184, 166, 0.3)', knot: '#134e4a', main: '#14b8a6' }, // teal
];

const getRandomColorIndex = (excludeIndex?: number) => {
  let idx = Math.floor(Math.random() * balloonColors.length);
  if (excludeIndex !== undefined && balloonColors.length > 1) {
    while (idx === excludeIndex) {
      idx = Math.floor(Math.random() * balloonColors.length);
    }
  }
  return idx;
};

const ConfettiBalloon: React.FC<ConfettiBalloonProps> = ({ className }) => {
  const [isBurst, setIsBurst] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth * 0.5 - 30, y: 140 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [colorIndex, setColorIndex] = useState(() => getRandomColorIndex());

  useEffect(() => {
    setPosition({ x: window.innerWidth * 0.5 - 30, y: 140 });
  }, []);

  useEffect(() => {
    if (isBurst) {
      const timer = setTimeout(() => {
        setIsBurst(false);
        setPosition({
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 200),
        });
        setScale(1);
        setColorIndex((prev) => getRandomColorIndex(prev));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isBurst]);

  const handleBurst = () => {
    setIsBurst(true);
    setScale(1.3);
    const duration = 1.2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 320, ticks: 50, zIndex: 1000 };
    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 30 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.5, y: 0.5 },
        colors: balloonColors.map(c => c.main),
        shapes: ['circle', 'square'],
        gravity: 1.1
      });
      const balloonX = (position.x + 32) / window.innerWidth;
      const balloonY = (position.y + 40) / window.innerHeight;
      confetti({
        ...defaults,
        particleCount: particleCount * 0.5,
        origin: { x: balloonX, y: balloonY },
        colors: balloonColors.map(c => c.main),
        shapes: ['circle', 'square'],
        gravity: 1.1
      });
    }, 250);
  };

  if (isBurst) {
    return null;
  }

  const currentColor = balloonColors[colorIndex];
  const gradientId = `balloon-gradient-${colorIndex}`;

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-500 hover:scale-110 group ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y - 36}px`,
        transition: 'top 1.8s cubic-bezier(.7,0,.3,1)',
        transform: `scale(${scale})`,
        zIndex: 20,
      }}
      onClick={handleBurst}
    >
      {/* Subtle shadow under the balloon */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '88px',
        width: '40px',
        height: '10px',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.01) 80%)',
        borderRadius: '50%',
        transform: 'translateX(-50%)',
        filter: 'blur(1px)',
        zIndex: 1,
      }} />
      <div className="relative flex flex-col items-center z-10 animate-float-y">
        {/* Playful cartoon balloon SVG, 60x90px, with highlight and sparkles */}
        <svg width="60" height="90" viewBox="0 0 60 90" className="block" style={{ filter: `drop-shadow(0 8px 18px ${currentColor.shadow})` }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentColor.stops[0]} />
              <stop offset="60%" stopColor={currentColor.stops[1]} />
              <stop offset="100%" stopColor={currentColor.stops[2]} />
            </linearGradient>
          </defs>
          {/* Main cartoon balloon body: playful, squishy teardrop */}
          <path d="M30 12 C54 8, 58 44, 30 82 C2 44, 6 8, 30 12 Z" fill={`url(#${gradientId})`} />
          {/* Subtle cartoon shine (curved line) */}
          <path d="M34 20 Q36 18 38 22" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.8" />
          {/* Cute, pinched cartoon knot (two ellipses) */}
          <ellipse cx="28" cy="84" rx="2" ry="2.2" fill={currentColor.knot} />
          <ellipse cx="32" cy="84" rx="2" ry="2.2" fill={currentColor.knot} />
          {/* Knot twist line */}
          <path d="M28 87 Q30 85 32 87" stroke="#444" strokeWidth="0.8" fill="none" />
          {/* Cartoon face: round eyes with sparkle, blush, eyebrows, big smile */}
          {/* Left eye */}
          <circle cx="27" cy="41" r="1.1" fill="#222" />
          <circle cx="26.7" cy="40.7" r="0.25" fill="#fff" />
          {/* Right eye */}
          <circle cx="33" cy="41" r="1.1" fill="#222" />
          <circle cx="32.7" cy="40.7" r="0.25" fill="#fff" />
          {/* Blush dots */}
          <ellipse cx="25.5" cy="43" rx="0.6" ry="0.3" fill="#fbb6ce" />
          <ellipse cx="34.5" cy="43" rx="0.6" ry="0.3" fill="#fbb6ce" />
          {/* Eyebrows */}
          <path d="M26 39 Q27 38.2 28 39" stroke="#222" strokeWidth="0.4" fill="none" strokeLinecap="round" />
          <path d="M32 39 Q33 38.2 34 39" stroke="#222" strokeWidth="0.4" fill="none" strokeLinecap="round" />
          {/* Big smile */}
          <path d="M27.5 45 Q30 48 32.5 45" stroke="#222" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Sparkle/star effect on hover */}
          <g className="hidden group-hover:inline">
            <circle cx="44" cy="18" r="2" fill="#fff" opacity="0.8">
              <animate attributeName="r" values="2;3.5;2" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="18" cy="16" r="1.2" fill="#fff" opacity="0.7">
              <animate attributeName="r" values="1.2;2.2;1.2" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
        {/* Cartoon wavy string (thicker, lighter color) */}
        <svg width="22" height="60" viewBox="0 0 22 60" className="-mt-2">
          <path d="M11 0 Q22 18, 11 30 Q0 42, 11 60" stroke="#a3a3a3" strokeWidth="2.2" fill="none" />
        </svg>
      </div>
      {/* Pop animation style */}
      <style>{`
        .group:active svg { animation: pop-burst 0.3s cubic-bezier(.4,2,.6,.9); }
        @keyframes pop-burst {
          0% { transform: scale(1); }
          50% { transform: scale(1.18) rotate(-4deg); }
          100% { transform: scale(0.7) rotate(4deg); opacity: 0.5; }
        }
        .group:hover svg { filter: drop-shadow(0 0 12px ${currentColor.main}66) drop-shadow(0 0 24px ${currentColor.main}33); }
        .group:hover { z-index: 50; }
        .group:active { z-index: 60; }
        .group:hover .star { opacity: 1; }
        .group .star { opacity: 0; transition: opacity 0.2s; }
        @keyframes float-y {
          0% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
          100% { transform: translateY(0); }
        }
        .animate-float-y {
          animation: float-y 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ConfettiBalloon; 