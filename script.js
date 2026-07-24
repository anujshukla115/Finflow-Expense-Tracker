/**
 * ===================================================================
 * FINFLOW - COMPLETE JAVASCRIPT APPLICATION
 * Version: 1.0.0
 * Description: Complete JavaScript for FinFlow Expense Tracker
 * ===================================================================
 */

// ===================================================================
// 1. CONFIGURATION & CONSTANTS
// ===================================================================

/**
 * API Configuration
 * Production and development API URLs
 */
const CONFIG = {
    API_URL: 'https://finflow-expense-tracker-backend.vercel.app/api',
    APP_NAME: 'FinFlow',
    VERSION: '1.0.0',
    
    // Currency symbols
    CURRENCY_SYMBOLS: {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'CNY': '¥',
        'SGD': 'S$'
    },
    
    // Default categories
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
    
    // Recurring frequencies
    FREQUENCIES: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    
    // Date format options
    DATE_FORMAT: 'YYYY-MM-DD',
    DISPLAY_DATE_FORMAT: 'MMM DD, YYYY',
    
    // Storage keys
    STORAGE_KEYS: {
        TOKEN: 'token',
        USER: 'user',
        THEME: 'theme',
        CURRENCY: 'currency'
    }
};

// ===================================================================
// 2. STATE MANAGEMENT
// ===================================================================

/**
 * Application State
 * Central state management for the entire application
 */
const AppState = {
    // User data
    user: null,
    userId: null,
    authToken: localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || null,
    
    // Financial data
    expenses: [],
    categories: [],
    recurringExpenses: [],
    billReminders: [],
    splitExpenses: [],
    
    // Settings
    currency: 'INR',
    monthlyIncome: 0,
    theme: localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light',
    
    // UI State
    isLoading: false,
    currentSection: 'dashboard',
    editingExpenseId: null,
    editingCategoryId: null,
    editingSplitExpenseId: null,
    editingRecurringId: null,
    editingBillId: null,
    
    // Chart instances
    charts: {
        trendChart: null,
        incomeExpenseChart: null,
        monthlyTrendChart: null,
        categoryChart: null,
        detailedCategoryChart: null
    },
    
    // Listeners
    listeners: {},
    
    /**
     * Initialize state
     */
    init() {
        this.theme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
        this.currency = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENCY) || 'INR';
        
        // Load user from localStorage
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        if (userData) {
            try {
                this.user = JSON.parse(userData);
                this.userId = this.user?.id || this.user?._id || null;
                this.currency = this.user?.currency || this.currency;
                this.monthlyIncome = this.user?.monthlyIncome || 0;
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    },
    
    /**
     * Update state and notify listeners
     */
    setState(key, value) {
        this[key] = value;
        this.notify(key, value);
    },
    
    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    },
    
    /**
     * Notify subscribers
     */
    notify(key, value) {
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => callback(value));
        }
    },
    
    /**
     * Reset state (logout)
     */
    reset() {
        this.user = null;
        this.userId = null;
        this.authToken = null;
        this.expenses = [];
        this.categories = [];
        this.recurringExpenses = [];
        this.billReminders = [];
        this.splitExpenses = [];
        this.editingExpenseId = null;
        this.editingCategoryId = null;
        this.editingSplitExpenseId = null;
        
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }
};

// Initialize state
AppState.init();

// ===================================================================
// 3. API SERVICE
// ===================================================================

/**
 * API Service
 * Handles all API communication with the backend
 */
const ApiService = {
    /**
     * Get auth headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (AppState.authToken) {
            headers['Authorization'] = `Bearer ${AppState.authToken}`;
        }
        
        return headers;
    },
    
    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...(options.headers || {})
            },
            mode: 'cors'
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            // Handle unauthorized
            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error(data.message || 'Session expired. Please login again.');
            }
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * Handle unauthorized response
     */
    handleUnauthorized() {
        AppState.reset();
        showNotification('Session expired. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    },
    
    /**
     * Test backend connection
     */
    async testConnection() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/health`, {
                mode: 'cors',
                headers: { 'Accept': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.error('Backend connection failed:', error);
            return false;
        }
    }
};

// ===================================================================
// 4. AUTH SERVICE
// ===================================================================

/**
 * Authentication Service
 * Handles user authentication and session management
 */
const AuthService = {
    /**
     * Login user
     */
    async login(email, password) {
        try {
            const data = await ApiService.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            if (data.success) {
                AppState.authToken = data.token;
                AppState.user = data.user;
                AppState.userId = data.user.id || data.user._id;
                AppState.currency = data.user.currency || 'INR';
                AppState.monthlyIncome = data.user.monthlyIncome || 0;
                
                localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENCY, AppState.currency);
                
                return { success: true, user: data.user };
            }
            
            return { success: false, message: data.message || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Login failed' };
        }
    },
    
    /**
     * Register user
     */
    async register(name, email, password) {
        try {
            const data = await ApiService.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });
            
            if (data.success) {
                AppState.authToken = data.token;
                AppState.user = data.user;
                AppState.userId = data.user.id || data.user._id;
                AppState.currency = data.user.currency || 'INR';
                AppState.monthlyIncome = data.user.monthlyIncome || 0;
                
                localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENCY, AppState.currency);
                
                return { success: true, user: data.user };
            }
            
            return { success: false, message: data.message || 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: error.message || 'Registration failed' };
        }
    },
    
    /**
     * Logout user
     */
    async logout() {
        try {
            await ApiService.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            AppState.reset();
            window.location.href = 'login.html';
        }
    },
    
    /**
     * Get current user
     */
    async getCurrentUser() {
        try {
            const data = await ApiService.request('/auth/me');
            if (data.success) {
                AppState.user = data.user;
                AppState.userId = data.user.id || data.user._id;
                AppState.currency = data.user.currency || 'INR';
                AppState.monthlyIncome = data.user.monthlyIncome || 0;
                
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENCY, AppState.currency);
                
                return { success: true, user: data.user };
            }
            return { success: false, message: data.message || 'Failed to get user' };
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Update user profile
     */
    async updateProfile(data) {
        try {
            const response = await ApiService.request('/user/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                AppState.user = response.user;
                AppState.currency = response.user.currency || AppState.currency;
                AppState.monthlyIncome = response.user.monthlyIncome || 0;
                
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.user));
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENCY, AppState.currency);
                
                return { success: true, user: response.user };
            }
            
            return { success: false, message: response.message || 'Update failed' };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await ApiService.request('/user/password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            return { success: response.success, message: response.message };
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Delete account
     */
    async deleteAccount() {
        try {
            const response = await ApiService.request('/user/delete', {
                method: 'DELETE'
            });
            
            if (response.success) {
                AppState.reset();
                return { success: true, message: response.message };
            }
            
            return { success: false, message: response.message || 'Delete failed' };
        } catch (error) {
            console.error('Delete account error:', error);
            return { success: false, message: error.message };
        }
    }
};

// ===================================================================
// 5. EXPENSE SERVICE
// ===================================================================

/**
 * Expense Service
 * Handles all expense-related API operations
 */
const ExpenseService = {
    /**
     * Get all expenses
     */
    async getAll() {
        try {
            const data = await ApiService.request('/expenses');
            if (data.success) {
                AppState.expenses = data.expenses || [];
                return { success: true, expenses: data.expenses };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Get expenses error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Create expense
     */
    async create(expenseData) {
        try {
            const data = await ApiService.request('/expenses', {
                method: 'POST',
                body: JSON.stringify(expenseData)
            });
            
            if (data.success) {
                AppState.expenses.push(data.expense);
                return { success: true, expense: data.expense };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Create expense error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Update expense
     */
    async update(id, expenseData) {
        try {
            const data = await ApiService.request(`/expenses/${id}`, {
                method: 'PUT',
                body: JSON.stringify(expenseData)
            });
            
            if (data.success) {
                const index = AppState.expenses.findIndex(e => e._id === id);
                if (index !== -1) {
                    AppState.expenses[index] = data.expense;
                }
                return { success: true, expense: data.expense };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Update expense error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Delete expense
     */
    async delete(id) {
        try {
            const data = await ApiService.request(`/expenses/${id}`, {
                method: 'DELETE'
            });
            
            if (data.success) {
                AppState.expenses = AppState.expenses.filter(e => e._id !== id);
                return { success: true, message: data.message };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Delete expense error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Get expense stats
     */
    async getStats() {
        try {
            const data = await ApiService.request('/expenses/stats/summary');
            return { success: data.success, stats: data.stats };
        } catch (error) {
            console.error('Get stats error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Get expenses by month
     */
    getByMonth(month, year) {
        return AppState.expenses.filter(e => {
            const date = new Date(e.date);
            return date.getMonth() === month && date.getFullYear() === year;
        });
    },
    
    /**
     * Get expenses by category
     */
    getByCategory(category) {
        return AppState.expenses.filter(e => e.category === category);
    },
    
    /**
     * Get total by month
     */
    getTotalByMonth(month, year, type = null) {
        const filtered = this.getByMonth(month, year);
        if (type) {
            return filtered.filter(e => e.type === type).reduce((sum, e) => sum + e.amount, 0);
        }
        return filtered.reduce((sum, e) => sum + e.amount, 0);
    }
};

// ===================================================================
// 6. CATEGORY SERVICE
// ===================================================================

/**
 * Category Service
 * Handles category-related operations
 */
const CategoryService = {
    /**
     * Get all categories
     */
    async getAll() {
        try {
            const data = await ApiService.request('/categories');
            if (data.success) {
                AppState.categories = data.categories || [];
                return { success: true, categories: data.categories };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Get categories error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Create category
     */
    async create(categoryData) {
        try {
            const data = await ApiService.request('/categories', {
                method: 'POST',
                body: JSON.stringify(categoryData)
            });
            
            if (data.success) {
                AppState.categories.push(data.category);
                return { success: true, category: data.category };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Create category error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Update category
     */
    async update(id, categoryData) {
        try {
            const data = await ApiService.request(`/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify(categoryData)
            });
            
            if (data.success) {
                const index = AppState.categories.findIndex(c => c._id === id);
                if (index !== -1) {
                    AppState.categories[index] = data.category;
                }
                return { success: true, category: data.category };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Update category error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Delete category
     */
    async delete(id) {
        try {
            const data = await ApiService.request(`/categories/${id}`, {
                method: 'DELETE'
            });
            
            if (data.success) {
                AppState.categories = AppState.categories.filter(c => c._id !== id);
                return { success: true, message: data.message };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Delete category error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Get all categories (including defaults)
     */
    getAllCategories() {
        return [...CONFIG.DEFAULT_CATEGORIES, ...AppState.categories];
    },
    
    /**
     * Get category by name
     */
    getByName(name) {
        return this.getAllCategories().find(c => c.name === name);
    },
    
    /**
     * Get category color
     */
    getColor(name) {
        const category = this.getByName(name);
        return category?.color || '#6C757D';
    },
    
    /**
     * Get category icon
     */
    getIcon(name) {
        const category = this.getByName(name);
        return category?.icon || '📝';
    }
};

// ===================================================================
// 7. RECURRING SERVICE
// ===================================================================

/**
 * Recurring Expense Service
 */
const RecurringService = {
    /**
     * Get all recurring expenses
     */
    async getAll() {
        try {
            const data = await ApiService.request('/recurring');
            if (data.success) {
                AppState.recurringExpenses = data.recurringExpenses || [];
                return { success: true, recurringExpenses: data.recurringExpenses };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Get recurring error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Create recurring expense
     */
    async create(data) {
        try {
            const response = await ApiService.request('/recurring', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                AppState.recurringExpenses.push(response.recurringExpense);
                return { success: true, recurringExpense: response.recurringExpense };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Create recurring error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Update recurring expense
     */
    async update(id, data) {
        try {
            const response = await ApiService.request(`/recurring/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                const index = AppState.recurringExpenses.findIndex(r => r._id === id);
                if (index !== -1) {
                    AppState.recurringExpenses[index] = response.recurringExpense;
                }
                return { success: true, recurringExpense: response.recurringExpense };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Update recurring error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Delete recurring expense
     */
    async delete(id) {
        try {
            const response = await ApiService.request(`/recurring/${id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                AppState.recurringExpenses = AppState.recurringExpenses.filter(r => r._id !== id);
                return { success: true, message: response.message };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Delete recurring error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Toggle recurring expense
     */
    async toggle(id) {
        try {
            const response = await ApiService.request(`/recurring/${id}/toggle`, {
                method: 'PATCH'
            });
            
            if (response.success) {
                const index = AppState.recurringExpenses.findIndex(r => r._id === id);
                if (index !== -1) {
                    AppState.recurringExpenses[index] = response.recurringExpense;
                }
                return { success: true, recurringExpense: response.recurringExpense };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Toggle recurring error:', error);
            return { success: false, message: error.message };
        }
    }
};

// ===================================================================
// 8. BILL SERVICE
// ===================================================================

/**
 * Bill Reminder Service
 */
const BillService = {
    /**
     * Get all bills
     */
    async getAll() {
        try {
            const data = await ApiService.request('/bills');
            if (data.success) {
                AppState.billReminders = data.bills || [];
                return { success: true, bills: data.bills };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Get bills error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Create bill
     */
    async create(data) {
        try {
            const response = await ApiService.request('/bills', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                AppState.billReminders.push(response.bill);
                return { success: true, bill: response.bill };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Create bill error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Update bill
     */
    async update(id, data) {
        try {
            const response = await ApiService.request(`/bills/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                const index = AppState.billReminders.findIndex(b => b._id === id);
                if (index !== -1) {
                    AppState.billReminders[index] = response.bill;
                }
                return { success: true, bill: response.bill };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Update bill error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Delete bill
     */
    async delete(id) {
        try {
            const response = await ApiService.request(`/bills/${id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                AppState.billReminders = AppState.billReminders.filter(b => b._id !== id);
                return { success: true, message: response.message };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Delete bill error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Mark bill as paid
     */
    async markPaid(id) {
        try {
            const response = await ApiService.request(`/bills/${id}/pay`, {
                method: 'PATCH'
            });
            
            if (response.success) {
                const index = AppState.billReminders.findIndex(b => b._id === id);
                if (index !== -1) {
                    AppState.billReminders[index] = response.bill;
                }
                return { success: true, bill: response.bill };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Mark bill paid error:', error);
            return { success: false, message: error.message };
        }
    }
};

// ===================================================================
// 9. SPLIT EXPENSE SERVICE
// ===================================================================

/**
 * Split Expense Service
 */
const SplitService = {
    /**
     * Get all split expenses
     */
    async getAll() {
        try {
            const data = await ApiService.request('/split');
            if (data.success) {
                AppState.splitExpenses = data.splitExpenses || [];
                return { success: true, splitExpenses: data.splitExpenses };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error('Get split expenses error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Create split expense
     */
    async create(data) {
        try {
            const response = await ApiService.request('/split', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                AppState.splitExpenses.push(response.splitExpense);
                return { success: true, splitExpense: response.splitExpense };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Create split expense error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Update split expense
     */
    async update(id, data) {
        try {
            const response = await ApiService.request(`/split/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response.success) {
                const index = AppState.splitExpenses.findIndex(s => s._id === id);
                if (index !== -1) {
                    AppState.splitExpenses[index] = response.splitExpense;
                }
                return { success: true, splitExpense: response.splitExpense };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Update split expense error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Delete split expense
     */
    async delete(id) {
        try {
            const response = await ApiService.request(`/split/${id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                AppState.splitExpenses = AppState.splitExpenses.filter(s => s._id !== id);
                return { success: true, message: response.message };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Delete split expense error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Toggle member payment
     */
    async toggleMemberPayment(id, memberIndex) {
        try {
            const response = await ApiService.request(`/split/${id}/member/${memberIndex}/pay`, {
                method: 'PATCH'
            });
            
            if (response.success) {
                const index = AppState.splitExpenses.findIndex(s => s._id === id);
                if (index !== -1) {
                    AppState.splitExpenses[index] = response.splitExpense;
                }
                return { success: true, splitExpense: response.splitExpense };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Toggle member payment error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Settle split expense
     */
    async settle(id) {
        try {
            const response = await ApiService.request(`/split/${id}/settle`, {
                method: 'PATCH'
            });
            
            if (response.success) {
                const index = AppState.splitExpenses.findIndex(s => s._id === id);
                if (index !== -1) {
                    AppState.splitExpenses[index] = response.splitExpense;
                }
                return { success: true, splitExpense: response.splitExpense };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Settle split expense error:', error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Unsettle split expense
     */
    async unsettle(id) {
        try {
            const response = await ApiService.request(`/split/${id}/unsettle`, {
                method: 'PATCH'
            });
            
            if (response.success) {
                const index = AppState.splitExpenses.findIndex(s => s._id === id);
                if (index !== -1) {
                    AppState.splitExpenses[index] = response.splitExpense;
                }
                return { success: true, splitExpense: response.splitExpense };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Unsettle split expense error:', error);
            return { success: false, message: error.message };
        }
    }
};

// ===================================================================
// 10. UTILITY FUNCTIONS
// ===================================================================

/**
 * Format currency
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return '0.00';
    }
    return parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Get currency symbol
 */
function getCurrencySymbol(currency = null) {
    const cur = currency || AppState.currency;
    return CONFIG.CURRENCY_SYMBOLS[cur] || '₹';
}

/**
 * Format date
 */
function formatDate(dateString, format = CONFIG.DISPLAY_DATE_FORMAT) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        return 'N/A';
    }
}

/**
 * Format date for input
 */
function formatDateInput(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
}

/**
 * Get days until date
 */
function getDaysUntil(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get month name
 */
function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month] || '';
}

/**
 * Get month abbreviation
 */
function getMonthAbbr(month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month] || '';
}

/**
 * Get day name
 */
function getDayName(day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || '';
}

/**
 * Get day abbreviation
 */
function getDayAbbr(day) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day] || '';
}

/**
 * Generate random ID
 */
function generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * Debounce function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Group array by key
 */
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Sum array by key
 */
function sumBy(array, key) {
    return array.reduce((sum, item) => sum + (item[key] || 0), 0);
}

/**
 * Sort by date
 */
function sortByDate(array, key, ascending = true) {
    return [...array].sort((a, b) => {
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return ascending ? dateA - dateB : dateB - dateA;
    });
}

/**
 * Get last N months
 */
function getLastMonths(n = 6) {
    const months = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(date);
    }
    return months;
}

// ===================================================================
// 11. NOTIFICATION SYSTEM
// ===================================================================

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 4000) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Show with animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

/**
 * Show global message
 */
function showGlobalMessage(message, type = 'success') {
    const messageEl = document.getElementById('globalMessage');
    if (!messageEl) return;
    
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

/**
 * Show loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
    AppState.isLoading = show;
}

// ===================================================================
// 12. THEME MANAGEMENT
// ===================================================================

/**
 * Theme Manager
 */
const ThemeManager = {
    /**
     * Apply theme
     */
    apply(theme = null) {
        const t = theme || AppState.theme;
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, t);
        AppState.theme = t;
        
        // Update theme icon
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = t === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    },
    
    /**
     * Toggle theme
     */
    toggle() {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        this.apply(newTheme);
        showNotification(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`, 'info');
        return newTheme;
    },
    
    /**
     * Initialize theme
     */
    init() {
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        const theme = savedTheme || 'light';
        this.apply(theme);
    }
};

// ===================================================================
// 13. UI RENDERER
// ===================================================================

/**
 * UI Renderer
 * Handles all DOM rendering
 */
const UIRenderer = {
    /**
     * Update currency display
     */
    updateCurrency() {
        const symbol = getCurrencySymbol();
        document.querySelectorAll('.currency-symbol').forEach(el => {
            el.textContent = symbol;
        });
    },
    
    /**
     * Update date display
     */
    updateDateDisplay() {
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    },
    
    /**
     * Update user display
     */
    updateUserDisplay() {
        const user = AppState.user;
        if (!user) return;
        
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.innerHTML = `Welcome back, <span class="text-primary">${user.name}</span>`;
        }
        
        // Update profile form
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileIncome = document.getElementById('profileIncome');
        const profileCurrency = document.getElementById('profileCurrency');
        const currencySelector = document.getElementById('currencySelector');
        
        if (profileName) profileName.value = user.name || '';
        if (profileEmail) {
            profileEmail.innerHTML = `
                <span>${user.email || ''}</span>
                <small class="text-muted">(cannot be changed)</small>
            `;
        }
        if (profileIncome) profileIncome.value = user.monthlyIncome || '';
        if (profileCurrency) profileCurrency.value = user.currency || 'INR';
        if (currencySelector) currencySelector.value = user.currency || 'INR';
    },
    
    /**
     * Render dashboard
     */
    renderDashboard() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Get monthly data
        const monthlyExpenses = ExpenseService.getByMonth(currentMonth, currentYear)
            .filter(e => e.type === 'expense');
        const monthlyIncome = ExpenseService.getByMonth(currentMonth, currentYear)
            .filter(e => e.type === 'income');
        
        const totalExpenses = sumBy(monthlyExpenses, 'amount');
        const totalIncome = sumBy(monthlyIncome, 'amount') || AppState.monthlyIncome;
        const balance = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
        
        // Update stats
        const elements = {
            totalIncome: document.getElementById('totalIncome'),
            totalExpense: document.getElementById('totalExpense'),
            balance: document.getElementById('balance'),
            savingsRate: document.getElementById('savingsRate'),
            expenseTotal: document.getElementById('expenseTotal')
        };
        
        if (elements.totalIncome) {
            elements.totalIncome.textContent = formatCurrency(totalIncome);
        }
        if (elements.totalExpense) {
            elements.totalExpense.textContent = formatCurrency(totalExpenses);
        }
        if (elements.balance) {
            elements.balance.textContent = formatCurrency(balance);
        }
        if (elements.savingsRate) {
            elements.savingsRate.textContent = `${savingsRate.toFixed(1)}%`;
        }
        if (elements.expenseTotal) {
            elements.expenseTotal.innerHTML = `
                ${getCurrencySymbol()}${formatCurrency(totalExpenses)}
            `;
        }
        
        // Render recent expenses
        this.renderRecentExpenses();
        
        // Render category breakdown
        this.renderCategoryBreakdown();
        
        // Render upcoming bills
        this.renderUpcomingBills();
    },
    
    /**
     * Render recent expenses
     */
    renderRecentExpenses() {
        const container = document.getElementById('recentExpenseList');
        if (!container) return;
        
        const recent = sortByDate(AppState.expenses, 'date', false).slice(0, 5);
        
        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses yet</p>
                    <p class="text-muted">Add your first expense to get started</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recent.map(expense => {
            const icon = CategoryService.getIcon(expense.category);
            const isIncome = expense.type === 'income';
            return `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-icon">
                            <span>${icon}</span>
                        </div>
                        <div class="expense-details">
                            <h4>${expense.description}</h4>
                            <p class="expense-category">
                                <i class="fas fa-tag"></i> ${expense.category}
                            </p>
                        </div>
                    </div>
                    <div class="expense-amount ${isIncome ? 'income' : 'expense'}">
                        ${isIncome ? '+' : '-'}${getCurrencySymbol()}${formatCurrency(expense.amount)}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Render category breakdown
     */
    renderCategoryBreakdown() {
        const container = document.getElementById('categoryBreakdown');
        if (!container) return;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyExpenses = ExpenseService.getByMonth(currentMonth, currentYear)
            .filter(e => e.type === 'expense');
        
        if (monthlyExpenses.length === 0) {
            container.innerHTML = '<div class="empty-state">No expenses this month</div>';
            return;
        }
        
        const categoryTotals = groupBy(monthlyExpenses, 'category');
        const sorted = Object.entries(categoryTotals)
            .map(([category, items]) => ({
                category,
                total: sumBy(items, 'amount')
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        
        const totalAll = sumBy(sorted, 'total');
        
        container.innerHTML = sorted.map(({ category, total }) => {
            const percentage = (total / totalAll) * 100;
            const color = CategoryService.getColor(category);
            const icon = CategoryService.getIcon(category);
            
            return `
                <div class="category-breakdown-item">
                    <div class="category-breakdown-header">
                        <span class="category-icon">${icon}</span>
                        <span class="category-name">${category}</span>
                        <span class="category-amount">${getCurrencySymbol()}${formatCurrency(total)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background: ${color}"></div>
                    </div>
                    <div class="category-percentage">${percentage.toFixed(1)}%</div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Render upcoming bills
     */
    renderUpcomingBills() {
        const container = document.getElementById('upcomingBills');
        if (!container) return;
        
        const now = new Date();
        const upcoming = AppState.billReminders
            .filter(bill => !bill.isPaid && new Date(bill.dueDate) >= now)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3);
        
        if (upcoming.length === 0) {
            container.innerHTML = '<div class="empty-state">No upcoming bills</div>';
            return;
        }
        
        container.innerHTML = upcoming.map(bill => {
            const daysUntil = getDaysUntil(bill.dueDate);
            const isOverdue = daysUntil < 0;
            const isDueSoon = daysUntil <= (bill.reminderDays || 3) && daysUntil >= 0;
            
            return `
                <div class="bill-item ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}">
                    <div class="bill-info">
                        <div class="bill-name">${bill.billName}</div>
                        <div class="bill-date">${formatDate(bill.dueDate)}</div>
                    </div>
                    <div class="bill-amount">
                        ${getCurrencySymbol()}${formatCurrency(bill.amount)}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Render expense list
     */
    renderExpenses() {
        const container = document.getElementById('expenseList');
        if (!container) return;
        
        if (AppState.expenses.length === 0) {
            container.innerHTML = '<div class="empty-state">No expenses added yet</div>';
            return;
        }
        
        const sorted = sortByDate(AppState.expenses, 'date', false);
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(expense => {
                        const icon = CategoryService.getIcon(expense.category);
                        const isIncome = expense.type === 'income';
                        return `
                            <tr>
                                <td>${expense.description}</td>
                                <td><span class="badge">${icon} ${expense.category}</span></td>
                                <td>${formatDate(expense.date)}</td>
                                <td>
                                    <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">
                                        ${expense.type}
                                    </span>
                                </td>
                                <td class="${isIncome ? 'text-success' : 'text-danger'}">
                                    ${isIncome ? '+' : '-'}${getCurrencySymbol()}${formatCurrency(expense.amount)}
                                </td>
                                <td>
                                    <button class="btn-icon edit" onclick="handleEditExpense('${expense._id}')" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon delete" onclick="handleDeleteExpense('${expense._id}')" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },
    
    /**
     * Render recurring expenses
     */
    renderRecurring() {
        const container = document.getElementById('recurringGrid');
        if (!container) return;
        
        if (AppState.recurringExpenses.length === 0) {
            container.innerHTML = '<div class="empty-state">No recurring expenses added yet</div>';
            return;
        }
        
        container.innerHTML = AppState.recurringExpenses.map(expense => {
            const icon = CategoryService.getIcon(expense.category);
            const frequencyLabel = expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1);
            const isActive = expense.isActive !== false;
            
            // Calculate next due date
            const startDate = new Date(expense.startDate);
            const now = new Date();
            let nextDue = new Date(startDate);
            
            while (nextDue < now) {
                if (expense.frequency === 'daily') {
                    nextDue.setDate(nextDue.getDate() + 1);
                } else if (expense.frequency === 'weekly') {
                    nextDue.setDate(nextDue.getDate() + 7);
                } else if (expense.frequency === 'monthly') {
                    nextDue.setMonth(nextDue.getMonth() + 1);
                } else if (expense.frequency === 'quarterly') {
                    nextDue.setMonth(nextDue.getMonth() + 3);
                } else if (expense.frequency === 'yearly') {
                    nextDue.setFullYear(nextDue.getFullYear() + 1);
                }
            }
            
            const daysUntil = getDaysUntil(nextDue);
            
            return `
                <div class="recurring-card ${isActive ? 'active' : 'inactive'}">
                    <div class="recurring-header">
                        <h3>${expense.description}</h3>
                        <span class="recurring-badge ${expense.frequency}">${frequencyLabel}</span>
                    </div>
                    <div class="recurring-content">
                        <div class="recurring-amount">
                            <span class="amount-label">Amount:</span>
                            <span class="amount-value">${getCurrencySymbol()}${formatCurrency(expense.amount)}</span>
                        </div>
                        <div class="recurring-details">
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Next Due: ${formatDate(nextDue)}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-redo"></i>
                                <span>Frequency: ${expense.frequency}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-tag"></i>
                                <span>Category: ${icon} ${expense.category}</span>
                            </div>
                        </div>
                        <div class="due-status ${isActive ? '' : 'text-danger'}">
                            ${isActive ? `Due in ${daysUntil > 0 ? daysUntil : 0} days` : 'Deactivated'}
                        </div>
                    </div>
                    <div class="recurring-actions">
                        <button class="btn-icon ${isActive ? 'pause' : 'play'}" 
                                onclick="handleToggleRecurring('${expense._id}')" 
                                title="${isActive ? 'Deactivate' : 'Activate'}">
                            <i class="fas fa-${isActive ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn-icon delete" 
                                onclick="handleDeleteRecurring('${expense._id}')" 
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Render bills
     */
    renderBills() {
        const container = document.getElementById('remindersContainer');
        if (!container) return;
        
        if (AppState.billReminders.length === 0) {
            container.innerHTML = '<div class="empty-state">No bill reminders added yet</div>';
            return;
        }
        
        const sorted = sortByDate(AppState.billReminders, 'dueDate');
        
        container.innerHTML = sorted.map(bill => {
            const daysUntil = getDaysUntil(bill.dueDate);
            const isOverdue = daysUntil < 0 && !bill.isPaid;
            const isDueSoon = daysUntil <= (bill.reminderDays || 3) && daysUntil >= 0 && !bill.isPaid;
            
            let statusText = 'Pending';
            let statusClass = 'pending';
            if (bill.isPaid) {
                statusText = 'Paid';
                statusClass = 'paid';
            } else if (isOverdue) {
                statusText = 'Overdue';
                statusClass = 'overdue';
            } else if (isDueSoon) {
                statusText = 'Upcoming';
                statusClass = 'upcoming';
            }
            
            return `
                <div class="bill-reminder-card ${bill.isPaid ? 'paid' : isOverdue ? 'overdue' : isDueSoon ? 'upcoming' : ''}">
                    <div class="bill-header">
                        <div class="bill-title">
                            <h4>${bill.billName}</h4>
                            <span class="bill-status ${statusClass}">${statusText}</span>
                        </div>
                        <div class="bill-amount">
                            ${getCurrencySymbol()}${formatCurrency(bill.amount)}
                        </div>
                    </div>
                    <div class="bill-details">
                        <div class="detail-row">
                            <span class="label">Due:</span>
                            <span class="value">${formatDate(bill.dueDate)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Category:</span>
                            <span class="value">${CategoryService.getIcon(bill.category)} ${bill.category}</span>
                        </div>
                        ${!bill.isPaid ? `
                            <div class="detail-row">
                                <span class="label">Reminder:</span>
                                <span class="value ${isOverdue ? 'text-danger' : isDueSoon ? 'text-warning' : ''}">
                                    ${isOverdue ? 'OVERDUE!' : isDueSoon ? `Due in ${daysUntil} days` : `Due in ${daysUntil} days`}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="bill-actions">
                        ${!bill.isPaid ? `
                            <button class="btn-success btn-sm" onclick="handleMarkBillPaid('${bill._id}')">
                                <i class="fas fa-check"></i> Mark Paid
                            </button>
                        ` : ''}
                        <button class="btn-icon delete" onclick="handleDeleteBill('${bill._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Render calendar
        this.renderCalendar();
    },
    
    /**
     * Render calendar
     */
    renderCalendar() {
        const container = document.getElementById('billCalendar');
        if (!container) return;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayIndex = firstDay.getDay();
        
        // Update title
        const title = document.querySelector('.calendar-section h3');
        if (title) {
            title.textContent = `Bill Calendar - ${getMonthName(currentMonth)} ${currentYear}`;
        }
        
        let html = '';
        
        // Day headers
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });
        
        // Empty cells
        for (let i = 0; i < firstDayIndex; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
            
            const billsOnDay = AppState.billReminders.filter(bill => {
                const billDate = new Date(bill.dueDate);
                return !bill.isPaid && 
                       billDate.getDate() === day && 
                       billDate.getMonth() === currentMonth && 
                       billDate.getFullYear() === currentYear;
            });
            
            const hasBill = billsOnDay.length > 0;
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (hasBill) dayClass += ' has-bill';
            
            html += `
                <div class="${dayClass}" data-date="${dateStr}" ${hasBill ? `data-bills='${JSON.stringify(billsOnDay)}'` : ''}>
                    ${day}
                    ${hasBill ? `<span class="bill-count">${billsOnDay.length}</span>` : ''}
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Add click handlers
        container.querySelectorAll('.calendar-day.has-bill').forEach(el => {
            el.addEventListener('click', function() {
                const bills = JSON.parse(this.dataset.bills || '[]');
                if (bills.length > 0) {
                    const billList = bills.map(bill => 
                        `• ${bill.billName}: ${getCurrencySymbol()}${formatCurrency(bill.amount)}`
                    ).join('\n');
                    showNotification(`Bills due on ${this.dataset.date}:\n${billList}`, 'info', 5000);
                }
            });
        });
    },
    
    /**
     * Render split expenses
     */
    renderSplitExpenses() {
        const container = document.getElementById('splitContainer');
        if (!container) return;
        
        if (AppState.splitExpenses.length === 0) {
            container.innerHTML = '<div class="empty-state">No split expenses added yet</div>';
            return;
        }
        
        container.innerHTML = AppState.splitExpenses.map(expense => {
            const paidCount = expense.members.filter(m => m.isPaid).length;
            const totalCount = expense.members.length;
            const isSettled = paidCount === totalCount;
            
            return `
                <div class="split-card">
                    <div class="split-header">
                        <div>
                            <h3>${expense.title}</h3>
                            <p class="split-subtitle">
                                Split among ${totalCount} people • Total: ${getCurrencySymbol()}${formatCurrency(expense.totalAmount)}
                            </p>
                        </div>
                        <span class="split-status ${isSettled ? 'settled' : 'pending'}">
                            ${isSettled ? '✅ Settled' : '⏳ Pending'}
                        </span>
                    </div>
                    
                    <div class="split-details">
                        <div class="split-members-list">
                            ${expense.members.map((member, index) => `
                                <div class="split-member-detail">
                                    <div class="member-info">
                                        <span class="member-name">${member.name}</span>
                                        <span class="member-status ${member.isPaid ? 'paid' : 'unpaid'}">
                                            ${member.isPaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </div>
                                    <div class="member-actions">
                                        <span class="member-amount">${getCurrencySymbol()}${formatCurrency(member.amount)}</span>
                                        <button class="${member.isPaid ? 'btn-mark-unpaid' : 'btn-mark-paid'}" 
                                                onclick="handleToggleSplitMember('${expense._id}', ${index})">
                                            <i class="fas fa-${member.isPaid ? 'times' : 'check'}"></i>
                                            ${member.isPaid ? 'Unpaid' : 'Paid'}
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="split-actions">
                        <button class="btn-secondary" onclick="handleEditSplitExpense('${expense._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${isSettled ? `
                            <button class="btn-unsettle" onclick="handleUnsettleSplit('${expense._id}')">
                                <i class="fas fa-undo"></i> Unsettle
                            </button>
                        ` : `
                            <button class="btn-success" onclick="handleSettleSplit('${expense._id}')">
                                <i class="fas fa-check"></i> Settle Up
                            </button>
                        `}
                        <button class="btn-danger" onclick="handleDeleteSplit('${expense._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
};

// ===================================================================
// 14. EVENT HANDLERS
// ===================================================================

/**
 * Handle expense form submission
 */
async function handleAddExpense() {
    const description = document.getElementById('title')?.value?.trim();
    const amount = parseFloat(document.getElementById('amount')?.value);
    const category = document.getElementById('category')?.value;
    const date = document.getElementById('expenseDate')?.value;
    
    if (!description || !amount || !category || !date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const expenseData = {
            description,
            amount,
            category,
            date,
            type: 'expense',
            paymentMethod: 'cash'
        };
        
        let result;
        if (AppState.editingExpenseId) {
            result = await ExpenseService.update(AppState.editingExpenseId, expenseData);
            if (result.success) {
                showNotification('Expense updated successfully', 'success');
                AppState.editingExpenseId = null;
                document.querySelector('.btn-add').innerHTML = '<i class="fas fa-plus-circle"></i> Add Expense';
            }
        } else {
            result = await ExpenseService.create(expenseData);
            if (result.success) {
                showNotification('Expense added successfully', 'success');
            }
        }
        
        if (result.success) {
            // Reset form
            document.getElementById('title').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('category').value = '';
            document.getElementById('expenseDate').valueAsDate = new Date();
            
            await refreshAllData();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to save expense', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle edit expense
 */
async function handleEditExpense(id) {
    const expense = AppState.expenses.find(e => e._id === id);
    if (!expense) {
        showNotification('Expense not found', 'error');
        return;
    }
    
    document.getElementById('title').value = expense.description;
    document.getElementById('amount').value = expense.amount;
    document.getElementById('category').value = expense.category;
    document.getElementById('expenseDate').value = formatDateInput(expense.date);
    
    document.querySelector('.btn-add').innerHTML = '<i class="fas fa-save"></i> Update Expense';
    AppState.editingExpenseId = id;
    
    showSection('expenses');
    document.querySelector('.add-expense-card').scrollIntoView({ behavior: 'smooth' });
    showNotification('Edit expense details and click Update', 'info');
}

/**
 * Handle delete expense
 */
async function handleDeleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    showLoading(true);
    try {
        const result = await ExpenseService.delete(id);
        if (result.success) {
            showNotification('Expense deleted successfully', 'success');
            await refreshAllData();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to delete expense', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle toggle recurring expense
 */
async function handleToggleRecurring(id) {
    showLoading(true);
    try {
        const result = await RecurringService.toggle(id);
        if (result.success) {
            showNotification('Recurring expense toggled', 'success');
            UIRenderer.renderRecurring();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to toggle recurring expense', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle delete recurring expense
 */
async function handleDeleteRecurring(id) {
    if (!confirm('Are you sure you want to delete this recurring expense?')) return;
    
    showLoading(true);
    try {
        const result = await RecurringService.delete(id);
        if (result.success) {
            showNotification('Recurring expense deleted', 'success');
            UIRenderer.renderRecurring();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to delete recurring expense', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle add recurring expense
 */
async function handleAddRecurring() {
    const description = document.getElementById('recurringTitle')?.value?.trim();
    const amount = parseFloat(document.getElementById('recurringAmount')?.value);
    const category = document.getElementById('recurringCategory')?.value;
    const frequency = document.getElementById('recurringFrequency')?.value;
    const startDate = document.getElementById('recurringStartDate')?.value;
    
    if (!description || !amount || !category || !frequency || !startDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const result = await RecurringService.create({
            description,
            amount,
            category,
            frequency,
            startDate
        });
        
        if (result.success) {
            showNotification('Recurring expense added', 'success');
            document.getElementById('recurringTitle').value = '';
            document.getElementById('recurringAmount').value = '';
            document.getElementById('recurringCategory').value = '';
            document.getElementById('recurringFrequency').value = '';
            document.getElementById('recurringStartDate').value = '';
            
            closeModal('addRecurringModal');
            UIRenderer.renderRecurring();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to add recurring expense', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle mark bill as paid
 */
async function handleMarkBillPaid(id) {
    showLoading(true);
    try {
        const result = await BillService.markPaid(id);
        if (result.success) {
            showNotification('Bill marked as paid', 'success');
            UIRenderer.renderBills();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to mark bill as paid', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle delete bill
 */
async function handleDeleteBill(id) {
    if (!confirm('Are you sure you want to delete this bill reminder?')) return;
    
    showLoading(true);
    try {
        const result = await BillService.delete(id);
        if (result.success) {
            showNotification('Bill reminder deleted', 'success');
            UIRenderer.renderBills();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to delete bill reminder', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle add bill reminder
 */
async function handleAddBill() {
    const billName = document.getElementById('billTitle')?.value?.trim();
    const amount = parseFloat(document.getElementById('billAmount')?.value);
    const category = document.getElementById('billCategory')?.value;
    const dueDate = document.getElementById('billDueDate')?.value;
    const reminderDays = parseInt(document.getElementById('billReminderDays')?.value) || 3;
    
    if (!billName || !amount || !category || !dueDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const result = await BillService.create({
            billName,
            amount,
            category,
            dueDate,
            reminderDays
        });
        
        if (result.success) {
            showNotification('Bill reminder added', 'success');
            document.getElementById('billTitle').value = '';
            document.getElementById('billAmount').value = '';
            document.getElementById('billCategory').value = '';
            document.getElementById('billDueDate').value = '';
            
            closeModal('addBillModal');
            UIRenderer.renderBills();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to add bill reminder', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle toggle split member payment
 */
async function handleToggleSplitMember(id, memberIndex) {
    showLoading(true);
    try {
        const result = await SplitService.toggleMemberPayment(id, memberIndex);
        if (result.success) {
            UIRenderer.renderSplitExpenses();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to update member payment', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle settle split expense
 */
async function handleSettleSplit(id) {
    if (!confirm('Mark all members as paid for this split expense?')) return;
    
    showLoading(true);
    try {
        const result = await SplitService.settle(id);
        if (result.success) {
            showNotification('Split expense settled', 'success');
            UIRenderer.renderSplitExpenses();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to settle split expense', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle unsettle split expense
 */
async function handleUnsettleSplit(id) {
    if (!confirm('Reset all members to unpaid for this split expense?')) return;
    
    showLoading(true);
    try {
        const result = await SplitService.unsettle(id);
        if (result.success) {
            showNotification('Split expense unsettled', 'success');
            UIRenderer.renderSplitExpenses();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to unsettle split expense', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle delete split expense
 */
async function handleDeleteSplit(id) {
    if (!confirm('Are you sure you want to delete this split expense?')) return;
    
    showLoading(true);
    try {
        const result = await SplitService.delete(id);
        if (result.success) {
            showNotification('Split expense deleted', 'success');
            UIRenderer.renderSplitExpenses();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to delete split expense', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle edit split expense
 */
function handleEditSplitExpense(id) {
    const expense = AppState.splitExpenses.find(s => s._id === id);
    if (!expense) {
        showNotification('Split expense not found', 'error');
        return;
    }
    
    AppState.editingSplitExpenseId = id;
    
    document.getElementById('splitTitle').value = expense.title;
    document.getElementById('splitTotalAmount').value = expense.totalAmount;
    document.getElementById('splitCategory').value = expense.category;
    document.getElementById('numPeople').value = expense.members.length;
    document.getElementById('splitMethod').value = expense.splitMethod;
    
    showSplitExpenseModal();
    
    setTimeout(() => {
        updateSplitCalculation();
        
        if (expense.splitMethod === 'percentage') {
            expense.members.forEach((member, index) => {
                const percentage = (member.amount / expense.totalAmount) * 100;
                const inputs = document.querySelectorAll('.percentage-input');
                if (inputs[index]) {
                    inputs[index].value = percentage.toFixed(2);
                }
            });
            updatePercentageSplit();
        } else if (expense.splitMethod === 'custom') {
            expense.members.forEach((member, index) => {
                const inputs = document.querySelectorAll('.custom-amount-input');
                if (inputs[index]) {
                    inputs[index].value = member.amount.toFixed(2);
                }
            });
            updateCustomSplit();
        }
    }, 100);
    
    const saveButton = document.querySelector('#splitExpenseModal .btn-primary');
    if (saveButton) {
        saveButton.innerHTML = '<i class="fas fa-save"></i> Update Split Expense';
    }
}

/**
 * Handle save split expense
 */
async function handleSaveSplit() {
    const title = document.getElementById('splitTitle')?.value?.trim();
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount')?.value);
    const category = document.getElementById('splitCategory')?.value;
    const numPeople = parseInt(document.getElementById('numPeople')?.value) || 1;
    const splitMethod = document.getElementById('splitMethod')?.value;
    
    if (!title || !totalAmount || !category) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const members = [];
    
    if (splitMethod === 'equal') {
        const perPerson = totalAmount / numPeople;
        for (let i = 0; i < numPeople; i++) {
            members.push({
                name: i === 0 ? 'You' : `Person ${i + 1}`,
                amount: perPerson,
                isPaid: i === 0
            });
        }
    } else if (splitMethod === 'percentage') {
        const inputs = document.querySelectorAll('.percentage-input');
        let totalPercentage = 0;
        
        inputs.forEach((input, index) => {
            const percentage = parseFloat(input.value) || 0;
            totalPercentage += percentage;
            const amount = (totalAmount * percentage) / 100;
            members.push({
                name: index === 0 ? 'You' : `Person ${index + 1}`,
                amount: amount,
                isPaid: index === 0
            });
        });
        
        if (Math.abs(totalPercentage - 100) > 0.01) {
            showNotification('Percentages must add up to 100%', 'error');
            return;
        }
    } else if (splitMethod === 'custom') {
        const inputs = document.querySelectorAll('.custom-amount-input');
        let totalEntered = 0;
        
        inputs.forEach((input, index) => {
            const amount = parseFloat(input.value) || 0;
            totalEntered += amount;
            members.push({
                name: index === 0 ? 'You' : `Person ${index + 1}`,
                amount: amount,
                isPaid: index === 0
            });
        });
        
        if (Math.abs(totalEntered - totalAmount) > 0.01) {
            showNotification('Custom amounts must add up to total amount', 'error');
            return;
        }
    }
    
    if (members.length === 0) {
        showNotification('Please configure split correctly', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const data = { title, totalAmount, category, splitMethod, members };
        let result;
        
        if (AppState.editingSplitExpenseId) {
            result = await SplitService.update(AppState.editingSplitExpenseId, data);
            if (result.success) {
                showNotification('Split expense updated', 'success');
                AppState.editingSplitExpenseId = null;
                const saveButton = document.querySelector('#splitExpenseModal .btn-primary');
                if (saveButton) {
                    saveButton.innerHTML = '<i class="fas fa-save"></i> Save Split Expense';
                }
            }
        } else {
            result = await SplitService.create(data);
            if (result.success) {
                showNotification('Split expense added', 'success');
            }
        }
        
        if (result.success) {
            document.getElementById('splitTitle').value = '';
            document.getElementById('splitTotalAmount').value = '';
            document.getElementById('splitCategory').value = '';
            document.getElementById('numPeople').value = '1';
            document.getElementById('splitMethod').value = 'equal';
            
            closeModal('splitExpenseModal');
            UIRenderer.renderSplitExpenses();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to save split expense', 'error');
    } finally {
        showLoading(false);
    }
}

// ===================================================================
// 15. CATEGORY HANDLERS
// ===================================================================

/**
 * Handle add category
 */
async function handleAddCategory() {
    const name = document.getElementById('newCategoryName')?.value?.trim();
    const icon = document.getElementById('newCategoryIcon')?.value || '📝';
    const color = document.getElementById('newCategoryColor')?.value || '#6C757D';
    
    if (!name) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    showLoading(true);
    try {
        let result;
        if (AppState.editingCategoryId) {
            result = await CategoryService.update(AppState.editingCategoryId, { name, icon, color });
            if (result.success) {
                showNotification('Category updated', 'success');
                AppState.editingCategoryId = null;
            }
        } else {
            result = await CategoryService.create({ name, icon, color });
            if (result.success) {
                showNotification('Category added', 'success');
            }
        }
        
        if (result.success) {
            closeModal('addCategoryModal');
            await refreshAllData();
            populateCategoryDropdowns();
            updateCategoryManagement();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to save category', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle edit category
 */
function handleEditCategory(id) {
    const category = AppState.categories.find(c => c._id === id);
    if (!category) {
        showNotification('Category not found', 'error');
        return;
    }
    
    AppState.editingCategoryId = id;
    document.getElementById('newCategoryName').value = category.name;
    document.getElementById('newCategoryIcon').value = category.icon || '📝';
    document.getElementById('newCategoryColor').value = category.color || '#6C757D';
    
    showModal('addCategoryModal');
    const title = document.querySelector('#addCategoryModal .modal-header h3');
    if (title) {
        title.innerHTML = '<i class="fas fa-edit"></i> Edit Category';
    }
}

/**
 * Handle delete category
 */
async function handleDeleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    showLoading(true);
    try {
        const result = await CategoryService.delete(id);
        if (result.success) {
            showNotification('Category deleted', 'success');
            await refreshAllData();
            populateCategoryDropdowns();
            updateCategoryManagement();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to delete category', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Populate category dropdowns
 */
function populateCategoryDropdowns() {
    const dropdowns = ['category', 'recurringCategory', 'billCategory', 'splitCategory'];
    const allCategories = CategoryService.getAllCategories();
    
    dropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;
        
        const currentValue = dropdown.value;
        
        dropdown.innerHTML = `
            <option value="">Select Category</option>
            ${allCategories.map(cat => 
                `<option value="${cat.name}">${cat.icon || '📝'} ${cat.name}</option>`
            ).join('')}
            <option value="__add_new__" class="add-category-option">➕ Add New Category</option>
        `;
        
        if (currentValue && currentValue !== '__add_new__') {
            dropdown.value = currentValue;
        }
    });
}

/**
 * Update category management display
 */
function updateCategoryManagement() {
    const container = document.getElementById('customCategoriesList');
    if (!container) return;
    
    if (AppState.categories.length === 0) {
        container.innerHTML = '<div class="empty-state">No custom categories yet</div>';
        return;
    }
    
    container.innerHTML = AppState.categories.map(category => {
        const count = AppState.expenses.filter(e => e.category === category.name).length;
        return `
            <div class="category-item">
                <span class="category-icon" style="color: ${category.color || '#6C757D'}">
                    ${category.icon || '📝'}
                </span>
                <div class="category-info">
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${count} expense${count !== 1 ? 's' : ''}</div>
                </div>
                <div class="category-actions">
                    <button class="btn-icon edit" onclick="handleEditCategory('${category._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="handleDeleteCategory('${category._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Update default categories display
 */
function updateDefaultCategoriesDisplay() {
    const container = document.getElementById('defaultCategoriesList');
    if (!container) return;
    
    container.innerHTML = CONFIG.DEFAULT_CATEGORIES.map(category => {
        const count = AppState.expenses.filter(e => e.category === category.name).length;
        return `
            <div class="category-item">
                <span class="category-icon" style="color: ${category.color}">${category.icon}</span>
                <div class="category-info">
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${count} expense${count !== 1 ? 's' : ''}</div>
                </div>
                <span class="category-badge">Default</span>
            </div>
        `;
    }).join('');
}

// ===================================================================
// 16. SPLIT FORM CALCULATIONS
// ===================================================================

/**
 * Update split calculation
 */
function updateSplitCalculation() {
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount')?.value) || 0;
    const numPeople = parseInt(document.getElementById('numPeople')?.value) || 1;
    const splitMethod = document.getElementById('splitMethod')?.value;
    
    const container = document.getElementById('splitMembersContainer');
    if (!container) return;
    
    let html = '';
    
    if (splitMethod === 'equal') {
        const perPerson = totalAmount / numPeople;
        for (let i = 0; i < numPeople; i++) {
            html += `
                <div class="split-member-row">
                    <span class="member-name">${i === 0 ? 'You (You)' : `Person ${i + 1}`}</span>
                    <span class="member-amount">${getCurrencySymbol()}${formatCurrency(perPerson)}</span>
                </div>
            `;
        }
    } else if (splitMethod === 'percentage') {
        const defaultPercentage = 100 / numPeople;
        for (let i = 0; i < numPeople; i++) {
            const amount = (totalAmount * defaultPercentage) / 100;
            html += `
                <div class="split-member-row">
                    <span class="member-name">${i === 0 ? 'You (You)' : `Person ${i + 1}`}</span>
                    <div class="member-input-group">
                        <input type="number" class="percentage-input" value="${defaultPercentage.toFixed(2)}" 
                               min="0" max="100" step="0.01" oninput="updatePercentageSplit()" />
                        <span class="percentage-symbol">%</span>
                    </div>
                    <span class="member-amount">${getCurrencySymbol()}${formatCurrency(amount)}</span>
                </div>
            `;
        }
    } else if (splitMethod === 'custom') {
        const defaultAmount = totalAmount / numPeople;
        for (let i = 0; i < numPeople; i++) {
            html += `
                <div class="split-member-row">
                    <span class="member-name">${i === 0 ? 'You (You)' : `Person ${i + 1}`}</span>
                    <div class="member-input-group">
                        <input type="number" class="custom-amount-input" value="${defaultAmount.toFixed(2)}" 
                               min="0" step="0.01" oninput="updateCustomSplit()" />
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
    
    // Update summary
    updateSplitSummary(totalAmount, splitMethod);
}

/**
 * Update split summary
 */
function updateSplitSummary(totalAmount, splitMethod) {
    const container = document.getElementById('splitSummary');
    if (!container) return;
    
    let html = `
        <div class="summary-total">
            <span>Total:</span>
            <span>${getCurrencySymbol()}${formatCurrency(totalAmount)}</span>
        </div>
    `;
    
    if (splitMethod === 'equal') {
        const numPeople = parseInt(document.getElementById('numPeople')?.value) || 1;
        const perPerson = totalAmount / numPeople;
        html += `
            <div class="summary-per-person">
                <span>Each person pays:</span>
                <span>${getCurrencySymbol()}${formatCurrency(perPerson)}</span>
            </div>
        `;
    } else if (splitMethod === 'percentage') {
        const inputs = document.querySelectorAll('.percentage-input');
        let totalPercentage = 0;
        inputs.forEach(input => {
            totalPercentage += parseFloat(input.value) || 0;
        });
        html += `
            <div class="summary-percentage">
                <span>Total Percentage:</span>
                <span class="${Math.abs(totalPercentage - 100) > 0.01 ? 'text-danger' : 'text-success'}">
                    ${totalPercentage.toFixed(2)}%
                </span>
            </div>
        `;
    } else if (splitMethod === 'custom') {
        const inputs = document.querySelectorAll('.custom-amount-input');
        let totalEntered = 0;
        inputs.forEach(input => {
            totalEntered += parseFloat(input.value) || 0;
        });
        const difference = totalAmount - totalEntered;
        html += `
            <div class="summary-entered">
                <span>Entered Total:</span>
                <span>${getCurrencySymbol()}${formatCurrency(totalEntered)}</span>
            </div>
            <div class="summary-difference ${Math.abs(difference) > 0.01 ? 'text-danger' : 'text-success'}">
                <span>Difference:</span>
                <span>${getCurrencySymbol()}${formatCurrency(difference)}</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Update percentage split
 */
function updatePercentageSplit() {
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount')?.value) || 0;
    const inputs = document.querySelectorAll('.percentage-input');
    
    let totalPercentage = 0;
    inputs.forEach(input => {
        totalPercentage += parseFloat(input.value) || 0;
    });
    
    inputs.forEach((input, index) => {
        const percentage = parseFloat(input.value) || 0;
        const amount = (totalAmount * percentage) / 100;
        const row = input.closest('.split-member-row');
        const amountElement = row?.querySelector('.member-amount');
        if (amountElement) {
            amountElement.textContent = `${getCurrencySymbol()}${formatCurrency(amount)}`;
        }
    });
    
    updateSplitSummary(totalAmount, 'percentage');
}

/**
 * Update custom split
 */
function updateCustomSplit() {
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount')?.value) || 0;
    updateSplitSummary(totalAmount, 'custom');
}

// ===================================================================
// 17. CHART MANAGEMENT
// ===================================================================

/**
 * Chart Manager
 */
const ChartManager = {
    charts: {},
    
    /**
     * Destroy all charts
     */
    destroyAll() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
                this.charts[key] = null;
            }
        });
    },
    
    /**
     * Create trend chart
     */
    createTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (this.charts.trendChart) {
            this.charts.trendChart.destroy();
        }
        
        const months = getLastMonths(6);
        const data = months.map(date => {
            const month = date.getMonth();
            const year = date.getFullYear();
            const expenses = ExpenseService.getByMonth(month, year)
                .filter(e => e.type === 'expense');
            const income = ExpenseService.getByMonth(month, year)
                .filter(e => e.type === 'income');
            const totalExpenses = sumBy(expenses, 'amount');
            const totalIncome = sumBy(income, 'amount') || AppState.monthlyIncome;
            const savings = Math.max(0, totalIncome - totalExpenses);
            return { income: totalIncome, expenses: totalExpenses, savings };
        });
        
        this.charts.trendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(d => `${getMonthAbbr(d.getMonth())} ${d.getFullYear()}`),
                datasets: [
                    {
                        label: 'Income',
                        data: data.map(d => d.income),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 2
                    },
                    {
                        label: 'Expenses',
                        data: data.map(d => d.expenses),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgb(239, 68, 68)',
                        borderWidth: 2
                    },
                    {
                        label: 'Savings',
                        data: data.map(d => d.savings),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + getCurrencySymbol() + 
                                       formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return getCurrencySymbol() + formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create income/expense/savings chart
     */
    createIncomeExpenseChart() {
        const canvas = document.getElementById('incomeExpenseChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (this.charts.incomeExpenseChart) {
            this.charts.incomeExpenseChart.destroy();
        }
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const expenses = ExpenseService.getByMonth(currentMonth, currentYear)
            .filter(e => e.type === 'expense');
        const income = ExpenseService.getByMonth(currentMonth, currentYear)
            .filter(e => e.type === 'income');
        
        const totalExpenses = sumBy(expenses, 'amount');
        const totalIncome = sumBy(income, 'amount') || AppState.monthlyIncome;
        const savings = Math.max(0, totalIncome - totalExpenses);
        
        this.charts.incomeExpenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses', 'Savings'],
                datasets: [{
                    data: [totalIncome, totalExpenses, savings],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(239, 68, 68)',
                        'rgb(59, 130, 246)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${getCurrencySymbol()}${formatCurrency(value)}`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create monthly trend chart
     */
    createMonthlyTrendChart() {
        const canvas = document.getElementById('monthlyTrendChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (this.charts.monthlyTrendChart) {
            this.charts.monthlyTrendChart.destroy();
        }
        
        const months = getLastMonths(6);
        const data = months.map(date => {
            const month = date.getMonth();
            const year = date.getFullYear();
            const expenses = ExpenseService.getByMonth(month, year)
                .filter(e => e.type === 'expense');
            const income = ExpenseService.getByMonth(month, year)
                .filter(e => e.type === 'income');
            return {
                expenses: sumBy(expenses, 'amount'),
                income: sumBy(income, 'amount') || AppState.monthlyIncome
            };
        });
        
        this.charts.monthlyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(d => `${getMonthAbbr(d.getMonth())} ${d.getFullYear()}`),
                datasets: [
                    {
                        label: 'Income',
                        data: data.map(d => d.income),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Expenses',
                        data: data.map(d => d.expenses),
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return getCurrencySymbol() + formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create category chart
     */
    createCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (this.charts.categoryChart) {
            this.charts.categoryChart.destroy();
        }
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const expenses = ExpenseService.getByMonth(currentMonth, currentYear)
            .filter(e => e.type === 'expense');
        
        const categoryTotals = groupBy(expenses, 'category');
        const sorted = Object.entries(categoryTotals)
            .map(([category, items]) => ({
                category,
                total: sumBy(items, 'amount')
            }))
            .sort((a, b) => b.total - a.total);
        
        const labels = sorted.map(item => item.category);
        const data = sorted.map(item => item.total);
        const colors = sorted.map(item => CategoryService.getColor(item.category));
        
        this.charts.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${getCurrencySymbol()}${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create detailed category chart
     */
    createDetailedCategoryChart() {
        const canvas = document.getElementById('detailedCategoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (this.charts.detailedCategoryChart) {
            this.charts.detailedCategoryChart.destroy();
        }
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const expenses = ExpenseService.getByMonth(currentMonth, currentYear)
            .filter(e => e.type === 'expense');
        
        const categoryTotals = groupBy(expenses, 'category');
        const sorted = Object.entries(categoryTotals)
            .map(([category, items]) => ({
                category,
                total: sumBy(items, 'amount'),
                count: items.length
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
        
        const labels = sorted.map(item => item.category);
        const data = sorted.map(item => item.total);
        const colors = sorted.map(item => CategoryService.getColor(item.category));
        
        this.charts.detailedCategoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Amount Spent',
                    data: data,
                    backgroundColor: colors.map(c => c + 'CC'),
                    borderColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y || 0;
                                return `${getCurrencySymbol()}${formatCurrency(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return getCurrencySymbol() + formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Update all charts
     */
    updateAll() {
        this.destroyAll();
        this.createTrendChart();
        this.createIncomeExpenseChart();
        this.createMonthlyTrendChart();
        this.createCategoryChart();
        this.createDetailedCategoryChart();
    },
    
    /**
     * Resize all charts
     */
    resizeAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
};

// ===================================================================
// 18. SECTION MANAGEMENT
// ===================================================================

/**
 * Show section
 */
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
    }
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const navMap = {
        'dashboard': 0,
        'expenses': 1,
        'analytics': 2,
        'recurring': 3,
        'bills': 4,
        'split': 5
    };
    
    const index = navMap[sectionId];
    const navButtons = document.querySelectorAll('.nav-btn');
    if (navButtons[index]) {
        navButtons[index].classList.add('active');
    }
    
    AppState.currentSection = sectionId;
    
    // Render section
    switch(sectionId) {
        case 'dashboard':
            UIRenderer.renderDashboard();
            break;
        case 'expenses':
            UIRenderer.renderExpenses();
            break;
        case 'analytics':
            setTimeout(() => {
                ChartManager.updateAll();
                ChartManager.resizeAll();
            }, 100);
            break;
        case 'recurring':
            UIRenderer.renderRecurring();
            break;
        case 'bills':
            UIRenderer.renderBills();
            break;
        case 'split':
            UIRenderer.renderSplitExpenses();
            break;
    }
}

// ===================================================================
// 19. MODAL MANAGEMENT
// ===================================================================

/**
 * Show modal
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

/**
 * Toggle profile modal
 */
function toggleProfile() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    const isHidden = modal.classList.contains('hidden');
    if (isHidden && AppState.user) {
        UIRenderer.updateUserDisplay();
    }
    modal.classList.toggle('hidden');
    document.body.style.overflow = isHidden ? 'hidden' : '';
}

/**
 * Show split expense modal
 */
function showSplitExpenseModal() {
    showModal('splitExpenseModal');
    setTimeout(updateSplitCalculation, 100);
}

/**
 * Close split expense modal
 */
function closeSplitExpenseModal() {
    closeModal('splitExpenseModal');
    AppState.editingSplitExpenseId = null;
    const saveButton = document.querySelector('#splitExpenseModal .btn-primary');
    if (saveButton) {
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Split Expense';
    }
}

/**
 * Show add recurring modal
 */
function showAddRecurringModal() {
    showModal('addRecurringModal');
    document.getElementById('recurringStartDate').valueAsDate = new Date();
}

/**
 * Close add recurring modal
 */
function closeAddRecurringModal() {
    closeModal('addRecurringModal');
}

/**
 * Show add bill modal
 */
function showAddBillModal() {
    showModal('addBillModal');
    document.getElementById('billDueDate').valueAsDate = new Date();
}

/**
 * Close add bill modal
 */
function closeAddBillModal() {
    closeModal('addBillModal');
}

/**
 * Show add category modal
 */
function showAddCategoryModal() {
    AppState.editingCategoryId = null;
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryIcon').value = '📝';
    document.getElementById('newCategoryColor').value = '#6C757D';
    const title = document.querySelector('#addCategoryModal .modal-header h3');
    if (title) {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Category';
    }
    showModal('addCategoryModal');
}

/**
 * Close add category modal
 */
function closeAddCategoryModal() {
    closeModal('addCategoryModal');
}

/**
 * Show manage categories modal
 */
function showManageCategories() {
    updateDefaultCategoriesDisplay();
    updateCategoryManagement();
    showModal('manageCategoriesModal');
}

/**
 * Close manage categories modal
 */
function closeManageCategoriesModal() {
    closeModal('manageCategoriesModal');
}

// ===================================================================
// 20. REFRESH FUNCTIONS
// ===================================================================

/**
 * Refresh all data
 */
async function refreshAllData() {
    showLoading(true);
    try {
        await Promise.all([
            ExpenseService.getAll(),
            CategoryService.getAll(),
            RecurringService.getAll(),
            BillService.getAll(),
            SplitService.getAll()
        ]);
        
        // Update UI
        populateCategoryDropdowns();
        UIRenderer.updateCurrency();
        UIRenderer.updateDateDisplay();
        
        // Render current section
        switch(AppState.currentSection) {
            case 'dashboard':
                UIRenderer.renderDashboard();
                break;
            case 'expenses':
                UIRenderer.renderExpenses();
                break;
            case 'analytics':
                ChartManager.updateAll();
                break;
            case 'recurring':
                UIRenderer.renderRecurring();
                break;
            case 'bills':
                UIRenderer.renderBills();
                break;
            case 'split':
                UIRenderer.renderSplitExpenses();
                break;
        }
    } catch (error) {
        console.error('Refresh error:', error);
        showNotification('Failed to refresh data', 'error');
    } finally {
        showLoading(false);
    }
}

// ===================================================================
// 21. USER FUNCTIONS
// ===================================================================

/**
 * Save profile
 */
async function handleSaveProfile() {
    const name = document.getElementById('profileName')?.value?.trim();
    const monthlyIncome = parseFloat(document.getElementById('profileIncome')?.value);
    const currency = document.getElementById('profileCurrency')?.value;
    
    if (!name) {
        showNotification('Please enter your name', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const result = await AuthService.updateProfile({
            name,
            monthlyIncome: monthlyIncome || 0,
            currency: currency || 'INR'
        });
        
        if (result.success) {
            showNotification('Profile updated successfully', 'success');
            UIRenderer.updateUserDisplay();
            UIRenderer.updateCurrency();
            toggleProfile();
            await refreshAllData();
        }
    } catch (error) {
        showNotification(error.message || 'Failed to update profile', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Change currency
 */
async function handleChangeCurrency(currency) {
    if (currency === AppState.currency) return;
    
    showLoading(true);
    try {
        const result = await AuthService.updateProfile({ currency });
        if (result.success) {
            AppState.currency = currency;
            localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENCY, currency);
            UIRenderer.updateCurrency();
            await refreshAllData();
            showNotification(`Currency changed to ${currency}`, 'success');
        }
    } catch (error) {
        showNotification('Failed to change currency', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Logout
 */
async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        await AuthService.logout();
    }
}

/**
 * Switch account
 */
function handleSwitchAccount() {
    if (confirm('Switch to another account? You will be logged out.')) {
        handleLogout();
    }
}

/**
 * Delete account
 */
async function handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.')) {
        showLoading(true);
        try {
            const result = await AuthService.deleteAccount();
            if (result.success) {
                showNotification('Account deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            showNotification(error.message || 'Failed to delete account', 'error');
        } finally {
            showLoading(false);
        }
    }
}

// ===================================================================
// 22. MOBILE MENU
// ===================================================================

/**
 * Setup mobile menu
 */
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!menuToggle || !sidebar || !overlay) return;
    
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        menuToggle.classList.toggle('open');
        
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.className = sidebar.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
        }
    }
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        menuToggle.classList.remove('open');
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-bars';
        }
    }
    
    menuToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

// ===================================================================
// 23. INITIALIZATION
// ===================================================================

/**
 * Initialize application
 */
async function initializeApp() {
    console.log(`${CONFIG.APP_NAME} v${CONFIG.VERSION} initializing...`);
    
    try {
        // Check authentication
        if (!AppState.authToken) {
            window.location.href = 'login.html';
            return;
        }
        
        // Get current user
        const userResult = await AuthService.getCurrentUser();
        if (!userResult.success) {
            showNotification('Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Apply theme
        ThemeManager.init();
        
        // Setup mobile menu
        setupMobileMenu();
        
        // Update UI
        UIRenderer.updateDateDisplay();
        UIRenderer.updateUserDisplay();
        UIRenderer.updateCurrency();
        
        // Load data
        await refreshAllData();
        
        // Show dashboard by default
        showSection('dashboard');
        
        // Set up event listeners
        setupEventListeners();
        
        console.log(`${CONFIG.APP_NAME} initialized successfully`);
        showNotification(`Welcome back, ${AppState.user?.name || 'User'}!`, 'success');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to load application. Please refresh.', 'error');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Currency selector
    const currencySelector = document.getElementById('currencySelector');
    if (currencySelector) {
        currencySelector.addEventListener('change', function() {
            handleChangeCurrency(this.value);
        });
    }
    
    // Expense form
    const expenseForm = document.querySelector('.expense-form-grid');
    if (expenseForm) {
        expenseForm.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddExpense();
            }
        });
    }
    
    // Recurring form
    const recurringForm = document.querySelector('.recurring-form');
    if (recurringForm) {
        recurringForm.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRecurring();
            }
        });
    }
    
    // Bill form
    const billForm = document.querySelector('.bill-form');
    if (billForm) {
        billForm.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBill();
            }
        });
    }
    
    // Modal close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            });
        }
        
        // Ctrl+1-6 for navigation
        if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
            e.preventDefault();
            const sections = ['dashboard', 'expenses', 'analytics', 'recurring', 'bills', 'split'];
            const index = parseInt(e.key) - 1;
            if (sections[index]) {
                showSection(sections[index]);
            }
        }
    });
}

// ===================================================================
// 24. EXPOSE GLOBALS FOR HTML
// ===================================================================

// Expose functions to global scope for HTML event handlers
window.showSection = showSection;
window.showModal = showModal;
window.closeModal = closeModal;
window.toggleProfile = toggleProfile;
window.toggleTheme = ThemeManager.toggle.bind(ThemeManager);
window.handleAddExpense = handleAddExpense;
window.handleEditExpense = handleEditExpense;
window.handleDeleteExpense = handleDeleteExpense;
window.handleAddRecurring = handleAddRecurring;
window.handleToggleRecurring = handleToggleRecurring;
window.handleDeleteRecurring = handleDeleteRecurring;
window.showAddRecurringModal = showAddRecurringModal;
window.closeAddRecurringModal = closeAddRecurringModal;
window.handleAddBill = handleAddBill;
window.handleMarkBillPaid = handleMarkBillPaid;
window.handleDeleteBill = handleDeleteBill;
window.showAddBillModal = showAddBillModal;
window.closeAddBillModal = closeAddBillModal;
window.showSplitExpenseModal = showSplitExpenseModal;
window.closeSplitExpenseModal = closeSplitExpenseModal;
window.handleSaveSplit = handleSaveSplit;
window.handleEditSplitExpense = handleEditSplitExpense;
window.handleToggleSplitMember = handleToggleSplitMember;
window.handleSettleSplit = handleSettleSplit;
window.handleUnsettleSplit = handleUnsettleSplit;
window.handleDeleteSplit = handleDeleteSplit;
window.updateSplitCalculation = updateSplitCalculation;
window.updatePercentageSplit = updatePercentageSplit;
window.updateCustomSplit = updateCustomSplit;
window.handleAddCategory = handleAddCategory;
window.handleEditCategory = handleEditCategory;
window.handleDeleteCategory = handleDeleteCategory;
window.showAddCategoryModal = showAddCategoryModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.showManageCategories = showManageCategories;
window.closeManageCategoriesModal = closeManageCategoriesModal;
window.handleSaveProfile = handleSaveProfile;
window.handleChangeCurrency = handleChangeCurrency;
window.handleLogout = handleLogout;
window.handleSwitchAccount = handleSwitchAccount;
window.handleDeleteAccount = handleDeleteAccount;
window.refreshAllData = refreshAllData;
window.formatCurrency = formatCurrency;
window.getCurrencySymbol = getCurrencySymbol;
window.formatDate = formatDate;

// ===================================================================
// 25. START APPLICATION
// ===================================================================

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility change (refresh data when tab becomes visible)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        refreshAllData();
    }
});

// Handle online/offline events
window.addEventListener('online', function() {
    showNotification('Back online! Refreshing data...', 'info');
    refreshAllData();
});

window.addEventListener('offline', function() {
    showNotification('You are offline. Some features may not work.', 'error');
});

console.log('✅ FinFlow JavaScript loaded successfully');
console.log(`📦 Version: ${CONFIG.VERSION}`);
console.log(`🔗 API: ${CONFIG.API_URL}`);
console.log(`🌓 Theme: ${AppState.theme}`);
console.log(`💰 Currency: ${AppState.currency}`);

// ===================================================================
// END OF JAVASCRIPT
// ===================================================================
