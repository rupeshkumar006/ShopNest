import React from 'react';

export default function CartoonStarBalloon() {
  return (
    <svg width="70" height="100" viewBox="0 0 70 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="35" cy="92" rx="18" ry="6" fill="#E0E7EF" opacity="0.5" />
      {/* Star balloon */}
      <path d="M35 18 L41 36 L60 36 L44 48 L50 66 L35 54 L20 66 L26 48 L10 36 L29 36 Z" fill="#FFD966" stroke="#E6C75A" strokeWidth="2.5" />
      {/* Face */}
      <ellipse cx="32" cy="38" rx="1.2" ry="1.7" fill="#222" />
      <ellipse cx="38" cy="38" rx="1.2" ry="1.7" fill="#222" />
      <path d="M33.5 43 Q35 45 36.5 43" stroke="#222" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="30.5" cy="41.5" rx="0.6" ry="0.3" fill="#fbb6ce" />
      <ellipse cx="39.5" cy="41.5" rx="0.6" ry="0.3" fill="#fbb6ce" />
      {/* Sparkles */}
      <g>
        <circle cx="15" cy="30" r="2" fill="#FFF7B2" />
        <circle cx="55" cy="28" r="1.5" fill="#FFF7B2" />
        <circle cx="45" cy="20" r="1.2" fill="#FFF7B2" />
        <circle cx="25" cy="22" r="1.2" fill="#FFF7B2" />
      </g>
      {/* String */}
      <path d="M35 66 Q38 80 32 92" stroke="#A3A3A3" strokeWidth="2.2" fill="none" />
    </svg>
  );
} 