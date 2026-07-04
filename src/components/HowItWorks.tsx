import React from 'react';
import { Search, ShoppingBag, CreditCard, Truck } from 'lucide-react';

const steps = [
  {
    number: '1',
    title: 'Discover',
    description: 'Browse our curated collection of trendy Korean hair accessories and essentials.',
    icon: <Search className="w-10 h-10 text-pink-500" />,
  },
  {
    number: '2',
    title: 'Select',
    description: 'Choose your favorite clips, scrunchies, and sets to add to your shopping bag.',
    icon: <ShoppingBag className="w-10 h-10 text-purple-500" />,
  },
  {
    number: '3',
    title: 'Checkout',
    description: 'Proceed to our secure checkout for a safe and seamless payment experience.',
    icon: <CreditCard className="w-10 h-10 text-blue-500" />,
  },
  {
    number: '4',
    title: 'Receive',
    description: 'Get your stylish package delivered quickly to your doorstep, ready to wear.',
    icon: <Truck className="w-10 h-10 text-green-500" />,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-8 bg-white border-t border-gray-100 rounded-[2.5rem] w-full shadow-2xl relative z-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-serif">How It Works</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Elevating your style is just a few clicks away
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gray-200 z-0 transform translate-y-4" />

          <div className="grid md:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center text-center group">
                {/* Icon Circle */}
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md mb-6 border border-gray-100 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 relative">
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 