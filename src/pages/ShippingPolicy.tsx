import React from 'react';

const ShippingPolicy: React.FC = () => (
  <div className="min-h-screen bg-[#FAF9F6] py-20 px-4 flex flex-col items-center">
    <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-xl p-8 md:p-12 text-left border border-stone-100">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8 tracking-tight">Shipping Policy</h1>
      <p className="mb-6 text-gray-600 leading-relaxed font-light text-lg">At ShopNest, we strive to deliver your orders quickly and safely. This Shipping Policy explains our delivery process.</p>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Shipping Areas</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>We currently deliver within Coimbatore and select nearby areas.</li>
        <li>Contact us to confirm delivery availability for your location.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Delivery Timelines</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Orders are typically processed within 1-2 business days.</li>
        <li>Delivery times may vary based on product availability and location.</li>
        <li>We will notify you if there are any delays.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Shipping Charges</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Shipping charges are calculated at checkout based on your location and order size.</li>
        <li>Free shipping may be available for qualifying orders.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Delivery Process</h2>
      <ul className="list-disc list-inside mb-4 text-gray-600 space-y-2 leading-relaxed">
        <li>Our team will contact you to confirm delivery details if needed.</li>
        <li>Please ensure someone is available to receive the order at the delivery address.</li>
      </ul>

      <h2 className="text-2xl font-serif font-semibold text-gray-800 mt-8 mb-4">Contact Us</h2>
      <p className="mb-4 text-gray-600 leading-relaxed">For shipping questions, email us at <a href="mailto:support@shopnest.example.com" className="text-gold-600 underline hover:text-gold-700 transition-colors">support@shopnest.example.com</a>.</p>

      <p className="text-gray-400 text-sm mt-12 font-light">Last updated: May 2024</p>
    </div>
  </div>
);

export default ShippingPolicy;
