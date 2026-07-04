import React from 'react';

const TermsOfSale: React.FC = () => (
  <div className="min-h-screen bg-[#FAF9F6] py-20 px-4 flex flex-col items-center">
    <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-xl p-8 md:p-12 text-left border border-stone-100">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8 tracking-tight">Terms of Sale</h1>
      <p className="mb-6 text-gray-600 leading-relaxed font-light text-lg">These Terms of Sale govern your purchases from ShopNest. By placing an order, you agree to these terms.</p>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Order Process</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Orders can be placed online through our website.</li>
        <li>All orders are subject to acceptance and availability.</li>
        <li>We reserve the right to refuse or cancel any order.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Payment</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>We accept secure online payments via trusted gateways.</li>
        <li>Payment must be completed before order processing.</li>
        <li>All prices are inclusive of applicable taxes unless stated otherwise.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Delivery</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>We deliver to the address provided at checkout.</li>
        <li>Delivery times may vary based on location and availability.</li>
        <li>We are not responsible for delays due to unforeseen circumstances.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Returns & Refunds</h2>
      <p className="mb-4 text-gray-600 leading-relaxed">Please refer to our <a href="/return-refund" className="text-gold-600 underline hover:text-gold-700 transition-colors">Return & Refund Policy</a> for details on returns and refunds.</p>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Customer Responsibilities</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Provide accurate information during checkout.</li>
        <li>Ensure someone is available to receive the delivery.</li>
        <li>Contact us promptly for any order issues.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Contact Us</h2>
      <p className="mb-4 text-gray-600 leading-relaxed">For questions about these terms, email us at <a href="mailto:support@shopnest.example.com" className="text-gold-600 underline hover:text-gold-700 transition-colors">support@shopnest.example.com</a>.</p>

      <p className="text-gray-400 text-sm mt-12 font-light">Last updated: May 2024</p>
    </div>
  </div>
);

export default TermsOfSale;
