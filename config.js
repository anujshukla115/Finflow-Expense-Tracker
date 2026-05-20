// ================= FRONTEND CONFIGURATION =================

const CONFIG = {
    // API Configuration
    API_URL: 'https://finflow-expense-tracker-backend.vercel.app/api',
    
    // Environment detection
    ENVIRONMENT: window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1'
                 ? 'development' 
                 : 'production',
    
    // App Settings
    APP_NAME: 'FinFlow',
    VERSION: '1.0.0',
    
    // Default categories (fallback if API fails)
    DEFAULT_CATEGORIES: [
        { name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
        { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
        { name: 'Shopping', icon: '🛍️', color: '#FFD166' },
        { name: 'Entertainment', icon: '🎬', color: '#06D6A0' },
        { name: 'Bills & Utilities', icon: '💡', color: '#118AB2' },
        { name: 'Healthcare', icon: '🏥', color: '#EF476F' },
        { name: 'Education', icon: '📚', color: '#073B4C' },
        { name: 'Income', icon: '💰', color: '#2A9D8F' },
        { name: 'Others', icon: '📝', color: '#6C757D' }
    ],
    
    // Currency configuration
    CURRENCY_SYMBOLS: {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£'
    },
    
    CURRENCY_NAMES: {
        'INR': 'Indian Rupee',
        'USD': 'US Dollar',
        'EUR': 'Euro',
        'GBP': 'British Pound'
    },
    
    // Chart colors
    CHART_COLORS: {
        income: '#2A9D8F',
        expense: '#E76F51',
        savings: '#264653',
        primary: '#4361EE',
        secondary: '#3A0CA3',
        success: '#4CC9F0',
        warning: '#F72585',
        danger: '#7209B7'
    },
    
    // Date format
    DATE_FORMAT: 'YYYY-MM-DD',
    
    // Storage keys
    STORAGE_KEYS: {
        TOKEN: 'token',
        USER: 'user',
        THEME: 'theme',
        CURRENCY: 'currency'
    },
    
    // Feature flags
    FEATURES: {
        OFFLINE_MODE: false,
        NOTIFICATIONS: true,
        EXPORT_DATA: true
    }
};

// Utility functions
CONFIG.getCurrencySymbol = function(currency = 'INR') {
    return this.CURRENCY_SYMBOLS[currency] || '₹';
};

CONFIG.isDevelopment = function() {
    return this.ENVIRONMENT === 'development';
};

CONFIG.isProduction = function() {
    return this.ENVIRONMENT === 'production';
};

// Initialize on load
(function initConfig() {
    console.log(`${CONFIG.APP_NAME} v${CONFIG.VERSION}`);
    console.log(`Environment: ${CONFIG.ENVIRONMENT}`);
    console.log(`API URL: ${CONFIG.API_URL}`);
    
    // Override API URL for local development
    if (CONFIG.isDevelopment()) {
        CONFIG.API_URL = 'http://localhost:5000/api';
        console.log('Using local API URL:', CONFIG.API_URL);
    }
})();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
