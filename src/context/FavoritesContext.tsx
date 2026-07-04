import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { favoriteService } from '../services/favoriteService';
import { useUserAuth } from './UserAuthContext';
import { useToast } from '@/components/ui/use-toast';

interface FavoritesContextType {
  favorites: { productId: number; colorVariationId?: number; product?: any }[];
  isFavorite: (productId: number, colorVariationId?: number, product?: any) => boolean;
  toggleFavorite: (productId: number, colorVariationId?: number, product?: any) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

function normalizeColorVariationId(id: any, product?: any) {
  if (!product || !product.color_variations || product.color_variations.length === 0) return null;
  if (id === undefined || id === null || id === 0 || id === '0') return null;
  return Number(id);
}

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn } = useUserAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<{ productId: number; colorVariationId?: number; product?: any }[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshFavorites = async () => {
    setLoading(true);
    try {
      if (isLoggedIn) {
        const favs = await favoriteService.getFavorites();
        const mapped = Array.isArray(favs)
          ? favs.map((fav: any) => ({
            productId: Number(fav.productId),
            colorVariationId: fav.colorVariationId === undefined || fav.colorVariationId === null || fav.colorVariationId === 0 ? null : Number(fav.colorVariationId),
            product: fav.product
          }))
          : [];
        setFavorites(mapped);
      } else {
        // Guest mode - load from localStorage
        const storedFavs = localStorage.getItem('guest_favorites');
        if (storedFavs) {
          setFavorites(JSON.parse(storedFavs));
        } else {
          setFavorites([]);
        }
      }
    } catch (e) {
      console.error('[FavoritesContext] Failed to refresh favorites:', e);
      // Fallback to empty context on error, but don't clear localStorage if it was a network error for logged in user? 
      // Current logic clears it. For guest, it wont fail in catch block usually.
      if (!isLoggedIn) setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, [isLoggedIn]);

  const isFavorite = (productId: number, colorVariationId?: number, product?: any) => {
    const normColorId = normalizeColorVariationId(colorVariationId, product);
    const found = favorites.some(
      fav => fav.productId === Number(productId) && normalizeColorVariationId(fav.colorVariationId, fav.product) === normColorId
    );
    return found;
  };

  const toggleFavorite = async (productId: number, colorVariationId?: number, product?: any) => {
    let normColorId: number | null = null;
    if (product && product.color_variations && product.color_variations.length > 0) {
      if (colorVariationId === undefined || colorVariationId === null || colorVariationId === 0) {
        normColorId = null;
      } else {
        normColorId = Number(colorVariationId);
      }
    } else {
      normColorId = null;
    }

    if (isFavorite(productId, normColorId, product)) {
      const newFavorites = favorites.filter(fav => !(fav.productId === Number(productId) && normalizeColorVariationId(fav.colorVariationId, fav.product) === normColorId));
      setFavorites(newFavorites);

      if (isLoggedIn) {
        await favoriteService.removeFavorite(productId, normColorId);
      } else {
        localStorage.setItem('guest_favorites', JSON.stringify(newFavorites));
      }
      toast({ title: 'Removed from Favorites', description: 'Item has been removed from your favorites' });
    } else {
      const newFav = { productId: Number(productId), colorVariationId: normColorId, product };
      const newFavorites = [...favorites, newFav];
      setFavorites(newFavorites);

      if (isLoggedIn) {
        await favoriteService.addFavorite(product, normColorId);
        // Refresh to get server state (IDs etc)
        await refreshFavorites();
      } else {
        localStorage.setItem('guest_favorites', JSON.stringify(newFavorites));
      }
      toast({ title: 'Added to Favorites', description: 'Item has been added to your favorites' });
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, refreshFavorites, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}; 