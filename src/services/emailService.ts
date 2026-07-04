import { apiService } from './apiService';

export interface EmailData {
    type: string;
    [key: string]: any;
}

export interface OrderItem {
    name: string;
    quantity: number;
}

export interface OrderConfirmationEmailData {
    to: string;
    order_id: string;
    amount: string;
    items: OrderItem[];
}

// BookingConfirmationEmailData interface removed

export interface PasswordResetEmailData {
    to: string;
    resetToken: string;
}

export interface EmailResponse {
    success: boolean;
    error?: string;
}

class EmailService {
    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private validateOrderData(data: OrderConfirmationEmailData): void {
        if (!this.validateEmail(data.to)) {
            throw new Error('Invalid email address');
        }
        if (!data.order_id || !data.amount || !data.items?.length) {
            throw new Error('Missing required order data');
        }
    }

    // Booking email validation removed

    private validatePasswordResetData(data: PasswordResetEmailData): void {
        if (!this.validateEmail(data.to)) {
            throw new Error('Invalid email address');
        }
        if (!data.resetToken) {
            throw new Error('Reset token is required');
        }
    }

    async sendOrderConfirmation(orderData: OrderConfirmationEmailData): Promise<EmailResponse> {
        try {
            this.validateOrderData(orderData);
            await apiService.post('/backend/utils/send_email.php', {
                type: 'order_confirmation',
                ...orderData
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send order confirmation email'
            };
        }
    }

    // Booking confirmation email removed

    async sendPasswordReset(data: PasswordResetEmailData): Promise<EmailResponse> {
        try {
            this.validatePasswordResetData(data);
            await apiService.post('/backend/utils/send_email.php', {
                type: 'password_reset',
                ...data
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send password reset email'
            };
        }
    }

    async sendEmail(data: EmailData): Promise<void> {
        await apiService.post('/backend/utils/send_email.php', data);
    }
}

export const emailService = new EmailService(); 