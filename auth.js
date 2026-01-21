// auth.js - Enhanced Authentication Service
// ============================================

const API_BASE = 'http://localhost:5000/api';
const APP_NAME = 'FinFlow';

class AuthService {
    constructor() {
        this.tokenKey = 'finflow_token';
        this.userKey = 'finflow_user';
        this.rememberKey = 'finflow_remember';
        this.sessionsKey = 'finflow_sessions';
        this.userCache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        this.tokenRefreshInterval = null;
        this.loginAttempts = new Map();
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        
        this.startTokenWatcher();
        this.setupInterceptors();
    }

    /* =====================
       TOKEN MANAGEMENT
    ===================== */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
        this.emitAuthChange();
    }

    clearToken() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.userCache.clear();
        this.emitAuthChange();
    }

    getUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;
        
        // Check token expiry
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    /* =====================
       AUTHENTICATION
    ===================== */
    async login(email, password, rememberMe = false) {
        // Check rate limiting
        if (this.isRateLimited(email)) {
            throw new Error('Too many failed attempts. Please try again later.');
        }
        
        try {
            const data = await this.safeFetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe })
            });
            
            this.setToken(data.token);
            localStorage.setItem(this.userKey, JSON.stringify(data.user));
            localStorage.setItem(this.rememberKey, rememberMe.toString());
            
            // Reset attempts on success
            this.resetLoginAttempts(email);
            
            return data.user;
        } catch (error) {
            // Increment attempts on failure
            this.incrementLoginAttempts(email);
            throw error;
        }
    }

    async register(name, email, password) {
        // Validate password strength
        if (!this.validatePasswordStrength(password)) {
            throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
        }
        
        try {
            const data = await this.safeFetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            
            this.setToken(data.token);
            localStorage.setItem(this.userKey, JSON.stringify(data.user));
            
            return data.user;
        } catch (error) {
            throw error;
        }
    }

    /* =====================
       TOKEN VALIDATION & REFRESH
    ===================== */
    async validateToken() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const res = await fetch(`${API_BASE}/auth/validate`, {
                headers: this.authHeader()
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    async refreshToken() {
        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: this.authHeader()
            });
            
            if (res.ok) {
                const data = await res.json();
                this.setToken(data.token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        return false;
    }

    /* =====================
       PASSWORD MANAGEMENT
    ===================== */
    async requestPasswordReset(email) {
        return await this.safeFetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
    }

    async resetPassword(token, newPassword) {
        if (!this.validatePasswordStrength(newPassword)) {
            throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
        }
        
        return await this.safeFetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
    }

    async changePassword(currentPassword, newPassword) {
        if (!this.validatePasswordStrength(newPassword)) {
            throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
        }
        
        return await this.safeFetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.authHeader()
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return password.length >= minLength && 
               hasUpperCase && 
               hasLowerCase && 
               hasNumbers && 
               hasSpecialChar;
    }

    /* =====================
       PROFILE MANAGEMENT
    ===================== */
    async updateProfile(userData) {
        try {
            const data = await this.safeFetch(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.authHeader()
                },
                body: JSON.stringify(userData)
            });
            
            localStorage.setItem(this.userKey, JSON.stringify(data.user));
            this.userCache.set('user', {
                data: data.user,
                timestamp: Date.now()
            });
            
            return data.user;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    async getUserData(refresh = false) {
        const cached = this.userCache.get('user');
        const now = Date.now();
        
        if (!refresh && cached && (now - cached.timestamp < this.cacheDuration)) {
            return cached.data;
        }
        
        const data = await this.safeFetch(`${API_BASE}/auth/me`, {
            headers: this.authHeader()
        });
        
        this.userCache.set('user', {
            data,
            timestamp: now
        });
        
        localStorage.setItem(this.userKey, JSON.stringify(data));
        return data;
    }

    /* =====================
       SESSION MANAGEMENT
    ===================== */
    async getActiveSessions() {
        const sessions = await this.safeFetch(`${API_BASE}/auth/sessions`, {
            headers: this.authHeader()
        });
        
        localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
        return sessions;
    }

    async revokeSession(sessionId) {
        return await this.safeFetch(`${API_BASE}/auth/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: this.authHeader()
        });
    }

    async revokeAllSessions() {
        return await this.safeFetch(`${API_BASE}/auth/sessions/revoke-all`, {
            method: 'POST',
            headers: this.authHeader()
        });
    }

    /* =====================
       EMAIL VERIFICATION
    ===================== */
    async verifyEmail(token) {
        return await this.safeFetch(`${API_BASE}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
    }

    async resendVerificationEmail() {
        return await this.safeFetch(`${API_BASE}/auth/resend-verification`, {
            method: 'POST',
            headers: this.authHeader()
        });
    }

    /* =====================
       RATE LIMITING
    ===================== */
    isRateLimited(email) {
        const attempts = this.loginAttempts.get(email) || { count: 0, timestamp: 0 };
        const now = Date.now();
        
        if (now - attempts.timestamp > this.lockoutDuration) {
            this.loginAttempts.delete(email);
            return false;
        }
        
        return attempts.count >= this.maxLoginAttempts;
    }

    incrementLoginAttempts(email) {
        const attempts = this.loginAttempts.get(email) || { count: 0, timestamp: 0 };
        attempts.count++;
        attempts.timestamp = Date.now();
        this.loginAttempts.set(email, attempts);
    }

    resetLoginAttempts(email) {
        this.loginAttempts.delete(email);
    }

    /* =====================
       UTILITIES
    ===================== */
    authHeader() {
        const token = this.getToken();
        return token ? { 
            'Authorization': `Bearer ${token}`,
            'X-Client-Version': '1.0.0'
        } : {};
    }

    async safeFetch(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...options.headers,
                    ...this.authHeader()
                },
                credentials: 'include'
            });
            
            return await this.handleApiResponse(response);
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw error;
        }
    }

    async handleApiResponse(res) {
        if (!res.ok) {
            let errorMessage = `Request failed with status ${res.status}`;
            let errorData = null;
            
            try {
                errorData = await res.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
                
                // Handle specific status codes
                switch (res.status) {
                    case 401:
                        this.clearToken();
                        if (window.location.pathname !== '/login.html') {
                            window.location.href = 'login.html';
                        }
                        errorMessage = 'Session expired. Please login again.';
                        break;
                    case 403:
                        errorMessage = 'Access denied. You do not have permission to perform this action.';
                        break;
                    case 429:
                        errorMessage = 'Too many requests. Please try again later.';
                        break;
                    case 422:
                        if (errorData.errors) {
                            errorMessage = Object.values(errorData.errors).flat().join(', ');
                        }
                        break;
                }
            } catch {
                // Response is not JSON
            }
            
            const error = new Error(errorMessage);
            error.status = res.status;
            error.data = errorData;
            throw error;
        }
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await res.json();
        }
        
        return await res.text();
    }

    startTokenWatcher() {
        // Check token every 5 minutes
        this.tokenRefreshInterval = setInterval(async () => {
            if (this.isLoggedIn() && !await this.validateToken()) {
                console.log('Token expired, attempting refresh...');
                if (!await this.refreshToken()) {
                    this.clearToken();
                    if (window.location.pathname !== '/login.html') {
                        window.location.href = 'login.html';
                    }
                }
            }
        }, 5 * 60 * 1000);
    }

    setupInterceptors() {
        // Store original fetch
        const originalFetch = window.fetch;
        
        // Override fetch to add auth header and handle errors
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            
            // Skip for auth endpoints
            if (typeof url === 'string' && url.includes('/auth/')) {
                return originalFetch(...args);
            }
            
            // Add auth header
            const authHeaders = this.authHeader();
            const headers = {
                ...options.headers,
                ...authHeaders
            };
            
            try {
                return await originalFetch(url, { ...options, headers });
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };
    }

    emitAuthChange() {
        // Dispatch event for other components to react to auth changes
        const event = new CustomEvent('authChange', {
            detail: { isLoggedIn: this.isLoggedIn(), user: this.getUser() }
        });
        window.dispatchEvent(event);
    }

    /* =====================
       LOGOUT
    ===================== */
    async logout() {
        const rememberMe = localStorage.getItem(this.rememberKey) === 'true';
        
        // Call backend logout endpoint
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: this.authHeader()
            });
        } catch (error) {
            console.error('Logout API call failed:', error);
        }
        
        this.clearToken();
        clearInterval(this.tokenRefreshInterval);
        
        if (!rememberMe) {
            localStorage.removeItem(this.rememberKey);
        }
        
        // Clear any service worker cache if using PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.unregister();
            });
        }
        
        window.location.href = 'login.html';
    }

    /* =====================
       ACCOUNT MANAGEMENT
    ===================== */
    async deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return false;
        }
        
        try {
            await this.safeFetch(`${API_BASE}/auth/account`, {
                method: 'DELETE',
                headers: this.authHeader()
            });
            
            this.clearToken();
            window.location.href = 'login.html';
            return true;
        } catch (error) {
            throw error;
        }
    }

    /* =====================
       DESTRUCTOR
    ===================== */
    destroy() {
        clearInterval(this.tokenRefreshInterval);
        this.loginAttempts.clear();
    }

    /* =====================
       STATIC METHODS
    ===================== */
    static getAuthHeaders() {
        return window.auth ? window.auth.authHeader() : {};
    }

    static async refreshIfNeeded() {
        if (window.auth && window.auth.isLoggedIn()) {
            return await window.auth.refreshToken();
        }
        return false;
    }
}

// Make globally available with error handling
try {
    window.auth = new AuthService();
} catch (error) {
    console.error('Failed to initialize AuthService:', error);
    window.auth = {
        isLoggedIn: () => false,
        login: () => Promise.reject(new Error('Auth service not available')),
        logout: () => { window.location.href = 'login.html'; }
    };
}

// Add cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.auth) {
        window.auth.destroy();
    }
});

// Export for module usage if supported
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;

}
window.auth = new AuthService();
