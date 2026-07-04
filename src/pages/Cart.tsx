import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingCart, Truck, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { cartService, CartItem } from '../services/cartService';
import { useUserAuth } from '../context/UserAuthContext';
import DOMPurify from 'dompurify';
import { productService, ColorVariation } from '../services/productService';

interface CartProps {
  setCartItemCount: (count: number) => void;
}

const Cart = ({ setCartItemCount }: CartProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useUserAuth();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [colorOptions, setColorOptions] = useState<{ [productId: number]: ColorVariation[] }>({});
  const [loadingColors, setLoadingColors] = useState<{ [cartItemId: number]: boolean }>({});

  const [cartImages, setCartImages] = useState<{ [cartItemId: number]: string }>({});
  const [stockLimits, setStockLimits] = useState<{ [cartItemId: number]: number }>({});

  // Helper to update cartImages for all cart items
  const updateCartImages = async (cartItems: CartItem[]) => {
    const newImages: { [cartItemId: number]: string } = {};
    for (const item of cartItems) {
      if (item.product_id && item.color_variation_id) {
        const res = await productService.getProductById(item.product_id);
        if (res.success && res.data && res.data[0]?.color_variations) {
          const variant = res.data[0].color_variations.find(v => v.id === item.color_variation_id);
          if (variant && variant.images && variant.images.length > 0) {
            newImages[item.id] = variant.images[0];
          } else {
            newImages[item.id] = res.data[0].image_url || '/default-image.png';
          }
        }
      } else {
        newImages[item.id] = item.image_url || '/default-image.png';
      }
    }
    setCartImages(newImages);
  };

  // Fetch cart items
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartResponse = await cartService.getCart();
      console.log("cartResponse from cartService.getCart():", cartResponse);
      const cartItems = Array.isArray(cartResponse.items) ? cartResponse.items : [];
      setCart(cartItems);
      setCartItemCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
      await updateCartImages(cartItems);
    } catch (err) {
      setCart([]);
      setCartItemCount(0);
    } finally {
      setLoading(false);
    }
  }, [setCartItemCount]);

  useEffect(() => {
    fetchCart(); // initial fetch
  }, [fetchCart]);

  // Fetch color options and stock limits for all cart items
  useEffect(() => {
    const fetchDetails = async () => {
      const newOptions: { [productId: number]: ColorVariation[] } = {};
      const newStockLimits: { [cartItemId: number]: number } = {};

      for (const item of cart) {
        // Only fetch if we haven't already valid data, but for stock we might want to refresh?
        // Let's safe check: fetch if options missing OR we want stock.
        // To be safe and simple, we fetch product details for every item to ensure fresh stock.
        try {
          const res = await productService.getProductById(item.product_id);
          if (res.success && res.data && res.data[0]) {
            const prod = res.data[0];

            // Update color options
            if (prod.color_variations) {
              newOptions[item.product_id] = prod.color_variations;
            }

            // Determine stock
            let stock = prod.stock || 0;
            if (item.color_variation_id && prod.color_variations) {
              const variant = prod.color_variations.find(v => v.id === item.color_variation_id);
              if (variant) {
                stock = variant.stock;
              }
            }
            newStockLimits[item.id] = stock;
          }
        } catch (e) {
          console.error("Failed to fetch product details for cart item", item.id, e);
        }
      }

      if (Object.keys(newOptions).length > 0) {
        setColorOptions(prev => ({ ...prev, ...newOptions }));
      }
      if (Object.keys(newStockLimits).length > 0) {
        setStockLimits(prev => ({ ...prev, ...newStockLimits }));
      }
    };
    if (cart.length > 0) fetchDetails();
    // eslint-disable-next-line
  }, [cart]);

  const removeFromCart = async (productId: number, colorVariationId?: number) => {
    // Guest allowed
    try {
      const updatedCartResponse = await cartService.removeFromCart(productId, colorVariationId);
      if (updatedCartResponse?.items) {
        setCart(updatedCartResponse.items);
        setCartItemCount(updatedCartResponse.items.reduce((sum, item) => sum + item.quantity, 0));
        toast({ title: "Item Removed", description: "Item has been removed from your cart" });
      } else {
        fetchCart();
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove item from cart", variant: "destructive" });
    }
  };

  const updateQuantity = async (productId: number, colorVariationId: number | undefined, newQuantity: number) => {
    // Guest allowed
    const currentLimit = stockLimits[cart.find(c => c.product_id === productId && c.color_variation_id === colorVariationId)?.id || 0];

    if (newQuantity < 1) return;
    if (currentLimit !== undefined && newQuantity > currentLimit) {
      toast({ title: "Stock Limit Reached", description: `Only ${currentLimit} items available in stock.`, variant: "destructive" });
      return;
    }
    try {
      const updatedCartResponse = await cartService.updateQuantity(productId, newQuantity, colorVariationId);
      if (updatedCartResponse?.items) {
        setCart(updatedCartResponse.items);
        setCartItemCount(updatedCartResponse.items.reduce((sum, item) => sum + item.quantity, 0));
        toast({ title: "Quantity Updated", description: "Cart quantity has been updated." });
      } else {
        fetchCart();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update cart quantity", variant: "destructive" });
      fetchCart();
    }
  };

  const handleColorChange = async (item: CartItem, newColorId: number) => {
    setLoadingColors(prev => ({ ...prev, [item.id]: true }));
    try {
      // Remove old item, add new with same quantity but new color
      await cartService.removeFromCart(item.product_id, item.color_variation_id);
      await cartService.addToCart(item.product_id, item.quantity, newColorId);
      await fetchCart(); // This will update cart and images
      toast({ title: 'Color Updated', description: 'Cart item color updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update color', variant: 'destructive' });
    }
    setLoadingColors(prev => ({ ...prev, [item.id]: false }));
  };

  const getTotalPrice = () => cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);

  const getPlatformFee = () => {
    const subtotal = getTotalPrice();
    return Math.round(subtotal * 0.02 * 100) / 100; // 2% platform fee, rounded to 2 decimal places
  };

  const getDeliveryCharge = () => 80; // Fixed delivery charge of ₹80

  const getFinalTotal = () => getTotalPrice() + getPlatformFee() + getDeliveryCharge();

  const handleProceedToCheckout = () => {
    // Guest allowed
    // Clear any stale buyNowData before proceeding to checkout
    localStorage.removeItem('buyNowData');
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-amber-600" />
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-dashed border-stone-200">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Your cart is empty</h3>
            <p className="text-stone-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Button onClick={() => navigate('/shop')} className="bg-stone-900 hover:bg-amber-600 text-white rounded-full px-8 py-6 text-lg">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* Cart Items - Left Side */}
            <div className="lg:col-span-8 space-y-6">
              {cart.map((item) => {
                const currentStock = stockLimits[item.id] ?? 0;
                return (
                  <div key={item.id} className="bg-white rounded-xl p-4 sm:p-6 border border-stone-100 shadow-sm flex flex-col sm:flex-row gap-6 transition-all hover:shadow-md">
                    {/* Image */}
                    <div className="w-full sm:w-32 h-32 shrink-0 bg-stone-50 rounded-lg overflow-hidden border border-stone-200 cursor-pointer" onClick={() => navigate(`/product/${item.product_id}`)}>
                      <img
                        src={cartImages[item.id] || item.image_url || '/default-image.png'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.src = '/default-image.png'; }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3
                            className="font-serif font-bold text-lg text-stone-900 hover:text-amber-700 cursor-pointer line-clamp-1"
                            onClick={() => navigate(`/product/${item.product_id}`)}
                          >
                            {item.name}
                          </h3>
                          {/* Color selector */}
                          {colorOptions[item.product_id] && colorOptions[item.product_id].length > 1 && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Color:</span>
                              <div className="relative">
                                <select
                                  value={item.color_variation_id}
                                  onChange={e => handleColorChange(item, Number(e.target.value))}
                                  disabled={loadingColors[item.id]}
                                  className="appearance-none bg-stone-50 border border-stone-200 text-stone-700 text-sm rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                  {colorOptions[item.product_id].map(variation => (
                                    <option key={variation.id} value={variation.id}>
                                      {variation.color_name}
                                    </option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                              </div>
                              {loadingColors[item.id] && <span className="text-xs text-amber-500 animate-pulse">Updating...</span>}
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-lg text-stone-900 whitespace-nowrap">₹{item.price}</span>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                          <button
                            className="px-3 py-1 hover:bg-stone-200 text-stone-600 transition-colors disabled:opacity-50"
                            onClick={() => updateQuantity(item.product_id, item.color_variation_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-bold text-stone-900 border-x border-stone-200 min-w-[2.5rem] text-center">{item.quantity}</span>
                          <button
                            className="px-3 py-1 hover:bg-stone-200 text-stone-600 transition-colors disabled:opacity-50"
                            onClick={() => updateQuantity(item.product_id, item.color_variation_id, item.quantity + 1)}
                            disabled={currentStock !== undefined && item.quantity >= currentStock}
                          >
                            +
                          </button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product_id, item.color_variation_id)}
                          className="text-stone-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary - Right Side */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl p-6 sm:p-8 border border-stone-100 shadow-lg sticky top-8">
                <h2 className="text-xl font-serif font-bold text-stone-900 mb-6 pb-4 border-b border-stone-100">Order Summary</h2>

                <div className="space-y-4 text-stone-600 mb-6">
                  <div className="flex justify-between">
                    <span>Items ({cart.reduce((total, item) => total + item.quantity, 0)})</span>
                    <span className="font-medium">₹{getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee (2%)</span>
                    <span>₹{getPlatformFee()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Charge</span>
                    <span>₹{getDeliveryCharge()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-6 border-t border-stone-100 mb-8">
                  <span className="text-stone-500 font-medium">Total Amount</span>
                  <span className="text-3xl font-bold text-stone-900">₹{getFinalTotal()}</span>
                </div>

                <Button
                  className="w-full bg-stone-900 hover:bg-amber-600 text-white h-14 text-lg font-bold rounded-xl shadow-xl shadow-stone-900/10 hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
                  onClick={() => {
                    setIsCheckoutLoading(true);
                    // Reduced delay to 1.5 seconds as requested
                    setTimeout(() => {
                      handleProceedToCheckout();
                      setTimeout(() => setIsCheckoutLoading(false), 500);
                    }, 1000);
                  }}
                  disabled={isCheckoutLoading}
                >
                  Proceed to Checkout
                </Button>

                {/* Full Screen Loader Overlay */}
                {isCheckoutLoading && (
                  <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
                    <style>{`
                      @keyframes drive-across {
                        0% { left: 10%; transform: translateY(0); }
                        25% { transform: translateY(-1px); }
                        50% { transform: translateY(0); }
                        75% { transform: translateY(-1px); }
                        100% { left: 85%; transform: translateY(0); }
                      }
                      .animate-drive-across {
                        animation: drive-across 1.0s linear forwards;
                      }
                      @keyframes road-pass {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                      }
                    `}</style>
                    <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300 max-w-sm w-full">

                      {/* Animation Container */}
                      <div className="relative w-full h-24 mb-6 flex items-end justify-between px-2 overflow-hidden">

                        {/* Road Line */}
                        <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-stone-200"></div>

                        {/* Start Icon: Cart */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-2">
                            <ShoppingCart className="w-4 h-4" />
                          </div>
                        </div>

                        {/* End Icon: Payment */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
                            <CreditCard className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Moving Truck */}
                        <div className="absolute bottom-3 left-0 animate-drive-across z-20">
                          <Truck className="w-10 h-10 text-stone-800" />
                          {/* Speed lines trailing */}
                          <div className="absolute top-2 -left-4 w-4 h-0.5 bg-stone-300 opacity-50"></div>
                          <div className="absolute top-5 -left-6 w-3 h-0.5 bg-stone-300 opacity-50"></div>
                        </div>
                      </div>

                      <div className="text-xl font-serif font-bold text-stone-900">Heading to Payment</div>
                      <p className="text-stone-500 text-sm mt-2">Securing your items...</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-400">
                  <span className="bg-stone-100 px-2 py-1 rounded">Secure Checkout</span>
                  <span className="bg-stone-100 px-2 py-1 rounded">SSL Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>


  );
};

export default Cart;