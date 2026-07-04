interface ApiConfig {
    BASE_URL: string;
    TIMEOUT: number;
    HEADERS: HeadersInit;
    RETRY_ATTEMPTS: number;
    RETRY_DELAY: number;
    CACHE_DURATION: number;
}

// Get the current hostname and port
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Point to Apache server (XAMPP) for backend
            return 'http://localhost/shopnest/';
        }
    }
    return 'https://shopnest.example.com';
};

export const API_CONFIG: ApiConfig = {
    BASE_URL: getBaseUrl(),
    TIMEOUT: 30000,
    HEADERS: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

console.log('API_CONFIG.BASE_URL at runtime:', API_CONFIG.BASE_URL); 