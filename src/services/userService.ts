import { apiService } from './apiService';

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

export interface CartItem {
    product_id: number;
    quantity: number;
}

export interface WishlistItem {
    product_id: number;
    color_variation_id?: number;
    product?: {
        color_variations: { id: number }[];
    };
}

// BookingData interface removed

export interface UserResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

// Standalone error message helper
function getErrorMessage(err: unknown): string {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        return (err as { message: string }).message;
    }
    return 'An error occurred';
}

class UserService {
    private validateCartItem(item: CartItem): void {
        if (!item.product_id || item.product_id <= 0) {
            throw new Error('Invalid product ID');
        }
        if (!item.quantity || item.quantity <= 0) {
            throw new Error('Quantity must be at least 1');
        }
    }

    private validateWishlistItem(item: WishlistItem): void {
        if (!item.product_id || item.product_id <= 0) {
            throw new Error('Invalid product ID');
        }
    }

    // Booking validation removed

    private isValidDate(date: string): boolean {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;
        const bookingDate = new Date(date);
        const today = new Date();
        return bookingDate >= today;
    }

    private isValidTime(time: string): boolean {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPhone(phone: string): boolean {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return phoneRegex.test(phone);
    }

    // Cart operations
    async addToCart(data: CartItem): Promise<UserResponse> {
        try {
            this.validateCartItem(data);
            const response = await apiService.post('/backend/user/add_to_cart.php', data);
            return {
                success: true,
                data: response
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to add item to cart'
            };
        }
    }

    async removeFromCart(productId: number): Promise<UserResponse> {
        try {
            if (!productId || productId <= 0) {
                throw new Error('Invalid product ID');
            }
            const response = await apiService.post('/backend/user/remove_from_cart.php', { product_id: productId });
            return {
                success: true,
                data: response
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to remove item from cart'
            };
        }
    }

    // Wishlist operations
    async getWishlist(): Promise<UserResponse> {
        try {
            const response = await apiService.get('/backend/user/wishlist_get.php');
            return {
                success: true,
                data: response
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to fetch wishlist'
            };
        }
    }

    async addToWishlist(data: WishlistItem): Promise<UserResponse> {
        try {
            this.validateWishlistItem(data);
            // If product has color variants and color_variation_id is not set, set it to the first color variant
            if (data.product && data.product.color_variations && data.product.color_variations.length > 0 && !data.color_variation_id) {
                data.color_variation_id = data.product.color_variations[0].id;
            }
            const response = await apiService.post('/backend/user/wishlist_add.php', data);
            return {
                success: true,
                data: response
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to add item to wishlist'
            };
        }
    }

    async removeFromWishlist(productId: number, colorVariationId?: number): Promise<UserResponse> {
        try {
            if (!productId || productId <= 0) {
                throw new Error('Invalid product ID');
            }
            const response = await apiService.post('/backend/user/wishlist_remove.php', { product_id: productId, color_variation_id: colorVariationId });
            return {
                success: true,
                data: response
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to remove item from wishlist'
            };
        }
    }

    // Favorites and History
    async getFavorites(): Promise<UserResponse> {
        try {
            const response = await apiService.get('/user/favorites.php');
            return {
                success: true,
                data: response
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to fetch favorites'
            };
        }
    }

    async getHistory(): Promise<UserResponse> {
        try {
            const response = await apiService.get('/backend/user/history.php');
            return {
                success: true,
                data: response
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to fetch history'
            };
        }
    }

    // Booking operations removed

    // Profile operations
    async getProfile(): Promise<UserResponse> {
        try {
            const response = await apiService.get('/backend/user/profile.php');
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: getErrorMessage(error) || 'Failed to fetch profile' };
        }
    }

    async updateProfile(data: any): Promise<UserResponse> {
        try {
            const response = await apiService.post('/backend/user/profile.php', data);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: getErrorMessage(error) || 'Failed to update profile' };
        }
    }
}

export const userService = new UserService(); 