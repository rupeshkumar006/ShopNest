import React from 'react';

const balloonColors = [
  '#FF4CA0', // hot pink
  '#79DAFF', // sky blue
  '#FFD966', // warm yellow
  '#C9A7F5', // pastel purple
  '#A5F2D1', // mint
];

export default function CartoonBalloonArch() {
  return (
    <svg width="340" height="120" viewBox="0 0 340 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Balloons (arch) */}
      {/* Leftmost balloon (smiling) */}
      <g>
        <ellipse cx="40" cy="80" rx="28" ry="36" fill={balloonColors[0]} stroke="#E0488B" strokeWidth="3" />
        {/* Face */}
        <ellipse cx="32" cy="80" rx="2.2" ry="3" fill="#222" />
        <ellipse cx="48" cy="80" rx="2.2" ry="3" fill="#222" />
        <path d="M35 88 Q40 92 45 88" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* Second balloon (blue) */}
      <g>
        <ellipse cx="90" cy="60" rx="24" ry="32" fill={balloonColors[1]} stroke="#4FC3E8" strokeWidth="3" />
      </g>
      {/* Third balloon (yellow, smiling) */}
      <g>
        <ellipse cx="140" cy="48" rx="22" ry="30" fill={balloonColors[2]} stroke="#E6C75A" strokeWidth="3" />
        {/* Face */}
        <ellipse cx="134" cy="48" rx="1.5" ry="2" fill="#222" />
        <ellipse cx="146" cy="48" rx="1.5" ry="2" fill="#222" />
        <path d="M136 54 Q140 57 144 54" stroke="#222" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Fourth balloon (purple) */}
      <g>
        <ellipse cx="200" cy="44" rx="20" ry="28" fill={balloonColors[3]} stroke="#A07BEF" strokeWidth="3" />
      </g>
      {/* Fifth balloon (mint, smiling) */}
      <g>
        <ellipse cx="250" cy="60" rx="22" ry="30" fill={balloonColors[4]} stroke="#7EDFC1" strokeWidth="3" />
        {/* Face */}
        <ellipse cx="244" cy="60" rx="1.5" ry="2" fill="#222" />
        <ellipse cx="256" cy="60" rx="1.5" ry="2" fill="#222" />
        <path d="M246 66 Q250 69 254 66" stroke="#222" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Sixth balloon (pink) */}
      <g>
        <ellipse cx="300" cy="80" rx="20" ry="28" fill={balloonColors[0]} stroke="#E0488B" strokeWidth="3" />
      </g>
      {/* Balloon strings */}
      <path d="M40 116 Q42 100 40 80" stroke="#B0B0B0" strokeWidth="2" fill="none" />
      <path d="M90 110 Q92 90 90 60" stroke="#B0B0B0" strokeWidth="2" fill="none" />
      <path d="M140 108 Q142 90 140 48" stroke="#B0B0B0" strokeWidth="2" fill="none" />
      <path d="M200 108 Q202 90 200 44" stroke="#B0B0B0" strokeWidth="2" fill="none" />
      <path d="M250 110 Q252 90 250 60" stroke="#B0B0B0" strokeWidth="2" fill="none" />
      <path d="M300 116 Q302 100 300 80" stroke="#B0B0B0" strokeWidth="2" fill="none" />
      {/* Confetti sprinkles */}
      <circle cx="60" cy="30" r="3" fill="#FF4CA0" />
      <circle cx="120" cy="20" r="2.5" fill="#FFD966" />
      <circle cx="180" cy="18" r="2.5" fill="#A5F2D1" />
      <circle cx="220" cy="28" r="2.5" fill="#C9A7F5" />
      <circle cx="280" cy="24" r="2.5" fill="#79DAFF" />
      <circle cx="100" cy="38" r="2" fill="#C9A7F5" />
      <circle cx="160" cy="32" r="2" fill="#FF4CA0" />
      <circle cx="240" cy="36" r="2" fill="#FFD966" />
    </svg>
  );
} 