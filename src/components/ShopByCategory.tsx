import React from 'react';

const categories = [
  {
    label: 'Hair Clips',
    icon: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        {/* Clip Body */}
        <path d="M15 30 L45 30" stroke="#FF69B4" strokeWidth="4" strokeLinecap="round" />
        {/* Decor on clip */}
        <circle cx="20" cy="30" r="4" fill="#FFB6C1" />
        <circle cx="30" cy="30" r="4" fill="#FFB6C1" />
        <circle cx="40" cy="30" r="4" fill="#FFB6C1" />
        {/* Shine */}
        <path d="M20 20 L22 18 M30 18 L30 15 M40 20 L38 18" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Scrunchies',
    icon: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        {/* Scrunchie shape (wavy circle) */}
        <path d="M30 15 C 40 15, 45 20, 45 30 C 45 40, 40 45, 30 45 C 20 45, 15 40, 15 30 C 15 20, 20 15, 30 15 Z" fill="#E0B0FF" stroke="#9370DB" strokeWidth="3" />
        {/* Inner hole */}
        <circle cx="30" cy="30" r="8" fill="#FFF" />
        {/* Texture lines */}
        <path d="M30 15 L30 22 M45 30 L38 30 M30 45 L30 38 M15 30 L22 30" stroke="#9370DB" strokeWidth="1" />
      </svg>
    ),
  },
  {
    label: 'Headbands',
    icon: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        {/* Headband Arch */}
        <path d="M15 45 C 15 20, 45 20, 45 45" stroke="#87CEEB" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* Knot/Bow at top */}
        <ellipse cx="30" cy="22" rx="6" ry="4" fill="#87CEEB" />
        <circle cx="30" cy="22" r="2" fill="#FFF" />
      </svg>
    ),
  },
  {
    label: 'Jewelry Sets',
    icon: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        {/* Necklace */}
        <path d="M20 20 Q 30 40, 40 20" stroke="#FFD700" strokeWidth="2" fill="none" />
        <circle cx="30" cy="35" r="3" fill="#FF69B4" stroke="#FFD700" strokeWidth="1" />
        {/* Earrings */}
        <circle cx="15" cy="40" r="2" fill="#FF69B4" />
        <circle cx="45" cy="40" r="2" fill="#FF69B4" />
      </svg>
    ),
  },
  {
    label: 'Gift Boxes',
    icon: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        {/* Box */}
        <rect x="18" y="25" width="24" height="20" rx="2" fill="#A5F2D1" stroke="#3CB371" strokeWidth="2" />
        {/* Ribbon */}
        <line x1="30" y1="25" x2="30" y2="45" stroke="#FF69B4" strokeWidth="3" />
        <path d="M30 25 L35 18 L30 20 L25 18 L30 25" fill="#FF69B4" />
      </svg>
    ),
  },
];

export default function ShopByCategory() {
  return (
    <section className="py-16 bg-white/80">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center font-serif">Deep Dive Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <div key={cat.label} className="group flex flex-col items-center bg-white rounded-2xl shadow-sm p-6 hover:shadow-xl hover:shadow-pink-100 transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
              <div className="text-md font-medium text-gray-700 mt-2 group-hover:text-pink-500 transition-colors">{cat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 