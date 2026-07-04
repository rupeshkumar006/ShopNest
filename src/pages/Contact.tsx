import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-pink-600 mb-4 font-dancing">
            Contact Us
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Get in touch with us for any questions, custom orders, or to book our services.
            We're here to make your celebrations magical!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Contact Information */}
          <div className="bg-white/80 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-6">Get In Touch</h2>

            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                  <a
                    href="tel:+918807497984"
                    className="text-lg font-bold text-gray-800 hover:text-pink-600 transition-colors duration-300"
                  >
                    +91 8807497984
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Email Address</p>
                  <a
                    href="mailto:support@shopnest.example.com"
                    className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors duration-300"
                  >
                    support@shopnest.example.com
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Address</p>
                  <a
                    href="https://maps.app.goo.gl/MCFikQkdEhRXWRLj6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-bold text-gray-800 hover:text-green-600 transition-colors duration-300"
                  >
                    ShopNest, Palakkad Road, Coimbatore
                  </a>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <h3 className="text-lg font-bold text-purple-600 mb-3">Business Hours</h3>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span className="font-semibold">10:00 AM - 8:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-semibold">10:00 AM - 8:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-semibold">4:00 PM - 8:30 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Map and Additional Info */}
          <div className="space-y-6">
            {/* Map */}
            <div className="bg-white/80 rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-purple-600 mb-4">Our Location</h3>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <iframe
                  title="ShopNest Location"
                  src="https://maps.google.com/maps?q=Kovaipudur+signal,+Palakkad+-+Coimbatore+Rd,+Kuniyamuthur,+Coimbatore,+Tamil+Nadu+641008&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="bg-white/80 rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-purple-600 mb-4">Quick Message</h3>
              <p className="text-gray-700 mb-4">
                Have a question or want to place a custom order? Send us a quick message!
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Tell us about your requirements..."
                  ></textarea>
                </div>
                <button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-purple-600 mb-4">Follow Us</h3>
          <div className="flex justify-center space-x-4">
            <a
              href="https://instagram.com/shopnest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" />
                <circle cx="12" cy="12" r="5" fill="white" />
                <circle cx="17" cy="7" r="1.2" fill="white" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 