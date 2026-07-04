import React, { useEffect, useState } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex justify-center space-x-0.5 mb-2">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}
      />
    ))}
  </div>
);

export default function Testimonials() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/backend/user/get_top_reviews.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) setReviews(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-0 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3 font-serif">Community Love</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-base font-light">
            Hear from our wonderful community about their favorite Rusa finds.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-8 h-8 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin"></div>
            <div className="text-gray-400">Loading reviews...</div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white/5 backdrop-blur-md rounded-3xl border border-dashed border-white/20">
            <div className="text-pink-300 mb-4 flex justify-center">
              <MessageCircle size={48} strokeWidth={1} />
            </div>
            <p className="text-gray-400 text-lg font-light">
              We're gathering our favorite stories. Check back soon for new testimonials!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={index}
                initial={{ y: 0 }}
                animate={{ y: [-8, 8, -8] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.3
                }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-white/10 group"
              >
                <div className="flex justify-center mb-3 text-pink-300 group-hover:text-pink-400 transition-colors">
                  <MessageCircle size={24} strokeWidth={1.5} />
                </div>
                <StarRating rating={review.rating} />
                <h3 className="text-base font-bold text-white mb-0.5 text-center">{review.user_name}</h3>
                <div className="text-[10px] text-pink-400 font-medium mb-3 text-center tracking-widest uppercase">Verified Purchase</div>
                <p className="text-gray-300 leading-relaxed text-center italic text-sm">
                  "{review.review}"
                </p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-6 justify-center">
                    {review.images.map((imgUrl: string, idx: number) => (
                      <img key={idx} src={imgUrl} alt="Review" className="h-16 w-16 object-cover rounded-2xl border border-white/10 shadow-sm" />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
} 