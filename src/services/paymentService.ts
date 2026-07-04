import { apiService } from './apiService';

export interface OrderDetails {
    amount: number;
    currency: string;
    description: string;
    user_id: number;
    name: string;
    phone: string;
    shipping_address: string;
    billing_address: string;
    cart: Array<{
        product_id: number;
        quantity: number;
        price: number;
    }>;
    platform_fee: number;
    delivery_charge: number;
    subtotal: number;
    shipping_state?: string;
    billing_state?: string;
    coupon_code?: string;
    discount_amount?: number;
    guest_email?: string;
}

export interface PaymentConfirmation {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface PaymentOrderData {
    order_id: string;
    status?: string;
    warning?: string;
}

export interface PaymentResponse {
    success: boolean;
    data?: any;
    order_id?: string;
    error?: string;
}

class PaymentService {
    private validateOrderDetails(orderDetails: OrderDetails): void {
        if (!orderDetails.amount || orderDetails.amount <= 0) {
            throw new Error('Invalid order amount');
        }
        if (!orderDetails.cart || orderDetails.cart.length === 0) {
            throw new Error('Order must contain at least one item');
        }
        // User ID check removed for guest checkout support
        if (orderDetails.cart.some(item => item.quantity <= 0)) {
            throw new Error('Invalid item quantity');
        }
    }

    async createOrder(orderDetails: OrderDetails): Promise<PaymentResponse> {
        try {
            this.validateOrderDetails(orderDetails);
            const response = await apiService.post<PaymentOrderData>('/backend/payments/create_order.php', orderDetails);
            if (response.success && response.data && response.data.order_id) {
                return {
                    success: true,
                    data: response.data,
                    order_id: response.data.order_id
                };
            }
            return {
                success: false,
                error: response.error?.message || 'Failed to create order'
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create order'
            };
        }
    }

    async confirmPayment(paymentData: PaymentConfirmation): Promise<PaymentResponse> {
        try {
            if (!paymentData.razorpay_order_id || !paymentData.razorpay_payment_id) {
                throw new Error('Missing payment details');
            }
            const response = await apiService.post<PaymentOrderData>('/backend/payments/confirm_payment.php', paymentData);
            if (response.success) {
                let warning = response.data && response.data.warning ? response.data.warning : undefined;
                return {
                    success: true,
                    order_id: paymentData.razorpay_order_id,
                    data: { warning }
                };
            }
            return {
                success: false,
                error: response.error?.message || 'Payment confirmation failed'
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Payment confirmation failed'
            };
        }
    }

    async getOrderStatus(orderId: string): Promise<PaymentResponse> {
        try {
            const response = await apiService.get<PaymentOrderData>(`/backend/payments/order_status.php?order_id=${orderId}`);
            if (response.success && response.data && response.data.status === 'success') {
                return {
                    success: true,
                    order_id: orderId
                };
            }
            return {
                success: false,
                error: response.error?.message || 'Failed to get order status'
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get order status'
            };
        }
    }
}

export const paymentService = new PaymentService(); 