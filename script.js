/**
 * ===================================================================
 * FINFLOW - COMPLETE JAVASCRIPT APPLICATION
 * Version: 1.0.0
 * ===================================================================
 */

// ===================================================================
// 1. CONFIGURATION
// ===================================================================

const API_URL = 'https://finflow-expense-tracker-backend.vercel.app/api';
let authToken = localStorage.getItem('token') || null;

const CURRENCY_SYMBOLS = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
};

const DEFAULT_CATEGORIES = [
    { name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
    { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
    { name: 'Shopping', icon: '🛍️', color: '#FFD166' },
    { name: 'Entertainment', icon: '🎬', color: '#06D6A0' },
    { name: 'Bills & Utilities', icon: '💡', color: '#118AB2' },
    { name: 'Healthcare', icon: '🏥', color: '#EF476F' },
    { name: 'Education', icon: '📚', color: '#073B4C' },
    { name: 'Income', icon: '💰', color: '#2A9D8F' },
    { name: 'Others', icon: '📝', color: '#6C757D' }
];

// ===================================================================
// 2. STATE
// ===================================================================

let currentUser = null;
let userId = null;
let monthlyIncome = 0;
let userCurrency = 'INR';
let currentTheme = localStorage.getItem('theme') || 'light';

let expenses = [];
let recurringExpenses = [];
let billReminders = [];
let splitExpenses = [];
let customCategories = [];

let editingExpenseId = null;
let editingCategoryId = null;
let editingSplitExpenseId = null;

let trendChart = null;
let incomeExpenseChart = null;
let monthlyTrendChart = null;
let categoryChart = null;
let detailedCategoryChart = null;

// ===================================================================
// 3. API HELPER
// ===================================================================

async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const config = {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        },
        mode: 'cors'
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showNotification('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===================================================================
// 4. UTILITY FUNCTIONS
// ===================================================================

function formatCurrency(amount) {
    if (isNaN(amount) || amount === undefined || amount === null) return '0.00';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function getCurrencySymbol() {
    return CURRENCY_SYMBOLS[userCurrency] || '₹';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return 'N/A';
    }
}

function formatDateInput(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

function getDaysUntil(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return Math.ceil((date - now) / (1000 * 60 * 60 * 24));
}

function getLastMonths(n = 6) {
    const months = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    return months;
}

function getAllCategories() {
    return [...DEFAULT_CATEGORIES, ...customCategories];
}

function getCategoryByName(name) {
    return getAllCategories().find(c => c.name === name) || DEFAULT_CATEGORIES[8];
}

function sumBy(array, key) {
    return array.reduce((sum, item) => sum + (item[key] || 0), 0);
}

function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) result[groupKey] = [];
        result[groupKey].push(item);
        return result;
    }, {});
}

function sortByDate(array, key, ascending = false) {
    return [...array].sort((a, b) => {
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return ascending ? dateA - dateB : dateB - dateA;
    });
}

// ===================================================================
// 5. NOTIFICATION
// ===================================================================

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

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
    requestAnimationFrame(() => notification.classList.add('show'));

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showGlobalMessage(message, type = 'success') {
    const el = document.getElementById('globalMessage');
    if (!el) return;
    el.textContent = message;
    el.className = `message ${type}`;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

// ===================================================================
// 6. THEME
// ===================================================================

function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme();
    showNotification(`${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)} mode`, 'info');
}

// ===================================================================
// 7. CURRENCY
// ===================================================================

function updateCurrencyDisplay() {
    const symbol = getCurrencySymbol();
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = symbol;
    });
}

async function changeCurrency(currency) {
    try {
        const data = await apiRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ currency })
        });
        if (data.success) {
            userCurrency = currency;
            updateCurrencyDisplay();
            showNotification(`Currency changed to ${currency}`, 'success');
            updateAllDisplays();
        }
    } catch {
        showNotification('Failed to update currency', 'error');
    }
}

// ===================================================================
// 8. USER MANAGEMENT
// ===================================================================

function toggleProfile() {
    const modal = document.getElementById('profileModal');
    const isHidden = modal.classList.contains('hidden');

    if (isHidden && currentUser) {
        document.getElementById('profileName').value = currentUser.name || '';
        document.getElementById('profileIncome').value = currentUser.monthlyIncome || '';
        document.getElementById('profileCurrency').value = currentUser.currency || 'INR';
        const emailDisplay = document.getElementById('profileEmail');
        if (emailDisplay) {
            emailDisplay.innerHTML = `
                <span>${currentUser.email || ''}</span>
                <small class="text-muted">(cannot be changed)</small>
            `;
        }
    }

    modal.classList.toggle('hidden');
    document.body.style.overflow = isHidden ? 'hidden' : '';
}

async function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const income = parseFloat(document.getElementById('profileIncome').value) || 0;
    const currency = document.getElementById('profileCurrency').value;

    if (!name) {
        showNotification('Please enter your name', 'error');
        return;
    }

    try {
        const data = await apiRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ name, monthlyIncome: income, currency })
        });

        if (data.success) {
            currentUser = data.user;
            monthlyIncome = data.user.monthlyIncome || 0;
            userCurrency = data.user.currency || 'INR';

            document.getElementById('username').innerHTML = `Welcome back, <span class="text-primary">${data.user.name}</span>`;
            document.getElementById('totalIncome').textContent = formatCurrency(monthlyIncome);
            document.getElementById('currencySelector').value = userCurrency;

            updateCurrencyDisplay();
            updateAllDisplays();
            toggleProfile();
            showNotification('Profile updated successfully', 'success');
        }
    } catch {
        showNotification('Failed to update profile', 'error');
    }
}

async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    try {
        const data = await apiRequest('/user/delete', { method: 'DELETE' });
        if (data.success) {
            showNotification('Account deleted successfully', 'success');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => window.location.href = 'login.html', 2000);
        }
    } catch {
        showNotification('Failed to delete account', 'error');
    }
}

// ===================================================================
// 9. EXPENSE CRUD
// ===================================================================

async function addExpense() {
    const description = document.getElementById('title').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('expenseDate').value;

    if (!description || !amount || !category || !date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        const expenseData = { description, amount, category, date, type: 'expense' };
        let result;

        if (editingExpenseId) {
            result = await apiRequest(`/expenses/${editingExpenseId}`, {
                method: 'PUT',
                body: JSON.stringify(expenseData)
            });
            if (result.success) {
                const index = expenses.findIndex(e => e._id === editingExpenseId);
                if (index !== -1) expenses[index] = result.expense;
                showNotification('Expense updated', 'success');
            }
        } else {
            result = await apiRequest('/expenses', {
                method: 'POST',
                body: JSON.stringify(expenseData)
            });
            if (result.success) {
                expenses.push(result.expense);
                showNotification('Expense added', 'success');
            }
        }

        if (result.success) {
            document.getElementById('title').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('category').value = '';
            document.getElementById('expenseDate').valueAsDate = new Date();

            const addBtn = document.querySelector('.btn-add');
            addBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Expense';
            editingExpenseId = null;
            updateAllDisplays();
        }
    } catch {
        showNotification('Failed to save expense', 'error');
    }
}

function editExpense(id) {
    const expense = expenses.find(e => e._id === id);
    if (!expense) {
        showNotification('Expense not found', 'error');
        return;
    }

    document.getElementById('title').value = expense.description;
    document.getElementById('amount').value = expense.amount;
    document.getElementById('category').value = expense.category;
    document.getElementById('expenseDate').value = formatDateInput(expense.date);

    document.querySelector('.btn-add').innerHTML = '<i class="fas fa-save"></i> Update Expense';
    editingExpenseId = id;

    showSection('expenses');
    document.querySelector('.add-expense-card').scrollIntoView({ behavior: 'smooth' });
    showNotification('Edit expense and click Update', 'info');
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;

    try {
        const data = await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
        if (data.success) {
            expenses = expenses.filter(e => e._id !== id);
            showNotification('Expense deleted', 'success');
            updateAllDisplays();
        }
    } catch {
        showNotification('Failed to delete expense', 'error');
    }
}

function loadExpenses() {
    const container = document.getElementById('expenseList');
    if (!container) return;

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">No expenses added yet</div>';
        return;
    }

    const sorted = sortByDate(expenses, 'date');

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
                ${sorted.map(e => {
                    const cat = getCategoryByName(e.category);
                    const isIncome = e.type === 'income';
                    return `
                        <tr>
                            <td>${e.description}</td>
                            <td><span class="badge">${cat.icon} ${e.category}</span></td>
                            <td>${formatDate(e.date)}</td>
                            <td><span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">${e.type}</span></td>
                            <td class="${isIncome ? 'text-success' : 'text-danger'}">
                                ${isIncome ? '+' : '-'}${getCurrencySymbol()}${formatCurrency(e.amount)}
                            </td>
                            <td>
                                <button class="btn-icon edit" onclick="editExpense('${e._id}')"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon delete" onclick="deleteExpense('${e._id}')"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// ===================================================================
// 10. DASHBOARD
// ===================================================================

function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return e.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncome = expenses.filter(e => {
        const d = new Date(e.date);
        return e.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalExpenses = sumBy(monthlyExpenses, 'amount');
    const totalIncome = sumBy(monthlyIncome, 'amount') || monthlyIncome;
    const actualIncome = monthlyIncome > 0 ? monthlyIncome : totalIncome;
    const savings = actualIncome - totalExpenses;
    const savingsRate = actualIncome > 0 ? ((savings / actualIncome) * 100) : 0;

    const totalExpenseEl = document.getElementById('totalExpense');
    const balanceEl = document.getElementById('balance');
    const savingsRateEl = document.getElementById('savingsRate');

    if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(totalExpenses);
    if (balanceEl) balanceEl.textContent = formatCurrency(savings);
    if (savingsRateEl) savingsRateEl.textContent = `${savingsRate.toFixed(1)}%`;

    renderRecentTransactions();
    renderCategoryBreakdown();
    renderUpcomingBills();
}

function renderRecentTransactions() {
    const container = document.getElementById('recentExpenseList');
    if (!container) return;

    const recent = sortByDate(expenses, 'date').slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state">No recent transactions</div>';
        return;
    }

    container.innerHTML = recent.map(e => {
        const cat = getCategoryByName(e.category);
        const isIncome = e.type === 'income';
        return `
            <div class="transaction-item">
                <div class="transaction-icon" style="background: ${cat.color}20; color: ${cat.color}">${cat.icon}</div>
                <div class="transaction-details">
                    <div class="transaction-name">${e.description}</div>
                    <div class="transaction-date">${formatDate(e.date)}</div>
                </div>
                <div class="transaction-amount ${isIncome ? 'text-success' : 'text-danger'}">
                    ${isIncome ? '+' : '-'}${getCurrencySymbol()}${formatCurrency(e.amount)}
                </div>
            </div>
        `;
    }).join('');
}

function renderCategoryBreakdown() {
    const container = document.getElementById('categoryBreakdown');
    if (!container) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return e.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    if (monthlyExpenses.length === 0) {
        container.innerHTML = '<div class="empty-state">No expenses this month</div>';
        return;
    }

    const totals = {};
    monthlyExpenses.forEach(e => {
        if (!totals[e.category]) totals[e.category] = 0;
        totals[e.category] += e.amount;
    });

    const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const totalAll = Object.values(totals).reduce((sum, v) => sum + v, 0);

    container.innerHTML = sorted.map(([category, amount]) => {
        const cat = getCategoryByName(category);
        const percentage = (amount / totalAll) * 100;
        return `
            <div class="category-breakdown-item">
                <div class="category-breakdown-header">
                    <span class="category-icon">${cat.icon}</span>
                    <span class="category-name">${category}</span>
                    <span class="category-amount">${getCurrencySymbol()}${formatCurrency(amount)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%; background: ${cat.color}"></div>
                </div>
                <div class="category-percentage">${percentage.toFixed(1)}%</div>
            </div>
        `;
    }).join('');
}

function renderUpcomingBills() {
    const container = document.getElementById('upcomingBills');
    if (!container) return;

    const now = new Date();
    const upcoming = billReminders
        .filter(b => !b.isPaid && new Date(b.dueDate) >= now)
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
                <div class="bill-amount">${getCurrencySymbol()}${formatCurrency(bill.amount)}</div>
            </div>
        `;
    }).join('');
}

// ===================================================================
// 11. ANALYTICS / CHARTS
// ===================================================================

function loadAnalytics() {
    updateTrendChart();
    updateIncomeExpenseChart();
    updateMonthlyTrendChart();
    updateCategoryChart();
    updateDetailedCategoryChart();
}

function updateTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    if (trendChart) { trendChart.destroy(); trendChart = null; }

    const months = getLastMonths(6);
    const data = months.map(date => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return e.type === 'expense' && d.getMonth() === month && d.getFullYear() === year;
        });
        const monthIncome = expenses.filter(e => {
            const d = new Date(e.date);
            return e.type === 'income' && d.getMonth() === month && d.getFullYear() === year;
        });
        const totalExpenses = sumBy(monthExpenses, 'amount');
        const totalIncome = sumBy(monthIncome, 'amount') || monthlyIncome;
        return { income: totalIncome, expenses: totalExpenses, savings: Math.max(0, totalIncome - totalExpenses) };
    });

    trendChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: months.map(d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
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
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.dataset.label + ': ' + getCurrencySymbol() + formatCurrency(ctx.parsed.y);
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
}

function updateIncomeExpenseChart() {
    const canvas = document.getElementById('incomeExpenseChart');
    if (!canvas) return;

    if (incomeExpenseChart) { incomeExpenseChart.destroy(); incomeExpenseChart = null; }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return e.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncome = expenses.filter(e => {
        const d = new Date(e.date);
        return e.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalExpenses = sumBy(monthlyExpenses, 'amount');
    const totalIncome = sumBy(monthlyIncome, 'amount') || monthlyIncome;
    const savings = Math.max(0, totalIncome - totalExpenses);

    incomeExpenseChart = new Chart(canvas, {
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
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.label + ': ' + getCurrencySymbol() + formatCurrency(ctx.parsed);
                        }
                    }
                }
            }
        }
    });
}

function updateMonthlyTrendChart() {
    const canvas = document.getElementById('monthlyTrendChart');
    if (!canvas) return;

    if (monthlyTrendChart) { monthlyTrendChart.destroy(); monthlyTrendChart = null; }

    const months = getLastMonths(6);
    const data = months.map(date => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return e.type === 'expense' && d.getMonth() === month && d.getFullYear() === year;
        });
        const monthIncome = expenses.filter(e => {
            const d = new Date(e.date);
            return e.type === 'income' && d.getMonth() === month && d.getFullYear() === year;
        });
        return {
            expenses: sumBy(monthExpenses, 'amount'),
            income: sumBy(monthIncome, 'amount') || monthlyIncome
        };
    });

    monthlyTrendChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: months.map(d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
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
                legend: { display: true, position: 'top' }
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
}

function updateCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    if (categoryChart) { categoryChart.destroy(); categoryChart = null; }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return e.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totals = {};
    monthlyExpenses.forEach(e => {
        if (!totals[e.category]) totals[e.category] = 0;
        totals[e.category] += e.amount;
    });

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, amount]) => amount);
    const colors = sorted.map(([cat]) => getCategoryByName(cat).color);

    categoryChart = new Chart(canvas, {
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
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((ctx.parsed / total) * 100).toFixed(1);
                            return `${ctx.label}: ${getCurrencySymbol()}${formatCurrency(ctx.parsed)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateDetailedCategoryChart() {
    const canvas = document.getElementById('detailedCategoryChart');
    if (!canvas) return;

    if (detailedCategoryChart) { detailedCategoryChart.destroy(); detailedCategoryChart = null; }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return e.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totals = {};
    monthlyExpenses.forEach(e => {
        if (!totals[e.category]) totals[e.category] = 0;
        totals[e.category] += e.amount;
    });

    const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, amount]) => amount);
    const colors = sorted.map(([cat]) => getCategoryByName(cat).color);

    detailedCategoryChart = new Chart(canvas, {
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
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return getCurrencySymbol() + formatCurrency(ctx.parsed.y);
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
}

function updateChartSizes() {
    [trendChart, incomeExpenseChart, monthlyTrendChart, categoryChart, detailedCategoryChart].forEach(chart => {
        if (chart) { chart.resize(); chart.update(); }
    });
}

function downloadChart(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        showNotification('Chart not found', 'error');
        return;
    }
    try {
        const link = document.createElement('a');
        link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showNotification('Chart downloaded', 'success');
    } catch {
        showNotification('Failed to download chart', 'error');
    }
}

// ===================================================================
// 12. CATEGORIES
// ===================================================================

function initializeCategories() {
    updateCategoryDropdowns();
    updateCategoryManagement();
}

function updateCategoryDropdowns() {
    const dropdowns = ['category', 'recurringCategory', 'billCategory', 'splitCategory'];
    const allCategories = getAllCategories();

    dropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;
        const currentValue = dropdown.value;
        dropdown.innerHTML = `
            <option value="">Select Category</option>
            ${allCategories.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('')}
            <option value="__add_new__" class="add-category-option">➕ Add New Category</option>
        `;
        if (currentValue && currentValue !== '__add_new__') {
            dropdown.value = currentValue;
        }
    });
}

function showAddCategoryModal() {
    editingCategoryId = null;
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryIcon').value = '📝';
    document.getElementById('newCategoryColor').value = '#6C757D';
    document.getElementById('addCategoryModal').classList.remove('hidden');
}

function closeAddCategoryModal() {
    document.getElementById('addCategoryModal').classList.add('hidden');
}

function showManageCategoriesModal() {
    updateDefaultCategoriesDisplay();
    updateCategoryManagement();
    document.getElementById('manageCategoriesModal').classList.remove('hidden');
}

function closeManageCategoriesModal() {
    document.getElementById('manageCategoriesModal').classList.add('hidden');
}

async function saveNewCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value;
    const color = document.getElementById('newCategoryColor').value;

    if (!name) {
        showNotification('Please enter a category name', 'error');
        return;
    }

    try {
        let result;
        if (editingCategoryId) {
            result = await apiRequest(`/categories/${editingCategoryId}`, {
                method: 'PUT',
                body: JSON.stringify({ name, icon, color })
            });
            if (result.success) {
                const index = customCategories.findIndex(c => c._id === editingCategoryId);
                if (index !== -1) customCategories[index] = result.category;
                showNotification('Category updated', 'success');
            }
        } else {
            result = await apiRequest('/categories', {
                method: 'POST',
                body: JSON.stringify({ name, icon, color })
            });
            if (result.success) {
                customCategories.push(result.category);
                showNotification('Category added', 'success');
            }
        }

        if (result.success) {
            closeAddCategoryModal();
            updateCategoryDropdowns();
            updateCategoryManagement();
            editingCategoryId = null;
        }
    } catch {
        showNotification('Failed to save category', 'error');
    }
}

function editCategory(id) {
    const category = customCategories.find(c => c._id === id);
    if (!category) {
        showNotification('Category not found', 'error');
        return;
    }
    editingCategoryId = id;
    document.getElementById('newCategoryName').value = category.name;
    document.getElementById('newCategoryIcon').value = category.icon || '📝';
    document.getElementById('newCategoryColor').value = category.color || '#6C757D';
    document.querySelector('#addCategoryModal .modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Edit Category';
    document.getElementById('addCategoryModal').classList.remove('hidden');
}

async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;

    try {
        const data = await apiRequest(`/categories/${id}`, { method: 'DELETE' });
        if (data.success) {
            customCategories = customCategories.filter(c => c._id !== id);
            showNotification('Category deleted', 'success');
            updateCategoryDropdowns();
            updateCategoryManagement();
        }
    } catch {
        showNotification('Failed to delete category', 'error');
    }
}

function updateDefaultCategoriesDisplay() {
    const container = document.getElementById('defaultCategoriesList');
    if (!container) return;

    container.innerHTML = DEFAULT_CATEGORIES.map(cat => {
        const count = expenses.filter(e => e.category === cat.name).length;
        return `
            <div class="category-item">
                <span class="category-icon" style="color: ${cat.color}">${cat.icon}</span>
                <div class="category-info">
                    <div class="category-name">${cat.name}</div>
                    <div class="category-count">${count} expense${count !== 1 ? 's' : ''}</div>
                </div>
                <span class="category-badge">Default</span>
            </div>
        `;
    }).join('');
}

function updateCategoryManagement() {
    const container = document.getElementById('customCategoriesList');
    if (!container) return;

    if (customCategories.length === 0) {
        container.innerHTML = '<div class="empty-state">No custom categories yet</div>';
        return;
    }

    container.innerHTML = customCategories.map(cat => {
        const count = expenses.filter(e => e.category === cat.name).length;
        return `
            <div class="category-item">
                <span class="category-icon" style="color: ${cat.color}">${cat.icon}</span>
                <div class="category-info">
                    <div class="category-name">${cat.name}</div>
                    <div class="category-count">${count} expense${count !== 1 ? 's' : ''}</div>
                </div>
                <div class="category-actions">
                    <button class="btn-icon edit" onclick="editCategory('${cat._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteCategory('${cat._id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function manageCategories() {
    showManageCategoriesModal();
}

// ===================================================================
// 13. RECURRING EXPENSES
// ===================================================================

function showAddRecurringModal() {
    document.getElementById('addRecurringModal').classList.remove('hidden');
    document.getElementById('recurringStartDate').valueAsDate = new Date();
}

function closeAddRecurringModal() {
    document.getElementById('addRecurringModal').classList.add('hidden');
}

async function addRecurringExpense() {
    const description = document.getElementById('recurringTitle').value.trim();
    const amount = parseFloat(document.getElementById('recurringAmount').value);
    const category = document.getElementById('recurringCategory').value;
    const frequency = document.getElementById('recurringFrequency').value;
    const startDate = document.getElementById('recurringStartDate').value;

    if (!description || !amount || !category || !frequency || !startDate) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        const data = await apiRequest('/recurring', {
            method: 'POST',
            body: JSON.stringify({ description, amount, category, frequency, startDate })
        });

        if (data.success) {
            recurringExpenses.push(data.recurringExpense);
            document.getElementById('recurringTitle').value = '';
            document.getElementById('recurringAmount').value = '';
            document.getElementById('recurringCategory').value = '';
            document.getElementById('recurringFrequency').value = '';
            document.getElementById('recurringStartDate').value = '';
            closeAddRecurringModal();
            showNotification('Recurring expense added', 'success');
            updateRecurringExpensesDisplay();
        }
    } catch {
        showNotification('Failed to add recurring expense', 'error');
    }
}

async function saveRecurringExpense() {
    await addRecurringExpense();
}

function updateRecurringExpensesDisplay() {
    const container = document.getElementById('recurringGrid');
    if (!container) return;

    if (recurringExpenses.length === 0) {
        container.innerHTML = '<div class="empty-state">No recurring expenses</div>';
        return;
    }

    container.innerHTML = recurringExpenses.map(e => {
        const cat = getCategoryByName(e.category);
        const isActive = e.isActive !== false;
        const startDate = new Date(e.startDate);
        const now = new Date();
        let nextDue = new Date(startDate);

        while (nextDue < now) {
            if (e.frequency === 'daily') nextDue.setDate(nextDue.getDate() + 1);
            else if (e.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
            else if (e.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
            else if (e.frequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
            else if (e.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
        }

        const daysUntil = getDaysUntil(nextDue);
        const freqLabel = e.frequency.toUpperCase();

        return `
            <div class="recurring-card ${isActive ? 'active' : 'inactive'}">
                <div class="recurring-header">
                    <h3>${e.description}</h3>
                    <span class="recurring-badge ${e.frequency}">${freqLabel}</span>
                </div>
                <div class="recurring-content">
                    <div class="recurring-amount">
                        <span class="amount-label">Amount:</span>
                        <span class="amount-value">${getCurrencySymbol()}${formatCurrency(e.amount)}</span>
                    </div>
                    <div class="recurring-details">
                        <div class="detail-item"><i class="fas fa-calendar"></i> <span>Next Due: ${formatDate(nextDue)}</span></div>
                        <div class="detail-item"><i class="fas fa-redo"></i> <span>Frequency: ${e.frequency}</span></div>
                        <div class="detail-item"><i class="fas fa-tag"></i> <span>Category: ${e.category}</span></div>
                    </div>
                    <div class="due-status ${isActive ? '' : 'text-danger'}">
                        ${isActive ? `Due in ${daysUntil > 0 ? daysUntil : 0} days` : 'Deactivated'}
                    </div>
                </div>
                <div class="recurring-actions">
                    <button class="btn-icon ${isActive ? 'pause' : 'play'}" onclick="toggleRecurringExpense('${e._id}')">
                        <i class="fas fa-${isActive ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteRecurringExpense('${e._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function toggleRecurringExpense(id) {
    try {
        const data = await apiRequest(`/recurring/${id}/toggle`, { method: 'PATCH' });
        if (data.success) {
            const index = recurringExpenses.findIndex(e => e._id === id);
            if (index !== -1) recurringExpenses[index] = data.recurringExpense;
            showNotification('Recurring expense toggled', 'success');
            updateRecurringExpensesDisplay();
        }
    } catch {
        showNotification('Failed to toggle', 'error');
    }
}

async function deleteRecurringExpense(id) {
    if (!confirm('Delete this recurring expense?')) return;

    try {
        const data = await apiRequest(`/recurring/${id}`, { method: 'DELETE' });
        if (data.success) {
            recurringExpenses = recurringExpenses.filter(e => e._id !== id);
            showNotification('Recurring expense deleted', 'success');
            updateRecurringExpensesDisplay();
        }
    } catch {
        showNotification('Failed to delete', 'error');
    }
}

// ===================================================================
// 14. BILL REMINDERS
// ===================================================================

function showAddBillModal() {
    document.getElementById('addBillModal').classList.remove('hidden');
    document.getElementById('billDueDate').valueAsDate = new Date();
}

function closeAddBillModal() {
    document.getElementById('addBillModal').classList.add('hidden');
}

async function addBillReminder() {
    const billName = document.getElementById('billTitle').value.trim();
    const amount = parseFloat(document.getElementById('billAmount').value);
    const category = document.getElementById('billCategory').value;
    const dueDate = document.getElementById('billDueDate').value;
    const reminderDays = parseInt(document.getElementById('billReminderDays').value) || 3;

    if (!billName || !amount || !category || !dueDate) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        const data = await apiRequest('/bills', {
            method: 'POST',
            body: JSON.stringify({ billName, amount, category, dueDate, reminderDays })
        });

        if (data.success) {
            billReminders.push(data.bill);
            document.getElementById('billTitle').value = '';
            document.getElementById('billAmount').value = '';
            document.getElementById('billCategory').value = '';
            document.getElementById('billDueDate').value = '';
            closeAddBillModal();
            showNotification('Bill reminder added', 'success');
            updateBillRemindersDisplay();
            updateBillCalendar();
        }
    } catch {
        showNotification('Failed to add bill reminder', 'error');
    }
}

async function saveBillReminder() {
    await addBillReminder();
}

function updateBillRemindersDisplay() {
    const container = document.getElementById('remindersContainer');
    if (!container) return;

    if (billReminders.length === 0) {
        container.innerHTML = '<div class="empty-state">No bill reminders</div>';
        return;
    }

    const sorted = sortByDate(billReminders, 'dueDate');

    container.innerHTML = sorted.map(bill => {
        const daysUntil = getDaysUntil(bill.dueDate);
        const isOverdue = daysUntil < 0 && !bill.isPaid;
        const isDueSoon = daysUntil <= (bill.reminderDays || 3) && daysUntil >= 0 && !bill.isPaid;

        let statusText = 'Pending';
        let statusClass = 'pending';
        if (bill.isPaid) { statusText = 'Paid'; statusClass = 'paid'; }
        else if (isOverdue) { statusText = 'Overdue'; statusClass = 'overdue'; }
        else if (isDueSoon) { statusText = 'Upcoming'; statusClass = 'upcoming'; }

        return `
            <div class="bill-reminder-card ${bill.isPaid ? 'paid' : isOverdue ? 'overdue' : isDueSoon ? 'upcoming' : ''}">
                <div class="bill-header">
                    <div class="bill-title">
                        <h4>${bill.billName}</h4>
                        <span class="bill-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="bill-amount">${getCurrencySymbol()}${formatCurrency(bill.amount)}</div>
                </div>
                <div class="bill-details">
                    <div class="detail-row"><span class="label">Due:</span><span class="value">${formatDate(bill.dueDate)}</span></div>
                    <div class="detail-row"><span class="label">Status:</span><span class="value ${bill.isPaid ? 'text-success' : isOverdue ? 'text-danger' : 'text-warning'}">
                        ${bill.isPaid ? 'Paid' : isOverdue ? 'Overdue' : `Due in ${daysUntil} days`}
                    </span></div>
                </div>
                <div class="bill-actions">
                    ${!bill.isPaid ? `<button class="btn-success btn-sm" onclick="markBillAsPaid('${bill._id}')"><i class="fas fa-check"></i> Mark Paid</button>` : ''}
                    <button class="btn-icon delete" onclick="deleteBillReminder('${bill._id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

async function markBillAsPaid(id) {
    try {
        const data = await apiRequest(`/bills/${id}/pay`, { method: 'PATCH' });
        if (data.success) {
            const index = billReminders.findIndex(b => b._id === id);
            if (index !== -1) billReminders[index] = data.bill;
            showNotification('Bill marked as paid', 'success');
            updateBillRemindersDisplay();
            updateBillCalendar();
        }
    } catch {
        showNotification('Failed to mark bill as paid', 'error');
    }
}

async function deleteBillReminder(id) {
    if (!confirm('Delete this bill reminder?')) return;

    try {
        const data = await apiRequest(`/bills/${id}`, { method: 'DELETE' });
        if (data.success) {
            billReminders = billReminders.filter(b => b._id !== id);
            showNotification('Bill reminder deleted', 'success');
            updateBillRemindersDisplay();
            updateBillCalendar();
        }
    } catch {
        showNotification('Failed to delete', 'error');
    }
}

function updateBillCalendar() {
    const container = document.getElementById('billCalendar');
    if (!container) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayIndex = firstDay.getDay();

    const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const title = document.querySelector('.calendar-section h3');
    if (title) title.textContent = `Bill Calendar - ${monthName}`;

    let html = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    for (let i = 0; i < firstDayIndex; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
        const billsOnDay = billReminders.filter(bill => {
            const d = new Date(bill.dueDate);
            return !bill.isPaid && d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const hasBill = billsOnDay.length > 0;
        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';
        if (hasBill) dayClass += ' has-bill';

        html += `
            <div class="${dayClass}" data-date="${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}" 
                 ${hasBill ? `data-bills='${JSON.stringify(billsOnDay)}'` : ''}>
                ${day}
                ${hasBill ? `<span class="bill-count">${billsOnDay.length}</span>` : ''}
            </div>
        `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.calendar-day.has-bill').forEach(el => {
        el.addEventListener('click', function() {
            const bills = JSON.parse(this.dataset.bills || '[]');
            if (bills.length > 0) {
                const list = bills.map(b => `• ${b.billName}: ${getCurrencySymbol()}${formatCurrency(b.amount)}`).join('\n');
                showNotification(`Bills due:\n${list}`, 'info', 5000);
            }
        });
    });
}

// ===================================================================
// 15. SPLIT EXPENSES
// ===================================================================

function showSplitExpenseModal() {
    document.getElementById('splitExpenseModal').classList.remove('hidden');
    updateSplitCalculation();
}

function closeSplitExpenseModal() {
    document.getElementById('splitExpenseModal').classList.add('hidden');
    editingSplitExpenseId = null;
    document.getElementById('splitTitle').value = '';
    document.getElementById('splitTotalAmount').value = '';
    document.getElementById('splitCategory').value = '';
    document.getElementById('numPeople').value = '1';
    document.getElementById('splitMethod').value = 'equal';
    const saveBtn = document.querySelector('#splitExpenseModal .btn-primary');
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Split Expense';
}

function updateSplitCalculation() {
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount').value) || 0;
    const numPeople = parseInt(document.getElementById('numPeople').value) || 1;
    const splitMethod = document.getElementById('splitMethod').value;
    const container = document.getElementById('splitMembersContainer');
    let html = '';

    if (splitMethod === 'equal') {
        const perPerson = totalAmount / numPeople;
        for (let i = 0; i < numPeople; i++) {
            html += `
                <div class="split-member-row">
                    <span class="member-name">${i === 0 ? 'You' : `Person ${i + 1}`}</span>
                    <span class="member-amount">${getCurrencySymbol()}${formatCurrency(perPerson)}</span>
                </div>
            `;
        }
    } else if (splitMethod === 'percentage') {
        const defaultPct = 100 / numPeople;
        for (let i = 0; i < numPeople; i++) {
            const amount = (totalAmount * defaultPct) / 100;
            html += `
                <div class="split-member-row">
                    <span class="member-name">${i === 0 ? 'You' : `Person ${i + 1}`}</span>
                    <div class="member-input-group">
                        <input type="number" class="percentage-input" value="${defaultPct.toFixed(2)}" min="0" max="100" step="0.01" oninput="updatePercentageSplit()" />
                        <span class="percentage-symbol">%</span>
                    </div>
                    <span class="member-amount">${getCurrencySymbol()}${formatCurrency(amount)}</span>
                </div>
            `;
        }
    } else if (splitMethod === 'custom') {
        const defaultAmt = totalAmount / numPeople;
        for (let i = 0; i < numPeople; i++) {
            html += `
                <div class="split-member-row">
                    <span class="member-name">${i === 0 ? 'You' : `Person ${i + 1}`}</span>
                    <div class="member-input-group">
                        <input type="number" class="custom-amount-input" value="${defaultAmt.toFixed(2)}" min="0" step="0.01" oninput="updateCustomSplit()" />
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html;
    updateSplitSummary(totalAmount, splitMethod);
}

function updateSplitSummary(totalAmount, splitMethod) {
    const container = document.getElementById('splitSummary');
    if (!container) return;

    let html = `<div class="summary-total"><span>Total:</span><span>${getCurrencySymbol()}${formatCurrency(totalAmount)}</span></div>`;

    if (splitMethod === 'equal') {
        const numPeople = parseInt(document.getElementById('numPeople').value) || 1;
        const perPerson = totalAmount / numPeople;
        html += `<div class="summary-per-person"><span>Each person pays:</span><span>${getCurrencySymbol()}${formatCurrency(perPerson)}</span></div>`;
    } else if (splitMethod === 'percentage') {
        const inputs = document.querySelectorAll('.percentage-input');
        let totalPct = 0;
        inputs.forEach(inp => totalPct += parseFloat(inp.value) || 0);
        html += `
            <div class="summary-percentage">
                <span>Total Percentage:</span>
                <span class="${Math.abs(totalPct - 100) > 0.01 ? 'text-danger' : 'text-success'}">${totalPct.toFixed(2)}%</span>
            </div>
        `;
    } else if (splitMethod === 'custom') {
        const inputs = document.querySelectorAll('.custom-amount-input');
        let totalEntered = 0;
        inputs.forEach(inp => totalEntered += parseFloat(inp.value) || 0);
        const diff = totalAmount - totalEntered;
        html += `
            <div class="summary-entered"><span>Entered Total:</span><span>${getCurrencySymbol()}${formatCurrency(totalEntered)}</span></div>
            <div class="summary-difference ${Math.abs(diff) > 0.01 ? 'text-danger' : 'text-success'}">
                <span>Difference:</span><span>${getCurrencySymbol()}${formatCurrency(diff)}</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

function updatePercentageSplit() {
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount').value) || 0;
    const inputs = document.querySelectorAll('.percentage-input');

    inputs.forEach(input => {
        const pct = parseFloat(input.value) || 0;
        const amount = (totalAmount * pct) / 100;
        const row = input.closest('.split-member-row');
        const amountEl = row?.querySelector('.member-amount');
        if (amountEl) amountEl.textContent = `${getCurrencySymbol()}${formatCurrency(amount)}`;
    });

    updateSplitSummary(totalAmount, 'percentage');
}

function updateCustomSplit() {
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount').value) || 0;
    updateSplitSummary(totalAmount, 'custom');
}

async function saveSplitExpense() {
    const title = document.getElementById('splitTitle').value.trim();
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount').value);
    const category = document.getElementById('splitCategory').value;
    const numPeople = parseInt(document.getElementById('numPeople').value) || 1;
    const splitMethod = document.getElementById('splitMethod').value;

    if (!title || !totalAmount || !category) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    const members = [];

    if (splitMethod === 'equal') {
        const perPerson = totalAmount / numPeople;
        for (let i = 0; i < numPeople; i++) {
            members.push({ name: i === 0 ? 'You' : `Person ${i + 1}`, amount: perPerson, isPaid: i === 0 });
        }
    } else if (splitMethod === 'percentage') {
        const inputs = document.querySelectorAll('.percentage-input');
        let totalPct = 0;
        inputs.forEach((input, i) => {
            const pct = parseFloat(input.value) || 0;
            totalPct += pct;
            members.push({ name: i === 0 ? 'You' : `Person ${i + 1}`, amount: (totalAmount * pct) / 100, isPaid: i === 0 });
        });
        if (Math.abs(totalPct - 100) > 0.01) {
            showNotification('Percentages must add up to 100%', 'error');
            return;
        }
    } else if (splitMethod === 'custom') {
        const inputs = document.querySelectorAll('.custom-amount-input');
        let totalEntered = 0;
        inputs.forEach((input, i) => {
            const amt = parseFloat(input.value) || 0;
            totalEntered += amt;
            members.push({ name: i === 0 ? 'You' : `Person ${i + 1}`, amount: amt, isPaid: i === 0 });
        });
        if (Math.abs(totalEntered - totalAmount) > 0.01) {
            showNotification('Custom amounts must add up to total', 'error');
            return;
        }
    }

    if (members.length === 0) {
        showNotification('Please configure split correctly', 'error');
        return;
    }

    try {
        const splitData = { title, totalAmount, category, splitMethod, members };
        let result;

        if (editingSplitExpenseId) {
            result = await apiRequest(`/split/${editingSplitExpenseId}`, {
                method: 'PUT',
                body: JSON.stringify(splitData)
            });
            if (result.success) {
                const index = splitExpenses.findIndex(e => e._id === editingSplitExpenseId);
                if (index !== -1) splitExpenses[index] = result.splitExpense;
                showNotification('Split expense updated', 'success');
            }
        } else {
            result = await apiRequest('/split', {
                method: 'POST',
                body: JSON.stringify(splitData)
            });
            if (result.success) {
                splitExpenses.push(result.splitExpense);
                showNotification('Split expense added', 'success');
            }
        }

        if (result.success) {
            document.getElementById('splitTitle').value = '';
            document.getElementById('splitTotalAmount').value = '';
            document.getElementById('splitCategory').value = '';
            document.getElementById('numPeople').value = '1';
            document.getElementById('splitMethod').value = 'equal';
            editingSplitExpenseId = null;
            const saveBtn = document.querySelector('#splitExpenseModal .btn-primary');
            if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Split Expense';
            closeSplitExpenseModal();
            updateSplitExpensesDisplay();
        }
    } catch {
        showNotification('Failed to save split expense', 'error');
    }
}

function editSplitExpense(id) {
    const expense = splitExpenses.find(e => e._id === id);
    if (!expense) return;

    editingSplitExpenseId = id;
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
                const pct = (member.amount / expense.totalAmount) * 100;
                const inputs = document.querySelectorAll('.percentage-input');
                if (inputs[index]) inputs[index].value = pct.toFixed(2);
            });
            updatePercentageSplit();
        } else if (expense.splitMethod === 'custom') {
            expense.members.forEach((member, index) => {
                const inputs = document.querySelectorAll('.custom-amount-input');
                if (inputs[index]) inputs[index].value = member.amount.toFixed(2);
            });
            updateCustomSplit();
        }
    }, 100);

    const saveBtn = document.querySelector('#splitExpenseModal .btn-primary');
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Split Expense';
}

function updateSplitExpensesDisplay() {
    const container = document.getElementById('splitContainer');
    if (!container) return;

    if (splitExpenses.length === 0) {
        container.innerHTML = '<div class="empty-state">No split expenses</div>';
        return;
    }

    container.innerHTML = splitExpenses.map(e => {
        const paid = e.members.filter(m => m.isPaid).length;
        const total = e.members.length;
        const settled = paid === total;

        return `
            <div class="split-card">
                <div class="split-header">
                    <div>
                        <h3>${e.title}</h3>
                        <p class="split-subtitle">Split among ${total} people • Total: ${getCurrencySymbol()}${formatCurrency(e.totalAmount)}</p>
                    </div>
                    <span class="split-status ${settled ? 'settled' : 'pending'}">${settled ? '✅ Settled' : '⏳ Pending'}</span>
                </div>
                <div class="split-details">
                    <div class="split-members-list">
                        ${e.members.map((member, index) => `
                            <div class="split-member-detail">
                                <div class="member-info">
                                    <span class="member-name">${member.name}</span>
                                    <span class="member-status ${member.isPaid ? 'paid' : 'unpaid'}">${member.isPaid ? 'Paid' : 'Unpaid'}</span>
                                </div>
                                <div class="member-actions">
                                    <span class="member-amount">${getCurrencySymbol()}${formatCurrency(member.amount)}</span>
                                    <button class="${member.isPaid ? 'btn-mark-unpaid' : 'btn-mark-paid'}" 
                                            onclick="toggleMemberPayment('${e._id}', ${index})">
                                        <i class="fas fa-${member.isPaid ? 'times' : 'check'}"></i>
                                        ${member.isPaid ? 'Unpaid' : 'Paid'}
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="split-actions">
                    <button class="btn-secondary" onclick="editSplitExpense('${e._id}')"><i class="fas fa-edit"></i> Edit</button>
                    ${settled ? 
                        `<button class="btn-unsettle" onclick="unsettleSplitExpense('${e._id}')"><i class="fas fa-undo"></i> Unsettle</button>` :
                        `<button class="btn-success" onclick="settleSplitExpense('${e._id}')"><i class="fas fa-check"></i> Settle Up</button>`
                    }
                    <button class="btn-danger" onclick="deleteSplitExpense('${e._id}')"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

async function toggleMemberPayment(expenseId, memberIndex) {
    try {
        const data = await apiRequest(`/split/${expenseId}/member/${memberIndex}/pay`, { method: 'PATCH' });
        if (data.success) {
            const index = splitExpenses.findIndex(e => e._id === expenseId);
            if (index !== -1) splitExpenses[index] = data.splitExpense;
            updateSplitExpensesDisplay();
        }
    } catch {
        showNotification('Failed to update payment status', 'error');
    }
}

async function settleSplitExpense(id) {
    if (!confirm('Mark all members as paid?')) return;

    try {
        const data = await apiRequest(`/split/${id}/settle`, { method: 'PATCH' });
        if (data.success) {
            const index = splitExpenses.findIndex(e => e._id === id);
            if (index !== -1) splitExpenses[index] = data.splitExpense;
            showNotification('Split expense settled', 'success');
            updateSplitExpensesDisplay();
        }
    } catch {
        showNotification('Failed to settle', 'error');
    }
}

async function unsettleSplitExpense(id) {
    if (!confirm('Reset all members to unpaid?')) return;

    try {
        const data = await apiRequest(`/split/${id}/unsettle`, { method: 'PATCH' });
        if (data.success) {
            const index = splitExpenses.findIndex(e => e._id === id);
            if (index !== -1) splitExpenses[index] = data.splitExpense;
            showNotification('Split expense unsettled', 'success');
            updateSplitExpensesDisplay();
        }
    } catch {
        showNotification('Failed to unsettle', 'error');
    }
}

async function deleteSplitExpense(id) {
    if (!confirm('Delete this split expense?')) return;

    try {
        const data = await apiRequest(`/split/${id}`, { method: 'DELETE' });
        if (data.success) {
            splitExpenses = splitExpenses.filter(e => e._id !== id);
            showNotification('Split expense deleted', 'success');
            updateSplitExpensesDisplay();
        }
    } catch {
        showNotification('Failed to delete', 'error');
    }
}

// ===================================================================
// 16. MOBILE MENU
// ===================================================================

function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!toggle || !sidebar || !overlay) return;

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        toggle.classList.add('open');
        const icon = toggle.querySelector('i');
        if (icon) icon.className = 'fas fa-times';
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        toggle.classList.remove('open');
        const icon = toggle.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        if (sidebar.classList.contains('open')) closeSidebar();
        else openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && sidebar.classList.contains('open')) closeSidebar();
    });

    let touchStartX = 0;
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (diff > 80 && sidebar.classList.contains('open')) closeSidebar();
        if (diff < -80 && touchStartX < 40 && !sidebar.classList.contains('open')) openSidebar();
    }, { passive: true });
}

// ===================================================================
// 17. SECTION NAVIGATION
// ===================================================================

function showSection(id) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const section = document.getElementById(id);
    if (section) section.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const map = { 'dashboard': 0, 'expenses': 1, 'analytics': 2, 'recurring': 3, 'bills': 4, 'split': 5 };
    const btns = document.querySelectorAll('.nav-btn');
    if (btns[map[id]]) btns[map[id]].classList.add('active');

    switch (id) {
        case 'dashboard': loadExpenses(); updateDashboard(); break;
        case 'expenses': loadExpenses(); break;
        case 'analytics': setTimeout(() => { loadAnalytics(); updateChartSizes(); }, 100); break;
        case 'recurring': updateRecurringExpensesDisplay(); break;
        case 'bills': updateBillRemindersDisplay(); updateBillCalendar(); break;
        case 'split': updateSplitExpensesDisplay(); break;
    }
}

// ===================================================================
// 18. UPDATE ALL DISPLAYS
// ===================================================================

function updateAllDisplays() {
    loadExpenses();
    updateDashboard();
    loadAnalytics();
    updateRecurringExpensesDisplay();
    updateBillRemindersDisplay();
    updateBillCalendar();
    updateSplitExpensesDisplay();
}

// ===================================================================
// 19. LOGOUT
// ===================================================================

async function logout() {
    if (!confirm('Logout?')) return;
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function switchAccount() {
    if (confirm('Switch account? You will be logged out.')) logout();
}

// ===================================================================
// 20. DATA LOADING
// ===================================================================

async function loadUserData() {
    try {
        const data = await apiRequest('/auth/me');
        if (data.success) {
            currentUser = data.user;
            userId = data.user.id || data.user._id;
            monthlyIncome = data.user.monthlyIncome || 0;
            userCurrency = data.user.currency || 'INR';
            return true;
        }
    } catch {
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
            window.location.href = 'login.html';
        }
        return false;
    }
}

async function loadAllData() {
    try {
        const [exp, rec, bills, split, cats] = await Promise.all([
            apiRequest('/expenses'),
            apiRequest('/recurring'),
            apiRequest('/bills'),
            apiRequest('/split'),
            apiRequest('/categories')
        ]);

        if (exp.success) expenses = exp.expenses || [];
        if (rec.success) recurringExpenses = rec.recurringExpenses || [];
        if (bills.success) billReminders = bills.bills || [];
        if (split.success) splitExpenses = split.splitExpenses || [];
        if (cats.success) customCategories = cats.categories || [];

        return true;
    } catch (error) {
        console.error('Load data error:', error);
        return false;
    }
}

// ===================================================================
// 21. INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('FinFlow initializing...');

    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    setupMobileMenu();

    const userLoaded = await loadUserData();
    if (!userLoaded) return;

    applyTheme();
    updateCurrencyDisplay();

    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('expenseDate').valueAsDate = now;
    document.getElementById('currencySelector').value = userCurrency;

    if (currentUser) {
        document.getElementById('username').innerHTML = `Welcome back, <span class="text-primary">${currentUser.name}</span>`;
        document.getElementById('totalIncome').textContent = formatCurrency(monthlyIncome);
    }

    await loadAllData();

    initializeCategories();
    populateCategoryDropdowns();

    updateAllDisplays();

    // Setup dropdown listeners
    ['category', 'recurringCategory', 'billCategory', 'splitCategory'].forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            dropdown.addEventListener('change', function() {
                if (this.value === '__add_new__') {
                    showAddCategoryModal();
                    setTimeout(() => { this.value = ''; }, 100);
                }
            });
        }
    });

    console.log('FinFlow initialized successfully');
});

// ===================================================================
// 22. EXPOSE GLOBALS
// ===================================================================

window.showSection = showSection;
window.toggleTheme = toggleTheme;
window.changeCurrency = changeCurrency;
window.toggleProfile = toggleProfile;
window.saveProfile = saveProfile;
window.deleteAccount = deleteAccount;
window.addExpense = addExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.showAddCategoryModal = showAddCategoryModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.saveNewCategory = saveNewCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.manageCategories = manageCategories;
window.showManageCategoriesModal = showManageCategoriesModal;
window.closeManageCategoriesModal = closeManageCategoriesModal;
window.showAddRecurringModal = showAddRecurringModal;
window.closeAddRecurringModal = closeAddRecurringModal;
window.saveRecurringExpense = saveRecurringExpense;
window.toggleRecurringExpense = toggleRecurringExpense;
window.deleteRecurringExpense = deleteRecurringExpense;
window.showAddBillModal = showAddBillModal;
window.closeAddBillModal = closeAddBillModal;
window.saveBillReminder = saveBillReminder;
window.markBillAsPaid = markBillAsPaid;
window.deleteBillReminder = deleteBillReminder;
window.showSplitExpenseModal = showSplitExpenseModal;
window.closeSplitExpenseModal = closeSplitExpenseModal;
window.saveSplitExpense = saveSplitExpense;
window.editSplitExpense = editSplitExpense;
window.toggleMemberPayment = toggleMemberPayment;
window.settleSplitExpense = settleSplitExpense;
window.unsettleSplitExpense = unsettleSplitExpense;
window.deleteSplitExpense = deleteSplitExpense;
window.updateSplitCalculation = updateSplitCalculation;
window.updatePercentageSplit = updatePercentageSplit;
window.updateCustomSplit = updateCustomSplit;
window.logout = logout;
window.switchAccount = switchAccount;
window.downloadChart = downloadChart;
window.formatCurrency = formatCurrency;

console.log('FinFlow loaded successfully!');
