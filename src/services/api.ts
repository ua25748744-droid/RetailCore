// API service for communicating with backend
import { auth } from '../firebaseConfig';

const API_BASE_URL = import.meta.env.PROD
    ? 'https://your-backend-url.com' // Update with your deployed backend URL
    : 'http://localhost:3001';

/**
 * Get the current user's ID token for API authorization
 */
const getAuthToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        return await user.getIdToken();
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

/**
 * Make an authenticated API request
 */
const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = await getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
};

// API methods
export const api = {
    /**
     * Get current user profile from backend
     */
    getProfile: () => apiRequest<{
        uid: string;
        email: string;
        name: string | null;
        picture: string | null;
        emailVerified: boolean;
    }>('/api/profile'),

    /**
     * Health check
     */
    health: () => apiRequest<{
        status: string;
        timestamp: string;
    }>('/api/health'),

    /**
     * Protected endpoint example
     */
    getProtectedData: () => apiRequest<{
        message: string;
        user: string;
        timestamp: string;
    }>('/api/protected'),
};

export default api;
