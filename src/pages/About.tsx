import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16 px-4 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white/80 rounded-2xl shadow-xl p-8 md:p-12 text-center border border-white">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-6 font-serif">About ShopNest</h1>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed font-light">
          <span className="font-bold text-pink-500">ShopNest</span> is your destination for premium Korean aesthetics and hair accessories. Based in Coimbatore, we curate the trendiest collection of clips, scrunchies, headbands, and jewelry to elevate your everyday style. We believe that the right accessory can transform an outfit and boost your confidence.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-10 text-left">
          <div className="bg-pink-50/50 p-6 rounded-xl border border-pink-100">
            <h2 className="text-xl font-bold text-pink-600 mb-2 font-serif">Our Mission</h2>
            <p className="text-gray-600 text-sm">
              To bring the latest global fashion trends to your doorstep with affordable luxury and unmatched quality. We want to make every girl feel like a K-drama star.
            </p>
          </div>
          <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100">
            <h2 className="text-xl font-bold text-purple-600 mb-2 font-serif">Our Promise</h2>
            <p className="text-gray-600 text-sm">
              We meticulously select every piece for its design and durability. If we wouldn't wear it, we won't sell it. Quality and cuteness guaranteed.
            </p>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-serif">Why Shop With Us?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 bg-white rounded-full shadow-sm text-sm text-gray-600 border border-gray-100">✨ Trendy Korean Designs</span>
            <span className="px-4 py-2 bg-white rounded-full shadow-sm text-sm text-gray-600 border border-gray-100">🎀 Premium Quality Materials</span>
            <span className="px-4 py-2 bg-white rounded-full shadow-sm text-sm text-gray-600 border border-gray-100">📦 Fast & Secure Shipping</span>
            <span className="px-4 py-2 bg-white rounded-full shadow-sm text-sm text-gray-600 border border-gray-100">💖 Customer First Approach</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a href="/shop" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 px-10 rounded-full shadow-lg transition-all duration-300 hover:scale-105">Shop Collection</a>
          <a href="/contact" className="bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 font-bold py-3 px-10 rounded-full shadow-sm transition-all duration-300">Contact Us</a>
        </div>
      </div>
    </div>
  );
};

export default About;