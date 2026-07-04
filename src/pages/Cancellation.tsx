import React from 'react';

const Cancellation: React.FC = () => (
  <div className="min-h-screen bg-[#FAF9F6] py-20 px-4 flex flex-col items-center">
    <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-xl p-8 md:p-12 text-left border border-stone-100">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8 tracking-tight">Cancellation Policy</h1>
      <p className="mb-6 text-gray-600 leading-relaxed font-light text-lg">We understand that plans can change. This policy explains how to cancel your order with ShopNest.</p>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">How to Cancel</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>To cancel an order, contact us as soon as possible at <a href="mailto:support@shopnest.example.com" className="text-gold-600 underline hover:text-gold-700 transition-colors">support@shopnest.example.com</a> or call <a href="tel:+918807497984" className="text-gold-600 underline hover:text-gold-700 transition-colors">+91 8807497984</a>.</li>
        <li>Include your order number and reason for cancellation.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Timelines</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Orders can be cancelled before they are processed for delivery.</li>
        <li>Once an order is shipped or delivered, it cannot be cancelled but may be eligible for return.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Contact Us</h2>
      <p className="mb-4 text-gray-600 leading-relaxed">For cancellation questions, email us at <a href="mailto:support@shopnest.example.com" className="text-gold-600 underline hover:text-gold-700 transition-colors">support@shopnest.example.com</a> or call <a href="tel:+918807497984" className="text-gold-600 underline hover:text-gold-700 transition-colors">+91 8807497984</a>.</p>

      <p className="text-gray-400 text-sm mt-12 font-light">Last updated: May 2024</p>
    </div>
  </div>
);

export default Cancellation;
