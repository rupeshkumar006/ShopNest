import { API_CONFIG } from './apiConfig';

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    redirect?: string;
    message?: string;
}

class ApiService {
    private baseUrl: string;
    private headers: HeadersInit;

    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.headers = API_CONFIG.HEADERS;
        console.log('ApiService constructed with baseUrl:', this.baseUrl);
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        try {
            const data = await response.json().catch(() => ({}));

            // Log the response for debugging
            console.log('API Response:', {
                status: response.status,
                ok: response.ok,
                data
            });

            // Additional debugging for registration endpoint
            if (response.url && response.url.includes('register.php')) {
                console.log('=== REGISTRATION ENDPOINT DEBUG ===');
                console.log('Raw response data:', data);
                console.log('Response keys:', Object.keys(data));
                console.log('Response values:', Object.values(data));
                console.log('Response type:', typeof data);
                console.log('Is data an object?', typeof data === 'object');
                console.log('Data null check:', data === null);
                console.log('Data undefined check:', data === undefined);
            }

            if (!response.ok) {
                // Try to extract a clear error message from PHP backend
                let message = 'Something went wrong';
                if (typeof data === 'object' && data !== null) {
                    if (typeof data.message === 'string') {
                        message = data.message;
                    } else if (typeof data.error === 'string') {
                        message = data.error;
                    } else if (typeof data.error === 'object' && typeof data.error.message === 'string') {
                        message = data.error.message;
                    }
                }
                return {
                    success: false,
                    error: {
                        message,
                        status: response.status,
                        code: data.code || String(response.status)
                    }
                };
            }
            // Create response object with all original fields preserved
            const responseObj: any = {
                success: true,
                data: data.data || data // Handle both {data: {...}} and direct response formats
            };

            // Explicitly preserve all other fields from the backend response
            Object.keys(data).forEach(key => {
                if (key !== 'data') {
                    responseObj[key] = data[key];
                }
            });

            return responseObj;
        } catch (error: unknown) {
            console.error('API Error:', error);
            return {
                success: false,
                error: {
                    message: getErrorMessage(error) || 'Failed to parse response',
                    status: response.status
                }
            };
        }
    }

    private validateEndpoint(endpoint: string): void {
        if (!endpoint?.trim()) {
            throw new Error('Endpoint is required');
        }
        if (!endpoint.startsWith('/')) {
            throw new Error('Endpoint must start with /');
        }
    }

    private validateParams(params?: Record<string, string>): void {
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (!key?.trim() || !value?.trim()) {
                    throw new Error('Invalid parameter: key and value must not be empty');
                }
            });
        }
    }

    private validateData(data: unknown): void {
        if (data === undefined || data === null) {
            throw new Error('Data is required');
        }
    }

    getAuthHeaders(endpoint?: string) {
        let token = '';
        if (endpoint && endpoint.includes('/admin/')) {
            token = localStorage.getItem('admin_token') || '';
        } else {
            token = localStorage.getItem('user_token') || '';
        }
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    private constructUrl(endpoint: string): URL {
        // Remove leading slash from endpoint to avoid double slash when baseUrl ends with /
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/';

        // If baseUrl is just '/', creating a URL with it might be tricky if not careful
        // but new URL('backend/...', base) works if base is valid.

        // Better approach: handle relative baseUrl specifically
        if (this.baseUrl.startsWith('/')) {
            // It's a relative path, use window.location.origin
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
            // Ensure single slash between origin and rest
            // logic: origin + baseUrl + endpoint
            // origin has no trailing slash usually.
            // baseUrl is '/'
            // endpoint is '/backend/...' -> 'backend/...'

            // If baseUrl is '/', combined is '/backend/...'
            const fullPath = (this.baseUrl === '/' ? '' : this.baseUrl) + '/' + cleanEndpoint;
            return new URL(fullPath, origin);
        }

        // Absolute baseUrl
        return new URL(cleanEndpoint, cleanBaseUrl);
    }

    private getGuestId(): string {
        const STORAGE_KEY = 'guest_id';
        let guestId = localStorage.getItem(STORAGE_KEY);
        if (!guestId) {
            guestId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem(STORAGE_KEY, guestId);
        }
        return guestId;
    }

    private getHeaders(endpoint?: string): HeadersInit {
        const headers: any = { ...this.headers };
        const authHeaders = this.getAuthHeaders(endpoint) as any;

        // Add auth headers
        if (authHeaders.Authorization) {
            headers.Authorization = authHeaders.Authorization;
        }

        // Add guest header
        headers['Guest-ID'] = this.getGuestId();

        return headers;
    }

    async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
        const url = this.constructUrl(endpoint);
        url.searchParams.append('t', new Date().getTime().toString()); // Cache-busting

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders(endpoint),
        });
        return this.handleResponse<T>(response);
    }

    async post<T = unknown>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
        const isFormData = data instanceof FormData;
        try {
            this.validateEndpoint(endpoint);
            this.validateData(data);

            const url = this.constructUrl(endpoint);
            const headers: any = this.getHeaders(endpoint);

            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }

            // Debug log for URL construction
            console.log('FETCH URL:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers,
                body: isFormData ? data : JSON.stringify(data),
            });

            return this.handleResponse<T>(response);
        } catch (error: unknown) {
            return {
                success: false,
                error: {
                    message: getErrorMessage(error) || 'Failed to make POST request'
                }
            } as ApiResponse<T>;
        }
    }

    async put<T = unknown>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
        try {
            this.validateEndpoint(endpoint);
            this.validateData(data);

            const url = this.constructUrl(endpoint);
            const headers: any = this.getHeaders(endpoint);
            headers['Content-Type'] = 'application/json';

            const response = await fetch(url.toString(), {
                method: 'PUT',
                headers,
                body: JSON.stringify(data)
            });

            return this.handleResponse<T>(response);
        } catch (error: unknown) {
            return {
                success: false,
                error: {
                    message: getErrorMessage(error) || 'Failed to make PUT request'
                }
            };
        }
    }

    async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            this.validateEndpoint(endpoint);

            const url = this.constructUrl(endpoint);
            const response = await fetch(url.toString(), {
                method: 'DELETE',
                headers: this.getHeaders(endpoint)
            });

            return this.handleResponse<T>(response);
        } catch (error: unknown) {
            return {
                success: false,
                error: {
                    message: getErrorMessage(error) || 'Failed to make DELETE request'
                }
            };
        }
    }

    async patch<T = unknown>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
        try {
            this.validateEndpoint(endpoint);
            this.validateData(data);

            const url = this.constructUrl(endpoint);
            const headers: any = this.getHeaders(endpoint);
            headers['Content-Type'] = 'application/json';

            const response = await fetch(url.toString(), {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data)
            });

            return this.handleResponse<T>(response);
        } catch (error: unknown) {
            return {
                success: false,
                error: {
                    message: getErrorMessage(error) || 'Failed to make PATCH request'
                }
            };
        }
    }
}

export const apiService = new ApiService();

function getErrorMessage(err: unknown): string {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') return (err as { message: string }).message;
    return 'An error occurred';
} 