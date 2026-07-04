import { apiService, ApiResponse } from './apiService';

export interface Product {
    id?: number;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url?: string;
    stock: number;
    unit_type?: 'pieces' | 'packets';
    packet_size?: number | null;
}

export interface AdminLogin {
    username: string;
    password: string;
}

export interface AdminStats {
    totalUsers: number;
    totalRevenue: number;
}

class AdminService {
    private validateProduct(product: Product): void {
        if (!product.name?.trim()) {
            throw new Error('Product name is required');
        }
        if (!product.description?.trim()) {
            throw new Error('Product description is required');
        }
        if (product.price <= 0) {
            throw new Error('Product price must be greater than 0');
        }
        if (!product.category?.trim()) {
            throw new Error('Product category is required');
        }
        if (product.stock < 0) {
            throw new Error('Product stock cannot be negative');
        }
    }

    private validateBooking(booking: { booking_id: number; date: string; time: string; status: string }): void {
        if (!booking.booking_id) {
            throw new Error('Booking ID is required');
        }
        if (!booking.date || !this.isValidDate(booking.date)) {
            throw new Error('Invalid date format');
        }
        if (!booking.time || !this.isValidTime(booking.time)) {
            throw new Error('Invalid time format');
        }
        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(booking.status)) {
            throw new Error('Invalid booking status');
        }
    }

    private isValidDate(date: string): boolean {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(date);
    }

    private isValidTime(time: string): boolean {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }


    async adminLogin(data: AdminLogin): Promise<ApiResponse> {
        try {
            if (!data.username?.trim() || !data.password?.trim()) {
                throw new Error('Username and password are required');
            }
            const response = await apiService.post('/backend/admin/admin_login.php', data);
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : 'Login failed' }
            };
        }
    }

    async viewBookings(): Promise<ApiResponse> {
        const response = await apiService.get<ApiResponse>('/backend/admin/view_bookings.php');
        if (response.success) {
            return response;
        }
        throw new Error(response.error?.message || 'Failed to fetch bookings');
    }

    async viewOrders(): Promise<ApiResponse> {
        const response = await apiService.get<ApiResponse>('/backend/admin/view_orders.php');
        if (response.success) {
            return response;
        }
        throw new Error(response.error?.message || 'Failed to fetch orders');
    }

    async fetchStats(): Promise<ApiResponse> {
        const response = await apiService.get<ApiResponse>('/backend/admin/stats.php');
        if (response.success) {
            return response;
        }
        throw new Error(response.error?.message || 'Failed to fetch stats');
    }

    async getProducts(): Promise<ApiResponse> {
        const response = await apiService.get<ApiResponse>('/backend/admin/get_products.php');
        if (response.success) {
            return response;
        }
        throw new Error(response.error?.message || 'Failed to fetch products');
    }

    async addProduct(product: Product): Promise<ApiResponse> {
        const fd = new FormData();
        Object.entries(product).forEach(([k, v]) => fd.append(k, v));
        const response = await apiService.post('/backend/admin/add_product.php', fd);
        return { success: true, data: response };
    }

    async editProduct(product: Product): Promise<ApiResponse> {
        try {
            if (!product.id) {
                throw new Error('Product ID is required for editing');
            }
            this.validateProduct(product);
            const fd = new FormData();
            Object.entries(product).forEach(([k, v]) => fd.append(k, v));
            const response = await apiService.post('/backend/admin/edit_product.php', fd);
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : 'Failed to edit product' }
            };
        }
    }

    async deleteProduct(productId: number): Promise<ApiResponse> {
        try {
            if (!productId) {
                throw new Error('Product ID is required');
            }
            const response = await apiService.post('/backend/admin/delete_product.php', { id: productId });
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : 'Failed to delete product' }
            };
        }
    }

    // Removed Service Methods

    async setReviewFeatured(reviewId: number, isFeatured: boolean): Promise<ApiResponse> {
        const response = await apiService.post('/backend/admin/feature_review.php', {
            review_id: reviewId,
            is_featured: isFeatured ? 1 : 0,
            review_type: 'product'
        });
        return response;
    }

    async getAllReviews(): Promise<ApiResponse> {
        const response = await apiService.get<ApiResponse>('/backend/admin/get_all_reviews.php');
        return response;
    }

    // Banner Methods
    async getBanners(isAdmin: boolean = false): Promise<ApiResponse<Banner[]>> {
        const response = await apiService.get<Banner[]>(`/backend/admin/get_banners.php?admin=${isAdmin}`);
        return response;
    }

    async addBanner(data: FormData): Promise<ApiResponse> {
        const response = await apiService.post('/backend/admin/add_banner.php', data);
        return response;
    }

    async deleteBanner(id: number): Promise<ApiResponse> {
        const response = await apiService.post('/backend/admin/delete_banner.php', { id });
        return response;
    }

    async toggleBannerStatus(id: number, isActive: boolean): Promise<ApiResponse> {
        const response = await apiService.post('/backend/admin/update_banner_status.php', { id, is_active: isActive });
        return response;
    }

    // Coupon Methods
    async getCoupons(): Promise<ApiResponse<Coupon[]>> {
        const response = await apiService.get<Coupon[]>('/backend/admin/get_coupons.php');
        return response;
    }

    async addCoupon(data: any): Promise<ApiResponse> {
        const response = await apiService.post('/backend/admin/add_coupon.php', data);
        return response;
    }

    async toggleCouponStatus(id: number, isActive: boolean): Promise<ApiResponse> {
        const response = await apiService.post('/backend/admin/update_coupon_status.php', { id, is_active: isActive });
        return response;
    }

    async deleteCoupon(id: number): Promise<ApiResponse> {
        const response = await apiService.post('/backend/admin/delete_coupon.php', { id });
        return response;
    }
}

export interface BannerImage {
    id?: number;
    image_url: string;
    link_url?: string;
    display_order: number;
}

export interface Banner {
    id: number;
    title?: string;
    description?: string;
    style_template: 'standard' | 'modern_overlay' | 'split' | 'glassmorphism';
    is_active: boolean;
    display_order: number;
    images: BannerImage[];
}

export interface Coupon {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    usage_limit_per_user: number;
    is_active: boolean;
    created_at?: string;
}

export const adminService = new AdminService();