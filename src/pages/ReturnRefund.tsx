import React from 'react';

const ReturnRefund: React.FC = () => (
  <div className="min-h-screen bg-[#FAF9F6] py-20 px-4 flex flex-col items-center">
    <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-xl p-8 md:p-12 text-left border border-stone-100">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8 tracking-tight">Return & Refund Policy</h1>
      <p className="mb-6 text-gray-600 leading-relaxed font-light text-lg">We want you to be delighted with your purchase from ShopNest. This policy explains how returns and refunds work.</p>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Eligibility</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Returns are accepted for defective, damaged, or incorrect items.</li>
        <li>Items must be unused and in original packaging.</li>
        <li>Return requests must be made within 3 days of delivery.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Return Process</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Contact us at <a href="mailto:support@shopnest.example.com" className="text-gold-600 underline hover:text-gold-700 transition-colors">support@shopnest.example.com</a> with your order details and reason for return.</li>
        <li>We will guide you through the return process and arrange pickup if eligible.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Refunds</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Refunds are processed after we receive and inspect the returned item.</li>
        <li>Refunds will be issued to your original payment method within 7 business days.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Contact Us</h2>
      <p className="mb-4 text-gray-600 leading-relaxed">For return or refund questions, email us at <a href="mailto:support@shopnest.example.com" className="text-gold-600 underline hover:text-gold-700 transition-colors">support@shopnest.example.com</a>.</p>

      <p className="text-gray-400 text-sm mt-12 font-light">Last updated: May 2024</p>
    </div>
  </div>
);

export default ReturnRefund;
