import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Star, ArrowLeft, Heart, ChevronLeft, ChevronRight, Palette, Truck, ShieldCheck, RefreshCw, Share2, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import DOMPurify from 'dompurify';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { favoriteService, getColorVariantId } from '../services/favoriteService';
import { useToast } from '@/components/ui/use-toast';
import { useFavorites } from '../context/FavoritesContext';
import FeedbackModal from '../components/FeedbackModal';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: number;
  user_id: number;
  user_name: string;
  rating: number;
  review: string;
  created_at: string;
  images?: string[];
}

interface ColorVariation {
  id: number;
  color_name: string;
  hex_code: string;
  price: number;
  stock: number;
  images: string[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
  gallery: string[];
  reviews: Review[];
  average_rating: number | null;
  review_count: number;
  delivery_days: number;
  has_color_variations: boolean;
  color_variations: ColorVariation[];
  unit_type?: string;
  packet_size?: number;
  material?: string;
}

const AccordionItem = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left font-medium text-stone-900 hover:text-amber-600 transition-colors"
      >
        {title}
        {isOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-stone-600 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const { isLoggedIn } = useUserAuth();
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();
  const [nav1, setNav1] = useState<Slider | null>(null);
  const [nav2, setNav2] = useState<Slider | null>(null);
  const slider1 = useRef<Slider>(null);
  const slider2 = useRef<Slider>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [selectedColorVariation, setSelectedColorVariation] = useState<ColorVariation | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackProduct, setFeedbackProduct] = useState<{ id: number, name: string } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await apiService.get(`/backend/user/get_product.php?id=${id}`);
        if (res.success && res.data) {
          const productData = res.data as Product;
          setProduct(productData);
          if (productData.color_variations && productData.color_variations.length > 0) {
            setSelectedColorVariation(productData.color_variations[0]);
            setSelectedImage(productData.color_variations[0].images[0] || productData.gallery[0] || productData.image_url);
          } else {
            setSelectedImage(productData.gallery[0] || productData.image_url);
          }
        } else {
          setError('Product not found');
        }
      } catch (e) {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      try {
        const res = await apiService.get('/backend/user/get_products.php');
        if (res.success && Array.isArray(res.data)) {
          setRelated(res.data.filter((p: any) => p.category === product.category && p.id !== product.id).slice(0, 4));
        }
      } catch { }
    };
    fetchRelated();
  }, [product]);

  const handleColorVariationChange = (variation: ColorVariation) => {
    setSelectedColorVariation(variation);
    if (variation.images && variation.images.length > 0) {
      setSelectedImage(variation.images[0]);
      setActiveIdx(0);
    } else {
      setSelectedImage(product?.image_url || null);
      setActiveIdx(0);
    }
  };

  const currentStock = Math.max(selectedColorVariation ? selectedColorVariation.stock : product?.stock ?? 0, 0);
  const isCurrentVariantOutOfStock = currentStock === 0;

  const handleAddToCart = async () => {
    if (isCurrentVariantOutOfStock) return;
    try {
      if (quantity < 1 || quantity > currentStock) return;
      let colorVariationId = selectedColorVariation?.id;
      if (!colorVariationId && product && product.color_variations && product.color_variations.length > 0) {
        colorVariationId = product.color_variations[0].id;
      }

      const cart = await cartService.getCart();
      let cartQty = 0;
      if (cart && Array.isArray(cart.items)) {
        const item = cart.items.find((i: any) => i.product_id === product?.id && i.color_variation_id === colorVariationId);
        cartQty = item ? item.quantity : 0;
      }

      if (cartQty + quantity > currentStock) {
        toast({ title: "Insufficient Stock", description: `Only ${currentStock - cartQty} more units available.`, variant: "destructive" });
        return;
      }

      await cartService.addToCart(product!.id, quantity, colorVariationId);
      toast({ title: "Added to Cart", description: "Item added to your cart.", variant: "default" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add to cart.", variant: "destructive" });
    }
  };

  const handleBuyNow = () => {
    if (isCurrentVariantOutOfStock) return;
    localStorage.setItem('buyNowData', JSON.stringify({
      productId: product?.id,
      colorVariationId: selectedColorVariation?.id,
      quantity
    }));
    navigate('/checkout');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'ShopNest',
          text: `Check out this amazing ${product?.name} from ShopNest!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      toast({ title: "Link Copied", description: "Product link copied to clipboard." });
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setReviewImages(files);
    setReviewImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    try {
      const res = await productService.submitReview(product.id, reviewRating, reviewText, reviewImages);
      if (res.success) {
        setReviewText('');
        setReviewRating(5);
        setReviewImages([]);
        setReviewImagePreviews([]);
        const refreshed = await apiService.get(`/backend/user/get_product.php?id=${product.id}`);
        if (refreshed.success && refreshed.data) setProduct(refreshed.data as Product);
        toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      } else {
        setSubmitError(res.error?.message || 'Something went wrong');
      }
    } catch (err) {
      setSubmitError('Network error');
    }
    setSubmitting(false);
  };

  const allImages = React.useMemo(() => {
    if (selectedColorVariation && selectedColorVariation.images && selectedColorVariation.images.length > 0) return selectedColorVariation.images;
    if (product && product.gallery && product.gallery.length > 0) return product.gallery;
    if (product && product.image_url) return [product.image_url];
    return [];
  }, [selectedColorVariation, product]);

  useEffect(() => {
    setNav1(slider1.current);
    setNav2(slider2.current);
  }, [selectedColorVariation, allImages]);

  const getCurrentColorVariationId = () => getColorVariantId(product!, selectedColorVariation?.id);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
      <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
      <div className="text-stone-500 font-serif">Loading masterpiece...</div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-stone-600">
      <div className="text-center">
        <h2 className="text-2xl font-serif mb-2">Product Not Found</h2>
        <Button onClick={() => navigate('/shop')} variant="outline">Back to Shop</Button>
      </div>
    </div>
  );

  const currentPrice = selectedColorVariation?.price || product.price;

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-100 selection:text-amber-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            className="hover:bg-white/50 text-stone-500 hover:text-stone-900 transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="inline-block mr-2 w-4 h-4" /> Back
          </Button>
          <Button
            variant="ghost"
            className="hover:bg-white/50 text-stone-500 hover:text-amber-600 transition-colors"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Gallery Section */}
            <div className="bg-stone-50 p-6 lg:p-12 border-r border-stone-100">
              <div className="sticky top-24">
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={selectedColorVariation?.id || 'default'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {allImages && allImages.length > 0 ? (
                      <div className="relative group">
                        <Slider
                          asNavFor={nav2 as any}
                          ref={slider1}
                          slidesToShow={1}
                          arrows={false}
                          dots={false}
                          fade={true}
                          beforeChange={(_, next) => setActiveIdx(next)}
                          className="w-full rounded-2xl overflow-hidden shadow-sm border border-black/5 bg-white"
                        >
                          {allImages.map((img, idx) => (
                            <div key={idx} className="outline-none">
                              <div className="aspect-[4/5] w-full relative flex items-center justify-center overflow-hidden">
                                <img
                                  src={img}
                                  alt={product?.name}
                                  className="h-full w-full object-contain p-2"
                                  onError={e => (e.currentTarget.src = '/default-image.png')}
                                />
                              </div>
                            </div>
                          ))}
                        </Slider>

                        {allImages.length > 1 && (
                          <>
                            <button
                              onClick={() => slider1.current?.slickPrev()}
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-stone-800 hover:bg-amber-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => slider1.current?.slickNext()}
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-stone-800 hover:bg-amber-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-[4/5] bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                        No Image Available
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {allImages && allImages.length > 1 && (
                  <div className="mt-6 px-2">
                    <Slider
                      asNavFor={nav1 as any}
                      ref={slider2}
                      slidesToShow={Math.min(5, allImages.length)}
                      swipeToSlide={true}
                      focusOnSelect={true}
                      arrows={false}
                      centerMode={allImages.length > 3}
                      className="thumbnail-slider"
                    >
                      {allImages.map((img, idx) => (
                        <div key={idx} className="px-2 outline-none">
                          <div
                            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeIdx === idx ? 'border-amber-500 ring-2 ring-amber-100' : 'border-transparent hover:border-amber-200'
                              }`}
                          >
                            <img
                              src={img}
                              alt="thumb"
                              className="w-full h-full object-cover bg-white"
                              onError={e => (e.currentTarget.src = '/default-image.png')}
                            />
                          </div>
                        </div>
                      ))}
                    </Slider>
                  </div>
                )}

                {/* Accordions Moved Here */}
                <div className="w-full mt-8 border-t border-stone-100 pt-4">
                  <AccordionItem title="Description" defaultOpen={true}>
                    <div className="space-y-4">
                      <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description || '') }}></p>
                    </div>
                  </AccordionItem>
                  <AccordionItem title="Product Details">
                    <div className="space-y-2">
                      <ul className="list-disc list-inside text-stone-500 space-y-1 marker:text-amber-500">
                        {product.material && <li><strong>Material:</strong> {product.material}</li>}
                        <li><strong>Quality:</strong> Tested for durability</li>
                        <li><strong>Style:</strong> {product.category} Collection</li>
                      </ul>
                    </div>
                  </AccordionItem>
                  <AccordionItem title="Shipping & Returns">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-stone-900">Fast Delivery</div>
                          <p>Delivered within {product.delivery_days} days. Free shipping on orders over ₹999.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <RefreshCw className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-stone-900">Easy Returns</div>
                          <p>7-day return policy for damaged or defective items. <Link to="/return-refund" className="underline text-amber-600 cursor-pointer">Learn more</Link></p>
                        </div>
                      </div>
                    </div>
                  </AccordionItem>
                  <AccordionItem title="Quality Assurance">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      <p>Every item is hand-inspected before shipping to ensure it meets our high standards of quality.</p>
                    </div>
                  </AccordionItem>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-8 lg:p-12 flex flex-col">
              <div>
                {/* Header Info */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider border border-amber-100">
                    {product.category}
                  </span>
                  {isCurrentVariantOutOfStock && (
                    <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider border border-red-100">
                      Out of Stock
                    </span>
                  )}
                  {product.average_rating && (
                    <span className="flex items-center gap-1 text-xs font-bold text-stone-500 ml-auto">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {Number(product.average_rating).toFixed(1)}
                      <span className="font-normal border-l border-stone-200 pl-2 ml-1">{product.review_count} Reviews</span>
                    </span>
                  )}
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold font-serif text-stone-900 mb-4 leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-baseline gap-4 mb-6 border-b border-stone-100 pb-6">
                  <span className="text-3xl font-bold text-stone-900">
                    <span className="text-amber-500 text-xl align-top mr-1 font-serif">₹</span>
                    {currentPrice}
                  </span>
                  {currentStock > 0 && currentStock < 10 && (
                    <span className="text-red-500 text-sm font-medium animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Only {currentStock} left!
                    </span>
                  )}
                </div>

                {/* Short Description */}
                <div className="text-stone-600 mb-8 leading-relaxed">
                  <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description || '') }}></p>
                </div>

                {/* Color Variations */}
                {product.has_color_variations && product.color_variations && product.color_variations.length > 1 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-stone-900 text-sm uppercase tracking-wide">Select Variant</span>
                      <span className="text-stone-500 text-sm">- {selectedColorVariation?.color_name}</span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {product.color_variations.map((variation) => (
                        <button
                          key={variation.id}
                          onClick={() => handleColorVariationChange(variation)}
                          className={`relative group flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${selectedColorVariation?.id === variation.id
                            ? 'border-amber-500 ring-2 ring-amber-100 scale-110'
                            : 'border-transparent hover:border-amber-300'
                            }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full border border-black/10 shadow-inner"
                            style={{ backgroundColor: variation.hex_code }}
                          />
                          {variation.stock === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-0.5 bg-stone-400 rotate-45 transform" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Group */}
                <div className="mb-8 p-6 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-stone-900">Quantity</span>
                      <div className="flex items-center bg-white rounded-full p-1 border border-stone-200 shadow-sm">
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 disabled:opacity-50 transition-colors"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          disabled={quantity <= 1 || isCurrentVariantOutOfStock}
                        >-</button>
                        <span className="w-8 text-center font-bold text-stone-900 text-sm">{quantity}</span>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 disabled:opacity-50 transition-colors"
                          onClick={() => setQuantity(q => Math.min(q + 1, currentStock))}
                          disabled={quantity >= currentStock || isCurrentVariantOutOfStock}
                        >+</button>
                      </div>
                    </div>

                    <Button
                      onClick={handleBuyNow}
                      disabled={isCurrentVariantOutOfStock}
                      className="w-full bg-stone-900 hover:bg-amber-500 text-white hover:text-white rounded-xl h-12 text-lg shadow-lg hover:shadow-amber-500/25 transition-all"
                    >
                      Buy Now
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleAddToCart}
                        variant="outline"
                        disabled={isCurrentVariantOutOfStock}
                        className="flex-1 border-stone-200 hover:border-amber-500 text-stone-700 hover:text-amber-600 hover:bg-amber-50 rounded-xl h-12 transition-all bg-white"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => {
                          const id = getCurrentColorVariationId();
                          toggleFavorite(product.id, id, product);
                        }}
                        variant="outline"
                        className={`h-12 w-12 rounded-xl border ${isFavorite(product.id, getCurrentColorVariationId(), product) ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-stone-200 text-stone-400 hover:border-amber-400 hover:text-amber-500'} bg-white`}
                      >
                        <Heart className={`w-5 h-5 ${isFavorite(product.id, getCurrentColorVariationId(), product) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Guaranteed Safe Checkout */}
                <div className="mb-8 text-center">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Guaranteed Safe Checkout</div>
                  <div className="flex justify-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Simple placeholder icons for payment methods */}
                    <div className="h-8 w-12 bg-white border border-stone-200 rounded flex items-center justify-center"><CreditCard className="w-5 h-5 text-stone-600" /></div>
                    <div className="h-8 w-12 bg-white border border-stone-200 rounded flex items-center justify-center text-[10px] font-bold text-blue-800">VISA</div>
                    <div className="h-8 w-12 bg-white border border-stone-200 rounded flex items-center justify-center text-[10px] font-bold text-orange-600">MC</div>
                    <div className="h-8 w-12 bg-white border border-stone-200 rounded flex items-center justify-center text-[10px] font-bold text-green-600">UPI</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-serif font-bold text-stone-900">Customer Reviews</h2>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-stone-900">{product.average_rating ? Number(product.average_rating).toFixed(1) : 'New'}</span>
                <div className="flex flex-col">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(product.average_rating || 0)) ? 'fill-current' : 'text-stone-200 fill-stone-200'}`} />
                    ))}
                  </div>
                  <span className="text-stone-500 text-xs">{product.review_count} verified reviews</span>
                </div>
              </div>
            </div>

            {product.reviews && product.reviews.length > 0 ? (
              <div className="grid gap-6">
                {product.reviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center font-bold text-amber-700">
                          {review.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{review.user_name}</div>
                          <div className="flex text-amber-400 text-xs gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-stone-200 fill-stone-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-stone-400 text-xs">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed italic">"{review.review}"</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-4 ml-1">
                        {review.images.map((img, i) => (
                          <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover border border-stone-200" alt="Review" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-100 border-dashed">
                <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-stone-50 mb-4">
                  <Star className="w-8 h-8 text-stone-300" />
                </div>
                <p className="text-stone-500 mb-2">No reviews yet for this masterpiece.</p>
                <p className="text-amber-600 font-medium">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>

          {/* Write Review & Related */}
          <div className="space-y-8">
            {isLoggedIn ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 sticky top-24">
                <h3 className="text-xl font-bold font-serif mb-4 text-stone-900">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Your Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'fill-stone-100 text-stone-100'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="What did you like or dislike?"
                    className="w-full border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none min-h-[120px] resize-none"
                    required
                  />
                  <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center cursor-pointer hover:bg-stone-50 transition-colors relative group">
                    <input type="file" multiple accept="image/*" onChange={handleReviewImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="text-stone-500 text-sm group-hover:text-amber-600 transition-colors">
                      {reviewImages.length > 0 ? (
                        <span className="font-bold text-green-600">{reviewImages.length} images added</span>
                      ) : (
                        <>
                          <span className="block font-bold mb-1">Add Photos</span>
                          <span className="text-xs">Supported formats: jpg, png</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-stone-900 hover:bg-amber-600 text-white rounded-xl h-12 shadow-lg">
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="bg-amber-50 p-8 rounded-2xl border border-amber-100 text-center sticky top-24">
                <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-amber-100 mb-4">
                  <Heart className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-amber-900 font-bold mb-2">Login to Review</p>
                <p className="text-amber-800/70 text-sm mb-6 max-w-[200px] mx-auto">Share your experience with our community and help others choose better.</p>
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full bg-white border-amber-200 text-amber-700 hover:bg-amber-100 font-bold">Log In Now</Button>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-20 border-t border-stone-200 pt-16">
            <h2 className="text-3xl font-serif font-black text-center text-stone-900 mb-12">You May Also Adore</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {related.map((p) => (
                <div
                  key={p.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white mb-4 shadow-sm border border-stone-100 group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2">
                    <img
                      src={p.gallery && p.gallery.length > 0 ? p.gallery[0] : p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={e => (e.currentTarget.src = '/default-image.png')}
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                      <span className="bg-white text-stone-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">View Details</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-600 transition-colors line-clamp-1">{p.name}</h3>
                    <div className="text-stone-500 font-medium mt-1">₹{p.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {feedbackProduct && (
        <FeedbackModal
          open={showFeedback}
          onOpenChange={setShowFeedback}
          type="product"
          itemId={feedbackProduct.id}
          itemName={feedbackProduct.name}
          onSubmitted={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
};

export default ProductDetails;