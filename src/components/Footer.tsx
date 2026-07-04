import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#050505] text-gray-300 relative overflow-hidden border-t border-white/5">
      {/* Decorative Background Elements - Subtle & Premium */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-900/10 rounded-full blur-[100px] translate-y-1/3"></div>

        {/* Minimal Stars */}
        <div className="absolute top-12 left-12 animate-pulse" style={{ animationDelay: '0s' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="white" opacity="0.1" />
          </svg>
        </div>
        <div className="absolute top-24 right-1/5 animate-pulse" style={{ animationDelay: '1.5s' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="white" opacity="0.1" />
          </svg>
        </div>
        <div className="absolute bottom-32 left-1/3 animate-pulse" style={{ animationDelay: '2s' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="white" opacity="0.1" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="grid md:grid-cols-12 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <div className="flex items-center mb-6">
              {/* Logo */}
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" className="mr-3">
                <path d="M20 15 C 20 5, 30 5, 35 15 C 40 5, 40 25, 30 25 C 35 30, 40 35, 40 40 C 30 35, 20 30, 20 25 Z" fill="#F472B6" opacity="0.9" />
                <path d="M20 15 C 20 5, 10 5, 5 15 C 0 5, 0 25, 10 25 C 5 30, 0 35, 0 40 C 10 35, 20 30, 20 25 Z" transform="scale(-1, 1) translate(-40, 0)" fill="#F472B6" opacity="0.9" />
              </svg>
              <h3 className="text-xl font-bold text-white font-serif tracking-wide">ShopNest</h3>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed text-sm font-light pr-4">
              Elevating your style with the cutest Korean hair accessories. Trendsetting designs for every occasion.
            </p>

            {/* Socials */}
            <div className="flex space-x-4">
              <a href="https://instagram.com/shopnest" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 hover:border-white/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Column */}
          <div className="md:col-span-3 md:col-start-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90 mb-6">Explore</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="text-gray-400 hover:text-pink-300 transition-colors duration-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Home</a></li>
              <li><a href="/shop" className="text-gray-400 hover:text-pink-300 transition-colors duration-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Collection</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-pink-300 transition-colors duration-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Our Story</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-pink-300 transition-colors duration-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Contact</a></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90 mb-6">Contact</h4>
            <div className="space-y-4 text-sm">
              <a href="mailto:support@shopnest.example.com" className="flex items-start group">
                <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-pink-400 transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-400 group-hover:text-gray-200 transition-colors">support@shopnest.example.com</span>
              </a>
              <a href="https://maps.app.goo.gl/MCFikQkdEhRXWRLj6" target="_blank" rel="noopener noreferrer" className="flex items-start group">
                <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-pink-400 transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400 group-hover:text-gray-200 transition-colors">ShopNest, Palakkad Road,<br />Coimbatore</span>
              </a>
              <a href="tel:+918807497984" className="flex items-center group">
                <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-400 group-hover:text-gray-200 transition-colors">+91 8807497984</span>
              </a>
            </div>

            {/* Newsletter Minimal */}
            <div className="mt-8">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Subscribe for updates"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-pink-500/50 transition-colors"
                />
                <button className="absolute right-1 top-1 bottom-1 px-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-md transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/5 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs">
              © 2024 ShopNest. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
              <a href="/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="/terms-of-sale" className="hover:text-gray-300 transition-colors">Terms of Sale</a>
              <a href="/shipping-policy" className="hover:text-gray-300 transition-colors">Shipping Policy</a>
              <a href="/return-refund" className="hover:text-gray-300 transition-colors">Return & Refund</a>
              <a href="/cancellation" className="hover:text-gray-300 transition-colors">Cancellation</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 