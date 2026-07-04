import React from 'react';
import { Star, TrendingUp, Truck, Heart } from 'lucide-react';

const features = [
  {
    title: 'Quality Essentials',
    description: 'Premium materials sourced for durability, comfort, and lasting style in every piece.',
    icon: <Star className="w-12 h-12 text-pink-500" />,
    color: 'pink',
  },
  {
    title: 'Trendsetting Designs',
    description: 'Curated collections reflecting the latest Korean fashion trends and aesthetic styles.',
    icon: <TrendingUp className="w-12 h-12 text-purple-500" />,
    color: 'purple',
  },
  {
    title: 'Fast Shipping',
    description: 'Quick and reliable delivery to ensure your accessories arrive ready to wear.',
    icon: <Truck className="w-12 h-12 text-blue-500" />,
    color: 'blue',
  },
  {
    title: 'Love It Guaranteed',
    description: 'Friendly support and easy returns because we want you to love your look.',
    icon: <Heart className="w-12 h-12 text-green-500" />,
    color: 'green',
  },
];

const colorClasses: Record<string, string> = {
  pink: 'border-pink-500/20 hover:border-pink-500/50 hover:shadow-pink-500/20 text-pink-300',
  purple: 'border-purple-500/20 hover:border-purple-500/50 hover:shadow-purple-500/20 text-purple-300',
  blue: 'border-blue-500/20 hover:border-blue-500/50 hover:shadow-blue-500/20 text-blue-300',
  green: 'border-green-500/20 hover:border-green-500/50 hover:shadow-green-500/20 text-green-300',
};

export default function WhyChooseUs() {
  return (
    <section className="py-2 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-slide-in-up font-serif">Why Choose Rusa?</h2>
          <p className="text-gray-700 max-w-2xl mx-auto animate-fade-in text-lg font-light">
            We are dedicated to bringing you the cutest and highest quality accessories
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className={`group text-center p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-white/20 transition-all duration-300 animate-fade-in hover:scale-105 hover:shadow-2xl hover:-translate-y-2`}>
              <div className="flex justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300 bg-gray-50 p-4 rounded-full w-24 h-24 mx-auto items-center shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 font-serif">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}