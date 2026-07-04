import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Search, ShoppingBag, ArrowUp, SlidersHorizontal, X } from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cartService } from '../services';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Product } from '../services/productService';
import type { CartItem } from '../services/cartService';
import { apiService } from '../services/apiService';
import DOMPurify from 'dompurify';
import { useFavorites } from '../context/FavoritesContext';
import { getColorVariantId } from '../services/favoriteService';
import FeedbackModal from '../components/FeedbackModal';
import { motion, AnimatePresence } from 'framer-motion';

function getErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') return (err as any).message;
  return 'An error occurred';
}

interface ShopProps {
  setCartItemCount: (count: number) => void;
}

const Shop = ({ setCartItemCount }: ShopProps) => {
  const { isLoggedIn } = useUserAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackProduct, setFeedbackProduct] = useState<{ id: number, name: string } | null>(null);

  // Mobile filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Ref for sticky sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getCartKey = (productId: number, colorVariationId: number | undefined) => `${productId}_${colorVariationId ?? 'default'}`;

  const updateCartState = (cartItems: CartItem[]) => {
    const cartMap: { [key: string]: number } = {};
    let itemCount = 0;
    cartItems.forEach(item => {
      const key = getCartKey(item.product_id, item.color_variation_id);
      cartMap[key] = item.quantity;
      itemCount += item.quantity;
    });
    setCart(cartMap);
    setCartItemCount(itemCount);
  };

  useEffect(() => {
    if (location.state && location.state.category) {
      setSelectedCategory(location.state.category);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiService.get('/backend/user/get_products.php');
        if (response.success && Array.isArray((response as any).data)) {
          const formattedProducts = (response as any).data.map((p: any) => ({
            ...p,
            id: Number(p.id),
            price: Number(p.price),
            stock: Number(p.stock),
            image_url: p.image_url || '/default-image.png'
          }));
          setProducts(formattedProducts);
          setFilteredProducts(formattedProducts);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    const fetchCart = async () => {
      try {
        const cartResponse = await cartService.getCart();
        const cartItems = Array.isArray(cartResponse?.items) ? cartResponse.items : [];
        updateCartState(cartItems);
      } catch (err) {
        setCart({});
        setCartItemCount(0);
      }
    };

    fetchProducts();
    fetchCart();

  }, [isLoggedIn, setCartItemCount]);

  // Filter and sort products
  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered = [...filtered].sort((a, b) => {
          const aDate = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
          const bDate = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
          return bDate - aDate;
        });
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = async (productId: number, quantity: number, colorVariationId?: number, price?: number) => {
    try {
      const response = await cartService.addToCart(productId, quantity, colorVariationId);
      toast({
        title: "Added to Cart",
        description: "Item added to your cart successfully",
      });
      if (response && response.items) {
        updateCartState(response.items);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add to cart",
        variant: "destructive"
      });
    }
  };

  const handleAddToCart = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    let colorVariationId = undefined;
    let price = product?.price;
    let stock = product?.stock;
    if (product && product.color_variations && product.color_variations.length > 0) {
      colorVariationId = product.color_variations[0].id;
      price = product.color_variations[0].price;
      stock = product.color_variations[0].stock;
    }
    const cartKey = getCartKey(productId, colorVariationId);
    if (!stock || stock === 0) {
      toast({ title: "Out of Stock", description: "This product is out of stock.", variant: "destructive" });
      return;
    }
    if ((cart[cartKey] || 0) + 1 > stock) {
      toast({ title: "Insufficient Stock", description: "Not enough stock available.", variant: "destructive" });
      return;
    }
    await addToCart(productId, 1, colorVariationId, price || 0);
  };

  const getProductStock = (product: Product) => {
    if (product.color_variations && product.color_variations.length > 0) {
      return Math.max(product.color_variations[0].stock, 0);
    }
    return Math.max(product.stock, 0);
  };

  const isProductOutOfStock = (product: Product) => getProductStock(product) === 0;

  const handleBuyNow = (productId: number) => {
    const product = products.find(p => p.id === productId);
    let colorVariationId = undefined;
    let stock = product?.stock;
    if (product && product.color_variations && product.color_variations.length > 0) {
      colorVariationId = product.color_variations[0].id;
      stock = product.color_variations[0].stock;
    }
    if (!stock || stock === 0) {
      toast({ title: "Out of Stock", description: "This product is out of stock.", variant: "destructive" });
      return;
    }
    localStorage.setItem('buyNowData', JSON.stringify({ productId, colorVariationId, quantity: 1 }));
    navigate('/checkout');
  };

  const dbCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const categories = ['all', ...dbCategories];
  if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
    categories.push(selectedCategory);
  }

  // Skeleton shimmer for loading
  const SkeletonCard = () => (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
      <div className="h-64 bg-stone-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-stone-100 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-stone-100 rounded w-1/2 animate-pulse" />
        <div className="flex gap-2 pt-2">
          <div className="h-10 bg-stone-100 rounded flex-1 animate-pulse" />
          <div className="h-10 bg-stone-100 rounded flex-1 animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-48 bg-stone-200 rounded-lg mx-auto mb-12 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 selection:bg-amber-200 selection:text-amber-900">

      {/* Background Ambient Effects - Subtle Light */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gradient-to-bl from-amber-50 to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-gradient-to-tr from-rose-50 to-transparent opacity-60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-amber-200 text-amber-700 text-xs font-bold tracking-widest uppercase shadow-sm"
          >
            Start Shopping
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black font-serif text-stone-900 tracking-tight"
          >
            Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700">Collections</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-stone-600 text-lg max-w-2xl mx-auto font-light leading-relaxed"
          >
            Browse our exclusive selection of premium accessories designed to elevate your everyday style.
          </motion.p>
        </div>

        {/* Filters & Controls - Sticky Header Fixed */}
        <div ref={sentinelRef} className="sticky top-20 z-[99] mb-10 transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-xl border border-stone-200 rounded-2xl p-4 shadow-lg shadow-stone-200/50">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">

              {/* Mobile Toggle for Filters */}
              <div className="lg:hidden w-full flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-stone-800 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="shrink-0 border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                >
                  {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
                </Button>
              </div>

              {/* Desktop / Expanded Filters */}
              <div className={`w-full lg:flex flex-col lg:flex-row gap-4 items-center justify-between ${showFilters ? 'flex mt-4' : 'hidden'}`}>

                {/* Search (Desktop) */}
                <div className="relative hidden lg:block lg:w-96 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5 group-focus-within:text-amber-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search masterpieces..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-stone-50 hover:bg-white border border-stone-200 rounded-full pl-12 pr-6 py-3 text-stone-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-stone-400 shadow-inner"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  {/* Categories */}
                  <div className="relative min-w-[200px]">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none bg-stone-50 border border-stone-200 hover:border-amber-400 text-stone-700 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer font-medium"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="relative min-w-[180px]">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full appearance-none bg-stone-50 border border-stone-200 hover:border-amber-400 text-stone-700 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer font-medium"
                    >
                      <option value="newest">Newest Arrivals</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 px-2 leading-none">
              <span>Showing {filteredProducts.length} results</span>
              {filteredProducts.length === 0 && <span className="text-amber-600 font-medium">No products found</span>}
            </div>
          </div>
        </div>

        {/* Product Grid - Fixed Z-Index Context */}
        <AnimatePresence>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 relative z-0"
          >
            {filteredProducts.map((product) => {
              const colorVariationId = getColorVariantId(product);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="group relative z-0"
                >
                  <Card className="h-full bg-white border-stone-100 hover:border-amber-300 overflow-hidden transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] flex flex-col group-hover:-translate-y-1 rounded-2xl">

                    {/* Image Container */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-50">
                      <img
                        src={product.image_url || '/default-image.png'}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={e => (e.currentTarget.src = '/default-image.png')}
                      />

                      {/* Overlay Gradient - Subtle */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Quick Actions - Visible on Hover */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await toggleFavorite(product.id, colorVariationId, product);
                          }}
                          className={`p-3 rounded-full backdrop-blur-md border shadow-sm transition-colors ${isFavorite(product.id, colorVariationId, product)
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white/90 text-stone-600 border-white/50 hover:bg-amber-500 hover:text-white hover:border-amber-500'}`}
                        >
                          <Heart className={`w-5 h-5 ${isFavorite(product.id, colorVariationId, product) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Stock Badge */}
                      {isProductOutOfStock(product) && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider backdrop-blur-md bg-opacity-90">
                          Sold Out
                        </div>
                      )}
                    </div>

                    <CardContent className="flex-1 flex flex-col p-5 gap-3 relative">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-stone-900 font-bold text-lg leading-tight group-hover:text-amber-700 transition-colors line-clamp-1 font-serif">
                            {product.name}
                          </h3>
                        </div>
                        <p className="text-stone-500 text-xs line-clamp-2 min-h-[2.5em] leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: product.description ? DOMPurify.sanitize(product.description) : '' }}
                        />
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-100">
                        <div className="text-xl font-bold text-stone-900">
                          <span className="text-amber-600 text-sm align-top mr-1 font-serif">₹</span>
                          {product.price}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isProductOutOfStock(product)}
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(product.id); }}
                            className="h-10 w-10 p-0 rounded-full border border-stone-200 hover:border-amber-500 hover:bg-white hover:text-amber-600 text-stone-400 bg-stone-50 transition-all"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            disabled={isProductOutOfStock(product)}
                            onClick={(e) => { e.stopPropagation(); handleBuyNow(product.id); }}
                            className="h-10 px-6 rounded-full bg-stone-900 text-white hover:bg-amber-500 hover:text-white font-bold text-xs tracking-wide transition-all shadow-md hover:shadow-lg hover:shadow-amber-500/30"
                          >
                            Buy
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6 border border-stone-200">
              <Search className="h-10 w-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-medium text-stone-900 mb-2 font-serif">No products found</h3>
            <p className="text-stone-500 max-w-sm mx-auto">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              className="mt-6 border-stone-200 text-stone-600 hover:bg-stone-50"
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
            >
              Clear Filters
            </Button>
          </div>
        )}

      </div>

      {showTopBtn && (
        <button
          onClick={handleBackToTop}
          className="fixed bottom-8 right-8 bg-black text-white p-3 rounded-full shadow-lg hover:bg-amber-500 hover:scale-110 transition-all z-[100]"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {feedbackProduct && (
        <FeedbackModal
          open={showFeedback}
          onOpenChange={(open) => {
            setShowFeedback(open);
            if (!open) navigate('/orders');
          }}
          type="product"
          itemId={feedbackProduct.id}
          itemName={feedbackProduct.name}
          onSubmitted={() => {
            setShowFeedback(false);
            navigate('/orders');
          }}
        />
      )}
    </div>
  );
};

export default Shop;
