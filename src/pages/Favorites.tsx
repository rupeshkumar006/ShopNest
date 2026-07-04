import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { favoriteService, cartService } from '../services';
import { useUserAuth } from '../context/UserAuthContext';
import type { Product } from '../services/productService';
import type { Favorite } from '../services/favoriteService';
import DOMPurify from 'dompurify';
import { useFavorites } from '../context/FavoritesContext';

function getErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') return (err as { message: string }).message;
  return 'An error occurred';
}

interface FavoritesProps {
  setCartItemCount: (count: number) => void;
}

const Favorites = ({ setCartItemCount }: FavoritesProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserAuth();
  const { favorites, isFavorite, toggleFavorite, loading } = useFavorites();
  const [cart, setCart] = useState<{ [productId: number]: number }>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartResponse = await cartService.getCart();
        const cartItems = Array.isArray(cartResponse?.items) ? cartResponse.items : [];
        const cartMap: { [productId: number]: number } = {};
        cartItems.forEach(item => {
          cartMap[item.product_id] = item.quantity;
        });
        setCart(cartMap);
      } catch { }
    };
    fetchCart();
  }, [isLoggedIn]);

  const addToCart = async (favorite: any) => {
    // Guest allowed
    const product = favorite.product;
    const productId = product ? product.id : favorite.productId;
    const productName = product ? product.name : 'Product';
    let colorVariationId = favorite.colorVariationId;
    if (colorVariationId === undefined || colorVariationId === null) {
      colorVariationId = product && product.color_variations && product.color_variations.length > 0 ? product.color_variations[0].id : undefined;
    }
    // Find the correct variant stock
    let stock = product && product.color_variations && colorVariationId
      ? (product.color_variations.find((v: any) => v.id === colorVariationId)?.stock ?? product.stock)
      : (product ? product.stock : 0);
    const cartKey = productId + '_' + (colorVariationId ?? 'default');

    // Always fetch latest cart state before adding
    let currentQty = 0;
    try {
      const cartResponse = await cartService.getCart();
      const cartItems = Array.isArray(cartResponse?.items) ? cartResponse.items : [];
      const cartItem = cartItems.find((item: any) => item.product_id === productId && item.color_variation_id === colorVariationId);
      currentQty = cartItem ? cartItem.quantity : 0;
    } catch { }

    if (!stock || stock === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is out of stock.",
        variant: "destructive"
      });
      return;
    }
    // Removed global 5-quantity cap; only enforce stock
    if (currentQty + 1 > stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${stock} units available in stock.`,
        variant: "destructive"
      });
      return;
    }
    try {
      const updatedCartResponse = await cartService.addToCart(productId, 1, colorVariationId);
      const count = await cartService.getCartItemCount();
      setCartItemCount(count);
      // Update local cart state
      setCart((prev) => ({ ...prev, [cartKey]: (prev[cartKey] || 0) + 1 }));
      toast({
        title: "Added to Cart",
        description: `${productName} has been added to your cart`
      });
    } catch (err: any) {
      const errorMsg = err?.error?.message || err?.message || '';
      toast({
        title: "Error",
        description: errorMsg || getErrorMessage(err),
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{getErrorMessage(error)}</div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 border-b border-stone-200 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900">Your Wishlist</h1>
            <p className="text-stone-500 mt-2">Saved items for your future collections</p>
          </div>
          <span className="text-stone-400 font-medium hidden sm:block">
            {favorites?.length} Items
          </span>
        </div>

        {favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((fav) => {
              const product = fav.product;
              if (!product) return null;

              // Find the correct color variant
              let colorVariant = null;
              if (product.color_variations && product.color_variations.length > 0) {
                if (fav.colorVariationId) {
                  colorVariant = product.color_variations.find(v => v.id === fav.colorVariationId) || product.color_variations[0];
                } else {
                  colorVariant = product.color_variations[0];
                }
              }

              const displayImage = colorVariant && colorVariant.images && colorVariant.images.length > 0
                ? colorVariant.images[0]
                : (product.gallery && product.gallery.length > 0 ? product.gallery[0] : (product.image_url ? product.image_url : '/default-image.png'));

              const displayPrice = colorVariant ? colorVariant.price : product.price;
              const displayStock = colorVariant ? colorVariant.stock : product.stock;
              const isOutOfStock = displayStock <= 0;

              return (
                <div key={`${fav.productId}_${fav.colorVariationId ?? 'default'}`} className="group bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative">
                  {/* Image Container */}
                  <div
                    className="relative aspect-[4/5] overflow-hidden cursor-pointer bg-gray-100"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={e => (e.currentTarget.src = '/default-image.png')}
                    />

                    {/* Floating Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(fav.productId, fav.colorVariationId, product);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-pink-500 hover:text-pink-600 shadow-md backdrop-blur-sm transition-all transform hover:scale-110"
                      title="Remove from Wishlist"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>

                    {/* Out of Stock Overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-2">
                      {product.category && (
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 block">{product.category}</span>
                      )}
                      <h3
                        className="font-serif font-bold text-lg text-stone-900 leading-tight cursor-pointer hover:text-amber-700 transition-colors line-clamp-2"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {product.name}
                      </h3>
                      {colorVariant && colorVariant.color_name && colorVariant.color_name !== 'Default' && (
                        <p className="text-sm text-stone-500 mt-1 flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full border border-stone-200" style={{ backgroundColor: colorVariant.hex_code }}></span>
                          {colorVariant.color_name}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-stone-900">₹{displayPrice}</span>
                      </div>
                      <Button
                        onClick={() => addToCart(fav)}
                        disabled={isOutOfStock}
                        size="sm"
                        className={`rounded-lg font-medium transition-all ${isOutOfStock ? 'bg-stone-200 text-stone-400' : 'bg-stone-900 hover:bg-amber-600 text-white shadow-lg shadow-stone-900/10'}`}
                      >
                        {isOutOfStock ? 'Sold Out' : (
                          <>
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-xl border border-dashed border-stone-200">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Your wishlist is empty</h3>
            <p className="text-stone-500 mb-6 max-w-sm mx-auto">Browse our collections and save your favorite items here.</p>
            <Button onClick={() => navigate('/shop')} className="bg-stone-900 hover:bg-amber-600 text-white rounded-full px-8">
              Explore Collection
            </Button>
          </div>
        )}
      </div>
    </div>


  );
};

export default Favorites;