import React, { useState } from 'react';
import { Mail, Gift, Zap, Bell } from 'lucide-react';
import { Button } from './ui/button';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/backend/user/subscribe_newsletter.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
        setEmail('');
      } else {
        setError(data.error || 'Subscription failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <section id="newsletter-signup" className="py-24 bg-gray-900 text-white relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gray-800 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-900 rounded-full blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-gray-800 rounded-full">
            <Mail className="w-6 h-6 text-pink-400" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">
            Unlock Early Offers and Updates
          </h2>

          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto font-light">
            Subscribe to our newsletter for the latest Korean fashion trends, style tips, and exclusive new arrival alerts.
          </p>

          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-6 py-4 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                  required
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 rounded-full"
                  disabled={loading}
                >
                  {loading ? '...' : 'Subscribe'}
                </Button>
              </div>
              {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
              <p className="text-xs text-gray-500 mt-4">
                By subscribing you agree to our Terms & Privacy Policy.
              </p>
            </form>
          ) : (
            <div className="max-w-md mx-auto bg-gray-800/50 border border-gray-700 rounded-xl px-6 py-4">
              <p className="text-pink-300 font-medium">
                Welcome to the family! Check your inbox for your discount code. 💖
              </p>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-gray-800">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-300" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white text-sm">New Arrivals</h3>
              <p className="text-xs text-gray-400">Be the first to browse</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-gray-300" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white text-sm">Exclusive Deals</h3>
              <p className="text-xs text-gray-400">Subscriber-only discounts</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-300" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white text-sm">Style Tips</h3>
              <p className="text-xs text-gray-400">Curated trending looks</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSignup; 