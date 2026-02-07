// config.js - Configuration for FinFlow
const CONFIG = {
  // Backend API URL
  API_URL: 'https://finflow-expense-tracker-backend-production.up.railway.app/api',
  
  // App Settings
  APP_NAME: 'FinFlow',
  APP_VERSION: '1.0.0',
  
  // Default Settings
  DEFAULT_CURRENCY: 'INR',
  DEFAULT_THEME: 'light',
  
  // Feature Flags
  FEATURES: {
    EXPENSE_TRACKING: true,
    BILL_REMINDERS: true,
    SPLIT_EXPENSES: true,
    RECURRING_EXPENSES: true,
    ANALYTICS: true
  },
  
  // API Timeout (in milliseconds)
  API_TIMEOUT: 10000,
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Environment
  ENVIRONMENT: window.location.hostname === 'localhost' ? 'development' : 'production'
};

// Make config globally available
window.CONFIG = CONFIG;

console.log(`${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} loaded in ${CONFIG.ENVIRONMENT} mode`);
console.log(`API URL: ${CONFIG.API_URL}`);
