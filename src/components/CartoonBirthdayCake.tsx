import React from 'react';

export default function CartoonBirthdayCake() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cake shadow */}
      <ellipse cx="45" cy="84" rx="28" ry="6" fill="#E0E7EF" opacity="0.5" />
      {/* Bottom layer */}
      <rect x="18" y="54" width="54" height="22" rx="10" fill="#FFD966" stroke="#E6C75A" strokeWidth="2.5" />
      {/* Bottom icing */}
      <path d="M18 62 Q27 70 36 62 Q45 70 54 62 Q63 70 72 62 Q72 76 18 76 Z" fill="#FF4CA0" stroke="#E0488B" strokeWidth="2" />
      {/* Top layer */}
      <rect x="28" y="38" width="34" height="18" rx="8" fill="#FFF" stroke="#E6C75A" strokeWidth="2" />
      {/* Top icing */}
      <path d="M28 46 Q34 52 45 46 Q56 52 62 46 Q62 56 28 56 Z" fill="#FFB6E6" stroke="#E0488B" strokeWidth="1.5" />
      {/* Candles */}
      <rect x="36" y="30" width="3" height="10" rx="1.2" fill="#79DAFF" />
      <rect x="45" y="28" width="3" height="12" rx="1.2" fill="#A5F2D1" />
      <rect x="54" y="32" width="3" height="8" rx="1.2" fill="#C9A7F5" />
      {/* Candle flames */}
      <ellipse cx="37.5" cy="30" rx="1" ry="2" fill="#FFD966" />
      <ellipse cx="46.5" cy="28" rx="1" ry="2" fill="#FFD966" />
      <ellipse cx="55.5" cy="32" rx="1" ry="2" fill="#FFD966" />
      {/* Face (smile, eyes) */}
      <ellipse cx="41" cy="66" rx="1.2" ry="1.7" fill="#222" />
      <ellipse cx="49" cy="66" rx="1.2" ry="1.7" fill="#222" />
      <path d="M43 70 Q45 73 47 70" stroke="#222" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="39.5" cy="68.5" rx="0.7" ry="0.3" fill="#fbb6ce" />
      <ellipse cx="50.5" cy="68.5" rx="0.7" ry="0.3" fill="#fbb6ce" />
      {/* Waving hand (right) */}
      <g>
        <ellipse cx="72" cy="54" rx="4" ry="2.2" fill="#FFD966" stroke="#E6C75A" strokeWidth="1.2" />
        <path d="M76 54 Q78 50 74 48" stroke="#FFD966" strokeWidth="2" fill="none" />
        <ellipse cx="78" cy="50" rx="1.1" ry="0.7" fill="#FFD966" />
      </g>
    </svg>
  );
} 