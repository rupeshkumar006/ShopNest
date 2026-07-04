import React from 'react';

const PrivacyPolicy: React.FC = () => (
  <div className="min-h-screen bg-[#FAF9F6] py-20 px-4 flex flex-col items-center">
    <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-xl p-8 md:p-12 text-left border border-stone-100">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8 tracking-tight">Privacy Policy</h1>
      <p className="mb-6 text-gray-600 leading-relaxed font-light text-lg">At ShopNest, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.</p>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Information We Collect</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Personal information you provide (name, email, phone, address, etc.)</li>
        <li>Order and payment details</li>
        <li>Information collected via cookies and analytics tools</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">How We Use Your Information</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>To process orders and provide services</li>
        <li>To communicate with you about your orders, offers, and updates</li>
        <li>To improve our website and customer experience</li>
        <li>For legal and security purposes</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Cookies & Tracking</h2>
      <p className="mb-4 text-gray-600 leading-relaxed">We use cookies and similar technologies to enhance your browsing experience and analyze site traffic. You can control cookies through your browser settings.</p>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Third-Party Services</h2>
      <p className="mb-4 text-gray-600 leading-relaxed">We may use trusted third-party services (like payment gateways and analytics) that collect, monitor, and analyze information to help us serve you better. These providers have their own privacy policies.</p>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Your Rights</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Access, update, or delete your personal information</li>
        <li>Opt out of marketing communications</li>
        <li>Request information about our data practices</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Contact Us</h2>
      <p className="mb-4 text-gray-600 leading-relaxed">If you have any questions about this Privacy Policy or your data, please contact us at <a href="mailto:support@shopnest.example.com" className="text-gold-600 underline hover:text-gold-700 transition-colors">support@shopnest.example.com</a>.</p>

      <p className="text-gray-400 text-sm mt-12 font-light">Last updated: May 2024</p>
    </div>
  </div>
);

export default PrivacyPolicy;
