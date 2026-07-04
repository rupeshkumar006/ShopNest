import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from './ui/dialog';
import { productService } from '../services/productService';
interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'product';
  itemId: number;
  itemName: string;
  onSubmitted?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onOpenChange, type, itemId, itemName, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Always use productService as 'type' is restricted to 'product'
      const res = await productService.submitReview(itemId, rating, review, images);

      if (res.success) {
        setSuccess(true);
        setReview('');
        setImages([]);
        setImagePreviews([]);
        if (onSubmitted) onSubmitted();
      } else {
        setError(res.error?.message || res.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-pink-600 text-2xl font-bold mb-2">
            {type === 'product' ? 'Product Feedback' : 'Service Feedback'}
          </DialogTitle>
          <DialogDescription>
            We hope you enjoyed your {type}! Please leave a review for <span className="font-semibold text-pink-500">{itemName}</span>.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="text-center text-green-600 font-semibold py-8">
            🎉 Thank you for your feedback!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={star <= rating ? 'text-yellow-400 text-2xl' : 'text-gray-300 text-2xl'}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="w-full border-2 border-pink-200 rounded-lg p-3 focus:outline-none focus:border-pink-400 resize-none"
              rows={4}
              placeholder="Share your experience..."
              value={review}
              onChange={e => setReview(e.target.value)}
              minLength={5}
              required
            />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            />
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {imagePreviews.map((src, idx) => (
                  <img key={idx} src={src} alt={`Preview ${idx + 1}`} className="h-16 w-16 object-cover rounded border" />
                ))}
              </div>
            )}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter>
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <DialogClose asChild>
                <button type="button" className="ml-2 px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Cancel</button>
              </DialogClose>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal; 