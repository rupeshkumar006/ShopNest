import { apiService } from './apiService';
import type { Product } from './productService';

export interface Favorite {
    id: number;
    productId: number;
    userId: number;
    createdAt: string;
    colorVariationId?: number | null;
    product?: Product;
}

export interface FavoriteResponse {
    success: boolean;
    data?: Favorite[];
    error?: string;
}

function getErrorMessage(err: unknown): string {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') return (err as { message: string }).message;
    return 'An error occurred';
}

// Utility to ensure color variant ID is always sent for color variant products
export function getColorVariantId(product: any, colorVariationId?: number) {
    if (product && product.color_variations && product.color_variations.length > 0) {
        if (colorVariationId === undefined || colorVariationId === null || colorVariationId === 0) {
            return null; // default color, must be null for backend
        }
        return colorVariationId;
    }
    return null;
}

class FavoriteService {
    private validateProductId(productId: number): void {
        if (!productId || productId <= 0) {
            throw new Error('Invalid product ID');
        }
    }

    private validateUserId(userId: number): void {
        if (!userId || userId <= 0) {
            throw new Error('Invalid user ID');
        }
    }

    async getFavorites(): Promise<Favorite[]> {
        const response = await apiService.get('/backend/user/wishlist_get.php');
        if (response && response.success && Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    }

    async addFavorite(product: any, colorVariationId?: number): Promise<FavoriteResponse> {
        try {
            this.validateProductId(product.id);
            const colorId = getColorVariantId(product, colorVariationId);
            const response = await apiService.post('/backend/user/wishlist_add.php', { product_id: product.id, color_variation_id: colorId });
            const data: Favorite[] = response?.data ? [response.data as Favorite] : [];
            return {
                success: true,
                data
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to add favorite',
                data: []
            };
        }
    }

    async removeFavorite(productId: number, colorVariationId?: number): Promise<FavoriteResponse> {
        try {
            this.validateProductId(productId);
            // Always normalize colorVariationId
            const colorId = colorVariationId !== undefined && colorVariationId !== null && colorVariationId !== 0 ? colorVariationId : undefined;
            const response = await apiService.post('/backend/user/wishlist_remove.php', { product_id: productId, color_variation_id: colorId });
            const data: Favorite[] = response?.data ? [response.data as Favorite] : [];
            return {
                success: true,
                data
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to remove favorite',
                data: []
            };
        }
    }

    async isFavorite(productId: number): Promise<boolean> {
        try {
            this.validateProductId(productId);
            const response = await apiService.get('/backend/user/wishlist_get.php');
            if (response && response.success && Array.isArray(response.data)) {
                return response.data.some((fav: any) => fav.productId === productId);
            }
            return false;
        } catch (error: unknown) {
            console.error('Failed to check favorite status:', getErrorMessage(error));
            return false;
        }
    }

    async getWishlist(): Promise<FavoriteResponse> {
        const response = await apiService.get('/backend/user/wishlist_get.php');
        if (response.success) {
            return {
                success: true,
                data: response.data as Favorite[]
            };
        }
        throw new Error(response.error?.message || 'Failed to fetch wishlist');
    }

    async wishlistCheck(productId: number): Promise<FavoriteResponse> {
        const response = await apiService.get(`/backend/user/wishlist_check.php?product_id=${productId}`);
        if (response.success) {
            return {
                success: true,
                data: response.data as Favorite[]
            };
        }
        throw new Error(response.error?.message || 'Failed to check wishlist');
    }
}

export const favoriteService = new FavoriteService(); 