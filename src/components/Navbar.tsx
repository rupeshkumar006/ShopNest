import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  cartItemCount: number;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, isAdmin, cartItemCount, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Adjusted size for mobile */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="ShopNest"
              className="h-8 md:h-12 w-auto"
            />
          </Link>

          {/* Navigation Links - Centered & Hidden on Mobile */}
          <div className="hidden md:flex space-x-8 items-center justify-center flex-1 px-4">
            <Link to="/" className="text-gray-700 hover:text-gold-500 transition-colors font-medium">
              Home
            </Link>
            <Link to="/shop" className="text-gray-700 hover:text-gold-500 transition-colors font-medium">
              Shop
            </Link>
            {isLoggedIn && (
              <Link to="/dashboard" className="text-gray-700 hover:text-gold-500 transition-colors font-medium">
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
            {/* Cart and Favorites - Visible to all, resized for mobile */}
            <Link to="/favorites" className="text-gray-700 hover:text-gold-500 transition-colors p-1 md:p-0">
              <Heart className="h-5 w-5 md:h-6 md:w-6" />
            </Link>
            <Link to="/cart" className="relative text-gray-700 hover:text-gold-500 transition-colors p-1 md:p-0">
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-gold-500 text-white text-[10px] md:text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Auth Buttons - Desktop Only */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <Link to="/profile">
                    <User className="h-6 w-6 text-gray-700" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="text-gray-700 hover:text-gold-500"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login" onClick={() => {
                    if (location.pathname !== '/login' && location.pathname !== '/register') {
                      localStorage.setItem('redirectAfterLogin', window.location.pathname);
                    }
                  }}>
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => {
                    if (location.pathname !== '/login' && location.pathname !== '/register') {
                      localStorage.setItem('redirectAfterLogin', window.location.pathname);
                    }
                  }}>
                    <Button size="sm" className="bg-gold-500 hover:bg-gold-600">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Hamburger for mobile - Always last */}
            <button
              className="md:hidden flex items-center p-2 text-gray-700 hover:text-gold-500 focus:outline-none ml-2"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2 space-y-1 animate-fade-in shadow-xl rounded-b-lg absolute left-0 right-0 top-16 z-40 px-4">
            {/* Mobile Auth Section */}
            {!isLoggedIn && (
              <div className="grid grid-cols-2 gap-3 mb-4 pt-2 border-b border-gray-100 pb-4">
                <Link to="/login" onClick={() => {
                  setMobileMenuOpen(false);
                  if (location.pathname !== '/login' && location.pathname !== '/register') {
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);
                  }
                }}>
                  <Button variant="outline" className="w-full justify-center">Login</Button>
                </Link>
                <Link to="/register" onClick={() => {
                  setMobileMenuOpen(false);
                  if (location.pathname !== '/login' && location.pathname !== '/register') {
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);
                  }
                }}>
                  <Button className="w-full bg-gold-500 hover:bg-gold-600 justify-center">Register</Button>
                </Link>
              </div>
            )}

            {isLoggedIn && (
              <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-100 mb-2">
                <User className="h-5 w-5 text-gray-500" />
                <Link to="/profile" className="text-gray-700 font-medium" onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
              </div>
            )}

            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gold-500 hover:bg-gray-50 rounded-md transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/shop" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gold-500 hover:bg-gray-50 rounded-md transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Shop
            </Link>
            {isLoggedIn && (
              <Link to="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gold-500 hover:bg-gray-50 rounded-md transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            )}

            {isLoggedIn && (
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors mt-2 border-t border-gray-100 pt-3"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
