import { apiService } from './apiService';
import type { User } from '../context/AuthContext';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData extends LoginCredentials {
    name: string;
    phone?: string;
}

export interface OTPData {
    email: string;
    otp: string;
}

export interface ResetPasswordData {
    email: string;
    otp: string;
    newPassword: string;
}

export interface AuthResponse {
    success: boolean;
    data?: {
        user: {
            id: string;
            email: string;
            name: string;
            isAdmin: boolean;
        };
        token: string;
    };
    error?: string;
}

function getErrorMessage(err: unknown): string {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: string }).message === 'string') return (err as { message: string }).message;
    return 'An error occurred';
}

class AuthService {
    private validateEmail(email: string): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }

    private validatePassword(password: string): void {
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
    }

    private validateName(name: string): void {
        if (!name?.trim()) {
            throw new Error('Name is required');
        }
        if (name.length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }
    }

    private validatePhone(phone: string): void {
        if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
            throw new Error('Invalid phone number format');
        }
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            this.validateEmail(credentials.email);
            if (!credentials.password?.trim()) {
                throw new Error('Password is required');
            }
            const response = await apiService.post('/backend/auth/login.php', credentials);

            if (!response.success || !response.data || !(response.data as any).data) {
                return {
                    success: false,
                    error: response.error?.message || 'Failed to login'
                };
            }
            const { user, token } = (response.data as any).data;
            if (typeof token === 'string' && user) {
                apiService.setAuthToken(token);
                return { success: true, data: { user, token } };
            }
            return {
                success: false,
                error: response.error?.message || 'Failed to login'
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to login'
            };
        }
    }

    async register(data: RegisterData): Promise<any> {
        try {
            this.validateEmail(data.email);
            this.validatePassword(data.password);
            this.validateName(data.name);
            if (data.phone) {
                this.validatePhone(data.phone);
            }
            const response = await apiService.post('/backend/auth/register.php', data);
            return response; // Return the full backend response, including redirect
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to register'
            };
        }
    }

    async sendOTP(email: string, forReset: boolean = false): Promise<AuthResponse> {
        try {
            this.validateEmail(email);
            const response = await apiService.post('/backend/auth/send_otp.php', { email, forReset });
            return response;
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to send OTP'
            };
        }
    }

    async verifyOTP(data: OTPData): Promise<AuthResponse> {
        try {
            this.validateEmail(data.email);
            if (!data.otp?.trim()) {
                throw new Error('OTP is required');
            }
            const response = await apiService.post('/backend/auth/verify_otp.php', data);
            return response;
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to verify OTP'
            };
        }
    }

    async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
        try {
            this.validateEmail(data.email);
            if (!data.otp?.trim()) {
                throw new Error('OTP is required');
            }
            this.validatePassword(data.newPassword);
            const response = await apiService.post('/backend/auth/reset_password.php', data);
            return response;
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to reset password'
            };
        }
    }

    async logout(): Promise<AuthResponse> {
        try {
            apiService.clearAuthToken();
            return { success: true };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to logout'
            };
        }
    }

    async deleteAccount(): Promise<AuthResponse> {
        try {
            const response = await apiService.post('/backend/auth/delete_account.php', {});
            if (response.success && response.data) {
                apiService.clearAuthToken();
                return response.data as AuthResponse;
            }
            return {
                success: false,
                error: response.error?.message || 'Failed to delete account'
            };
        } catch (error: unknown) {
            return {
                success: false,
                error: getErrorMessage(error) || 'Failed to delete account'
            };
        }
    }

    setAuthToken(token: string): void {
        apiService.setAuthToken(token);
    }

    clearAuthToken(): void {
        apiService.clearAuthToken();
    }
}

export const authService = new AuthService(); 