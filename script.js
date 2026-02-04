// Add this at the VERY BEGINNING of your existing script.js file

    // Update userId from session
    userId = session.userId;
    
    // Update username display
    const usernameElement = document.getElementById('username');
    if (usernameElement && session.name) {
        usernameElement.innerHTML = `Hello, <span class="text-primary">${session.name}</span>`;
    }
    
    // Load user-specific data
    loadUserData(session.userId);
    
    return true;


function loadUserData(userId) {
    const userPrefix = `user_${userId}_`;
    
    expenses = JSON.parse(localStorage.getItem(`${userPrefix}expenses`)) || [];
    recurringExpenses = JSON.parse(localStorage.getItem(`${userPrefix}recurringExpenses`)) || [];
    billReminders = JSON.parse(localStorage.getItem(`${userPrefix}billReminders`)) || [];
    splitExpenses = JSON.parse(localStorage.getItem(`${userPrefix}splitExpenses`)) || [];
    customCategories = JSON.parse(localStorage.getItem(`${userPrefix}customCategories`)) || [];
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        window.location.href = 'auth.html';
    }
}

function switchAccount() {
    if (confirm('Switch to another account? You will be logged out.')) {
        logout();
    }
}

// Update the DOMContentLoaded event listener to include auth check
document.addEventListener('DOMContentLoaded', function() {
    
 
    // Rest of your existing initialization code...
    applyTheme();
    // ... rest of your existing code
    
    // Add logout button event listener if button exists
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Add switch account button if it exists
    const switchAccountBtn = document.querySelector('.switch-account-btn');
    if (switchAccountBtn) {
        switchAccountBtn.addEventListener('click', switchAccount);
    }
});
// ================= EXPENSE TRACKER SCRIPT =================
// Configuration
let userId = 'user-' + Date.now();
let monthlyIncome = 0;
let userCurrency = 'INR';
let monthlyBudget = 0;

// Data storage
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let recurringExpenses = JSON.parse(localStorage.getItem('recurringExpenses')) || [];
let billReminders = JSON.parse(localStorage.getItem('billReminders')) || [];
let splitExpenses = JSON.parse(localStorage.getItem('splitExpenses')) || [];
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];

// Currency symbols
const CURRENCY_SYMBOLS = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
};

// Default categories with icons
const DEFAULT_CATEGORIES = [
    { name: 'Food', icon: '🍔', color: '#4361ee' },
    { name: 'Transport', icon: '🚗', color: '#3a0ca3' },
    { name: 'Bills', icon: '📄', color: '#7209b7' },
    { name: 'Shopping', icon: '🛍️', color: '#f72585' },
    { name: 'Entertainment', icon: '🎬', color: '#4cc9f0' },
    { name: 'Healthcare', icon: '🏥', color: '#560bad' },
    { name: 'Education', icon: '📚', color: '#b5179e' },
    { name: 'Other', icon: '📦', color: '#480ca8' }
];

// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

// Chart instances
let trendChart = null;
let incomeExpenseSavingsChart = null;
let monthlyTrendChart = null;
let categoryChart = null;
let detailedCategoryChart = null;

// Track category being edited
let editingCategoryIndex = -1;

/* ======================
   INITIALIZATION
====================== */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Expense Tracker Initialized');
    
    // Apply theme
    applyTheme();
    
    // Set current date
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    
    // Set expense date to today
    document.getElementById('expenseDate').valueAsDate = now;
    
    // Initialize currency
    userCurrency = localStorage.getItem('currency') || 'INR';
    document.getElementById('currencySelector').value = userCurrency;
    updateCurrencyDisplay();
    
    // Check for existing user
    checkExistingSession();
    
    // Initialize categories
    initializeCategories();
    
    // Load initial data
    updateAllDisplays();
    
    // Initialize analytics
    loadAnalytics();
    
    // Initialize filters
    initializeFilters();
    
    // Add event listeners for category dropdowns
    setupCategoryDropdownListeners();
    
    console.log('All functions loaded successfully');
});

/* ======================
   SETUP CATEGORY DROPDOWN LISTENERS
====================== */
function setupCategoryDropdownListeners() {
    const dropdownIds = ['category', 'recurringCategory', 'billCategory', 'splitCategory'];
    
    dropdownIds.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            dropdown.addEventListener('change', function() {
                if (this.value === '__add_new__') {
                    this.dataset.previousValue = this.value;
                    showAddCategoryModal();
                    setTimeout(() => {
                        this.value = this.dataset.originalValue || '';
                    }, 100);
                } else {
                    this.dataset.originalValue = this.value;
                }
            });
        }
    });
}

/* ======================
   BASIC UI FUNCTIONS
====================== */
function showSection(id) {
    // Hide all sections
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const section = document.getElementById(id);
    if (section) {
        section.classList.remove('hidden');
    }
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const btnIndex = {
        'dashboard': 0,
        'expenses': 1,
        'analytics': 2,
        'recurring': 3,
        'bills': 4,
        'split': 5
    }[id];
    
    const navButtons = document.querySelectorAll('.nav-btn');
    if (navButtons[btnIndex]) {
        navButtons[btnIndex].classList.add('active');
    }
    
    // Load data for the section
    switch(id) {
        case 'dashboard':
            loadExpenses();
            updateDashboard();
            break;
        case 'expenses':
            loadExpenses();
            break;
        case 'analytics':
            setTimeout(() => {
                loadAnalytics();
            }, 100);
            break;
        case 'recurring':
            updateRecurringExpensesDisplay();
            break;
        case 'bills':
            updateBillRemindersDisplay();
            break;
        case 'split':
            updateSplitExpensesDisplay();
            break;
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    showNotification(`${currentTheme === 'light' ? 'Light' : 'Dark'} mode enabled`, 'info');
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function changeCurrency(currency) {
    userCurrency = currency;
    localStorage.setItem('currency', currency);
    updateCurrencyDisplay();
    showNotification(`Currency changed to ${currency}`, 'success');
    updateAllDisplays();
}

function updateCurrencyDisplay() {
    const symbol = CURRENCY_SYMBOLS[userCurrency];
    document.querySelectorAll('#currencySymbol').forEach(el => {
        el.textContent = symbol;
    });
}

function formatCurrency(amount) {
    if (isNaN(amount)) return '0.00';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/* ======================
   USER MANAGEMENT
====================== */
function checkExistingSession() {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        try {
            const user = JSON.parse(savedUserData);
            userId = user._id || userId;
            monthlyIncome = user.monthlyIncome || 0;
            userCurrency = user.currency || 'INR';
            monthlyBudget = user.monthlyBudget || 0;
            
            document.getElementById('username').innerHTML = `Welcome back, <span class="text-primary">${user.name}</span>`;
            document.getElementById('totalIncome').textContent = formatCurrency(monthlyIncome);
            
            document.getElementById('currencySelector').value = userCurrency;
            updateCurrencyDisplay();
            
            console.log('User session restored:', user);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function toggleProfile() {
    const modal = document.getElementById('profileModal');
    const isHidden = modal.classList.contains('hidden');
    
    if (isHidden) {
        const savedUserData = localStorage.getItem('userData');
        if (savedUserData) {
            try {
                const user = JSON.parse(savedUserData);
                document.getElementById('profileName').value = user.name || '';
                document.getElementById('profileIncome').value = user.monthlyIncome || '';
                document.getElementById('profileCurrency').value = user.currency || 'INR';
                document.getElementById('profileBudget').value = user.monthlyBudget || '';
            } catch (e) {
                document.getElementById('profileName').value = '';
                document.getElementById('profileIncome').value = '';
                document.getElementById('profileCurrency').value = 'INR';
                document.getElementById('profileBudget').value = '';
            }
        }
    }
    
    modal.classList.toggle('hidden');
}

function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const income = document.getElementById('profileIncome').value;
    const currency = document.getElementById('profileCurrency').value;
    const budget = document.getElementById('profileBudget').value;

    if (!name || !income) {
        showNotification('Please enter name and income', 'error');
        return;
    }

    const user = {
        _id: userId,
        name: name,
        monthlyIncome: Number(income),
        currency: currency,
        monthlyBudget: budget ? Number(budget) : 0,
        createdAt: new Date().toISOString()
    };

    monthlyIncome = user.monthlyIncome;
    userCurrency = user.currency;
    monthlyBudget = user.monthlyBudget;
    
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('currency', userCurrency);

    document.getElementById('username').innerHTML = `Hello, <span class="text-primary">${user.name}</span>`;
    document.getElementById('totalIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('currencySelector').value = userCurrency;
    updateCurrencyDisplay();
    
    showNotification('Profile saved successfully!', 'success');
    toggleProfile();
    
    showSection('dashboard');
}

/* ======================
   CATEGORY MANAGEMENT
====================== */
function initializeCategories() {
    customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
    updateCategoryDropdowns();
}

function updateCategoryDropdowns() {
    const categoryDropdowns = [
        document.getElementById('category'),
        document.getElementById('recurringCategory'),
        document.getElementById('billCategory'),
        document.getElementById('splitCategory')
    ];
    
    const allCategories = [
        ...DEFAULT_CATEGORIES.map(cat => ({ 
            name: cat.name, 
            icon: cat.icon,
            isCustom: false 
        })),
        ...customCategories.map(cat => ({ 
            name: cat.name, 
            icon: cat.icon || '📝',
            color: cat.color || getRandomColor(),
            isCustom: true 
        }))
    ];
    
    categoryDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        
        const currentValue = dropdown.value;
        const firstOption = dropdown.options[0];
        dropdown.innerHTML = '';
        if (firstOption) dropdown.appendChild(firstOption);
        
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = `${category.icon} ${category.name}`;
            option.dataset.isCustom = category.isCustom;
            dropdown.appendChild(option);
        });
        
        const addNewOption = document.createElement('option');
        addNewOption.value = '__add_new__';
        addNewOption.textContent = '➕ Add New Category';
        addNewOption.className = 'add-category-option';
        dropdown.appendChild(addNewOption);
        
        if (currentValue && currentValue !== '__add_new__') {
            dropdown.value = currentValue;
        }
        
        dropdown.dataset.originalValue = dropdown.value;
    });
    
    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory) {
        filterCategory.innerHTML = '<option value="">All Categories</option>';
        
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            filterCategory.appendChild(option);
        });
    }
}

function showAddCategoryModal(categoryToEdit = null) {
    const modal = document.getElementById('addCategoryModal');
    if (!modal) {
        createCategoryModal();
    }
    
    document.getElementById('addCategoryModal').classList.remove('hidden');
    
    if (categoryToEdit) {
        editingCategoryIndex = customCategories.findIndex(cat => cat.name === categoryToEdit.name);
        
        document.querySelector('#addCategoryModal .modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Edit Category';
        document.getElementById('newCategoryName').value = categoryToEdit.name;
        document.getElementById('newCategoryIcon').value = categoryToEdit.icon || '📝';
        document.getElementById('newCategoryColor').value = categoryToEdit.color || getRandomColor();
        
        const saveButton = document.querySelector('#addCategoryModal .btn-primary');
        saveButton.innerHTML = '<i class="fas fa-save"></i> Update Category';
        saveButton.onclick = updateExistingCategory;
    } else {
        editingCategoryIndex = -1;
        
        document.querySelector('#addCategoryModal .modal-header h3').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Category';
        document.getElementById('newCategoryName').value = '';
        document.getElementById('newCategoryIcon').value = '📝';
        document.getElementById('newCategoryColor').value = getRandomColor();
        
        const saveButton = document.querySelector('#addCategoryModal .btn-primary');
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Category';
        saveButton.onclick = saveNewCategory;
    }
}

function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
        '#073B4C', '#EF476F', '#7209B7', '#3A86FF', '#FB5607'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createCategoryModal() {
    const modalHTML = `
        <div id="addCategoryModal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> Add New Category</h3>
                    <button class="modal-close" onclick="closeAddCategoryModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="category-form">
                        <div class="form-group">
                            <label for="newCategoryName"><i class="fas fa-tag"></i> Category Name</label>
                            <input id="newCategoryName" placeholder="e.g., Groceries, Travel, etc." />
                        </div>
                        
                        <div class="form-group">
                            <label for="newCategoryIcon"><i class="fas fa-icons"></i> Icon</label>
                            <select id="newCategoryIcon">
                                <option value="📝">📝 Default</option>
                                <option value="🛒">🛒 Groceries</option>
                                <option value="✈️">✈️ Travel</option>
                                <option value="🏠">🏠 Rent</option>
                                <option value="💰">💰 Salary</option>
                                <option value="🍽️">🍽️ Dining</option>
                                <option value="🏋️">🏋️ Fitness</option>
                                <option value="🎁">🎁 Gifts</option>
                                <option value="💼">💼 Business</option>
                                <option value="🐾">🐾 Pets</option>
                                <option value="🎨">🎨 Hobbies</option>
                                <option value="🚗">🚗 Car</option>
                                <option value="📱">📱 Electronics</option>
                                <option value="👕">👕 Clothing</option>
                                <option value="💊">💊 Medicine</option>
                                <option value="🎓">🎓 Courses</option>
                                <option value="🎪">🎪 Events</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="newCategoryColor"><i class="fas fa-palette"></i> Color</label>
                            <input type="color" id="newCategoryColor" value="${getRandomColor()}">
                        </div>
                        
                        <div class="modal-actions">
                            <button class="btn-secondary" onclick="closeAddCategoryModal()">Cancel</button>
                            <button class="btn-primary" onclick="saveNewCategory()">
                                <i class="fas fa-save"></i> Save Category
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editingCategoryIndex = -1;
}

function saveNewCategory() {
    const categoryName = document.getElementById('newCategoryName').value.trim();
    const categoryIcon = document.getElementById('newCategoryIcon').value || '📝';
    const categoryColor = document.getElementById('newCategoryColor').value || getRandomColor();
    
    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    const allCategories = [
        ...DEFAULT_CATEGORIES.map(c => c.name.toLowerCase()),
        ...customCategories.map(c => c.name.toLowerCase())
    ];
    
    if (allCategories.includes(categoryName.toLowerCase())) {
        showNotification('Category already exists!', 'error');
        return;
    }
    
    customCategories.push({
        name: categoryName,
        icon: categoryIcon,
        color: categoryColor
    });
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    
    updateCategoryDropdowns();
    closeAddCategoryModal();
    showNotification(`Category "${categoryName}" added successfully!`, 'success');
    updateManageCategoriesModal();
}

function updateExistingCategory() {
    if (editingCategoryIndex === -1) return;
    
    const categoryName = document.getElementById('newCategoryName').value.trim();
    const categoryIcon = document.getElementById('newCategoryIcon').value || '📝';
    const categoryColor = document.getElementById('newCategoryColor').value || getRandomColor();
    
    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    const oldCategoryName = customCategories[editingCategoryIndex].name;
    
    const allCategories = [
        ...DEFAULT_CATEGORIES.map(c => c.name.toLowerCase()),
        ...customCategories.map((c, index) => index === editingCategoryIndex ? '' : c.name.toLowerCase())
    ];
    
    if (allCategories.includes(categoryName.toLowerCase())) {
        showNotification('Category already exists!', 'error');
        return;
    }
    
    customCategories[editingCategoryIndex] = {
        name: categoryName,
        icon: categoryIcon,
        color: categoryColor
    };
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    
    let hasUpdatedExpenses = false;
    
    expenses.forEach(expense => {
        if (expense.category === oldCategoryName) {
            expense.category = categoryName;
            hasUpdatedExpenses = true;
        }
    });
    if (hasUpdatedExpenses) {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }
    
    recurringExpenses.forEach(expense => {
        if (expense.category === oldCategoryName) {
            expense.category = categoryName;
        }
    });
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
    
    billReminders.forEach(bill => {
        if (bill.category === oldCategoryName) {
            bill.category = categoryName;
        }
    });
    localStorage.setItem('billReminders', JSON.stringify(billReminders));
    
    splitExpenses.forEach(expense => {
        if (expense.category === oldCategoryName) {
            expense.category = categoryName;
        }
    });
    localStorage.setItem('splitExpenses', JSON.stringify(splitExpenses));
    
    updateCategoryDropdowns();
    closeAddCategoryModal();
    showNotification(`Category "${oldCategoryName}" updated to "${categoryName}"!`, 'success');
    updateAllDisplays();
    updateManageCategoriesModal();
}

function deleteCustomCategory(categoryName) {
    if (!confirm(`Delete category "${categoryName}"? 
    
This will:
1. Delete the category from your custom categories
2. Change all expenses in this category to "Other"
3. Update recurring expenses, bill reminders, and split expenses to use "Other" category

Are you sure you want to delete this category?`)) {
        return;
    }
    
    customCategories = customCategories.filter(cat => cat.name !== categoryName);
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    
    let updatedCount = 0;
    
    expenses.forEach(expense => {
        if (expense.category === categoryName) {
            expense.category = 'Other';
            updatedCount++;
        }
    });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    recurringExpenses.forEach(expense => {
        if (expense.category === categoryName) {
            expense.category = 'Other';
        }
    });
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
    
    billReminders.forEach(bill => {
        if (bill.category === categoryName) {
            bill.category = 'Other';
        }
    });
    localStorage.setItem('billReminders', JSON.stringify(billReminders));
    
    splitExpenses.forEach(expense => {
        if (expense.category === categoryName) {
            expense.category = 'Other';
        }
    });
    localStorage.setItem('splitExpenses', JSON.stringify(splitExpenses));
    
    updateCategoryDropdowns();
    
    showNotification(`Category "${categoryName}" deleted. ${updatedCount} expense(s) moved to "Other" category.`, 'success');
    updateAllDisplays();
    updateManageCategoriesModal();
}

function editCustomCategory(categoryName) {
    const category = customCategories.find(cat => cat.name === categoryName);
    if (!category) {
        showNotification('Category not found!', 'error');
        return;
    }
    
    closeManageCategoriesModal();
    
    setTimeout(() => {
        showAddCategoryModal(category);
    }, 100);
}

function manageCategories() {
    const modal = document.getElementById('manageCategoriesModal');
    if (!modal) {
        createManageCategoriesModal();
    } else {
        updateManageCategoriesModal();
        modal.classList.remove('hidden');
    }
}

function createManageCategoriesModal() {
    const modalHTML = `
        <div id="manageCategoriesModal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-tags"></i> Manage Categories</h3>
                    <button class="modal-close" onclick="closeManageCategoriesModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="categories-management">
                        <div class="categories-section">
                            <h4><i class="fas fa-star"></i> Default Categories</h4>
                            <div id="defaultCategoriesList" class="categories-list">
                                ${DEFAULT_CATEGORIES.map(cat => `
                                    <div class="category-item">
                                        <span class="category-icon">${cat.icon}</span>
                                        <span class="category-name">${cat.name}</span>
                                        <span class="category-badge" style="background-color: ${cat.color}20; color: ${cat.color}">Default</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="categories-section">
                            <div class="section-header">
                                <h4><i class="fas fa-user-edit"></i> Your Custom Categories</h4>
                                <button class="btn-text" onclick="showAddCategoryModal()">
                                    <i class="fas fa-plus"></i> Add New
                                </button>
                            </div>
                            <div id="customCategoriesList" class="categories-list">
                                <!-- Custom categories will be populated here -->
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button class="btn-secondary" onclick="closeManageCategoriesModal()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    updateManageCategoriesModal();
}

function updateManageCategoriesModal() {
    const customCategoriesList = document.getElementById('customCategoriesList');
    if (!customCategoriesList) return;
    
    if (customCategories.length === 0) {
        customCategoriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <p>No custom categories yet</p>
                <p class="text-muted">Add your first custom category</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    customCategories.forEach(category => {
        const expenseCount = expenses.filter(exp => exp.category === category.name).length;
        const recurringCount = recurringExpenses.filter(exp => exp.category === category.name).length;
        const billCount = billReminders.filter(bill => bill.category === category.name).length;
        const splitCount = splitExpenses.filter(exp => exp.category === category.name).length;
        const totalCount = expenseCount + recurringCount + billCount + splitCount;
        
        html += `
            <div class="category-item">
                <span class="category-icon" style="color: ${category.color}">${category.icon || '📝'}</span>
                <div class="category-info">
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">${totalCount} item${totalCount !== 1 ? 's' : ''} (${expenseCount} expense${expenseCount !== 1 ? 's' : ''})</span>
                </div>
                <div class="category-actions">
                    <button class="btn-icon edit" onclick="editCustomCategory('${category.name}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteCustomCategory('${category.name}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    customCategoriesList.innerHTML = html;
}

function closeManageCategoriesModal() {
    const modal = document.getElementById('manageCategoriesModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/* ======================
   EXPENSE MANAGEMENT
====================== */
function addExpense() {
    const title = document.getElementById('title').value.trim();
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('expenseDate').value;

    if (!title || !amount || !category || category === '__add_new__') {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }

    const expense = {
        _id: 'exp-' + Date.now(),
        userId: userId,
        title: title,
        amount: Number(amount),
        category: category,
        date: date || new Date().toISOString(),
        createdAt: new Date().toISOString()
    };

    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    document.getElementById('title').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('expenseDate').valueAsDate = new Date();

    showNotification('Expense added successfully!', 'success');
    loadExpenses();
    updateDashboard();
    loadAnalytics();
}

function loadExpenses() {
    // Get filter values
    const filterCategory = document.getElementById('filterCategory')?.value || '';
    const filterMonth = document.getElementById('filterMonth')?.value || '';
    
    let filteredExpenses = expenses;
    
    if (filterCategory) {
        filteredExpenses = filteredExpenses.filter(exp => exp.category === filterCategory);
    }
    
    if (filterMonth) {
        filteredExpenses = filteredExpenses.filter(exp => {
            const expDate = new Date(exp.date);
            const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
            return expMonth === filterMonth;
        });
    }

    renderExpenseList(filteredExpenses);
}

function renderExpenseList(expenses) {
    const list = document.getElementById('expenseList');
    const totalDisplay = document.getElementById('expenseTotal');
    
    if (!list || !totalDisplay) return;

    if (expenses.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No expenses found</p>
                <p class="text-muted">Start by adding your first expense</p>
            </div>
        `;
        totalDisplay.textContent = `${CURRENCY_SYMBOLS[userCurrency]}0.00`;
        return;
    }

    let total = 0;
    let html = '';
    
    expenses.forEach(expense => {
        total += expense.amount;
        const date = new Date(expense.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        html += `
            <div class="expense-item">
                <div class="expense-info">
                    <strong>${expense.title}</strong>
                    <div class="expense-meta">
                        <span class="expense-category">
                            ${getCategoryIcon(expense.category)} ${expense.category}
                        </span>
                        <span class="text-muted">• ${date}</span>
                    </div>
                </div>
                <div class="expense-amount text-danger">
                    ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(expense.amount)}
                </div>
                <div class="expense-actions">
                    <button class="action-btn" onclick="editExpense('${expense._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteExpense('${expense._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
    totalDisplay.textContent = `${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(total)}`;
}

function editExpense(id) {
    const expense = expenses.find(exp => exp._id === id);
    if (!expense) return;
    
    document.getElementById('title').value = expense.title;
    document.getElementById('amount').value = expense.amount;
    
    const categorySelect = document.getElementById('category');
    let categoryExists = false;
    for (let i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].value === expense.category) {
            categoryExists = true;
            break;
        }
    }
    
    if (!categoryExists && expense.category !== '__add_new__') {
        const categoryExistsInCustom = customCategories.some(cat => cat.name === expense.category);
        if (!categoryExistsInCustom) {
            customCategories.push({
                name: expense.category,
                icon: '📝',
                color: getRandomColor()
            });
            localStorage.setItem('customCategories', JSON.stringify(customCategories));
            updateCategoryDropdowns();
        }
    }
    
    categorySelect.value = expense.category;
    document.getElementById('expenseDate').value = expense.date.split('T')[0];
    
    expenses = expenses.filter(exp => exp._id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    showNotification('Expense loaded for editing', 'info');
    loadExpenses();
}

function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    expenses = expenses.filter(exp => exp._id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    showNotification('Expense deleted successfully', 'success');
    loadExpenses();
    updateDashboard();
    loadAnalytics();
}

function getCategoryIcon(category) {
    const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.name === category);
    if (defaultCategory) return defaultCategory.icon;
    
    const customCategory = customCategories.find(cat => cat.name === category);
    if (customCategory && customCategory.icon) return customCategory.icon;
    
    return '📝';
}

function getCategoryColor(category) {
    const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.name === category);
    if (defaultCategory) return defaultCategory.color;
    
    const customCategory = customCategories.find(cat => cat.name === category);
    if (customCategory && customCategory.color) return customCategory.color;
    
    return stringToColor(category);
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
}

/* ======================
   DASHBOARD UPDATES
====================== */
function updateDashboard() {
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = monthlyIncome - totalExpense;
    const savingsRate = monthlyIncome > 0 ? ((balance / monthlyIncome) * 100).toFixed(1) : 0;

    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('savingsRate').textContent = `${savingsRate}%`;

    const savingsElement = document.getElementById('savingsRate');
    savingsElement.className = 'stat-value ' + (
        savingsRate >= 20 ? 'text-success' :
        savingsRate >= 10 ? 'text-warning' : 'text-danger'
    );

    updateRecentExpenses(expenses);
    updateDashboardCharts();
}

function updateRecentExpenses(expenses = []) {
    const recentExpensesList = document.getElementById('recentExpenseList');
    if (!recentExpensesList) return;

    const recentExpenses = expenses.slice(-5).reverse();
    
    if (recentExpenses.length === 0) {
        recentExpensesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No expenses yet</p>
                <p class="text-muted">Add your first expense to get started</p>
            </div>
        `;
        return;
    }

    let html = '';
    recentExpenses.forEach(expense => {
        const date = new Date(expense.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        html += `
            <div class="expense-item">
                <div class="expense-info">
                    <strong>${expense.title}</strong>
                    <div class="expense-meta">
                        <span class="expense-category">${getCategoryIcon(expense.category)} ${expense.category}</span>
                        <span class="text-muted">• ${date}</span>
                    </div>
                </div>
                <div class="expense-amount text-danger">
                    ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(expense.amount)}
                </div>
            </div>
        `;
    });

    recentExpensesList.innerHTML = html;
}

/* ======================
   DASHBOARD CHARTS
====================== */
function updateDashboardCharts() {
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const savings = Math.max(0, monthlyIncome - totalExpense);
    
    updateTrendChart();
    updateIncomeExpenseSavingsChart(monthlyIncome, totalExpense, savings);
}

function updateTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (expenses.length === 0) {
        initializeEmptyTrendChart();
        return;
    }

    const now = new Date();
    const labels = [];
    const expenseData = [];
    const incomeData = [];
    const savingsData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        labels.push(monthName);
        
        const monthExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === date.getMonth() && 
                   expDate.getFullYear() === date.getFullYear();
        });
        
        const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        expenseData.push(monthTotal);
        incomeData.push(monthlyIncome);
        savingsData.push(Math.max(0, monthlyIncome - monthTotal));
    }

    if (trendChart) {
        trendChart.destroy();
    }

    try {
        trendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: '#36A2EB',
                        borderWidth: 1,
                        borderRadius: 5
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: '#FF6384',
                        borderWidth: 1,
                        borderRadius: 5
                    },
                    {
                        label: 'Savings',
                        data: savingsData,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: '#4BC0C0',
                        borderWidth: 1,
                        borderRadius: 5
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
                    title: {
                        display: true,
                        text: 'Monthly Income vs Expenses vs Savings (Last 6 Months)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += CURRENCY_SYMBOLS[userCurrency] + formatCurrency(context.raw);
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return CURRENCY_SYMBOLS[userCurrency] + value.toLocaleString();
                            }
                        },
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating trend chart:', error);
    }
}

function updateIncomeExpenseSavingsChart(income, expenses, savings) {
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;
    
    if (incomeExpenseSavingsChart) {
        incomeExpenseSavingsChart.destroy();
    }

    try {
        incomeExpenseSavingsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses', 'Savings'],
                datasets: [{
                    label: 'Amount',
                    data: [income, expenses, savings],
                    backgroundColor: [
                        '#36A2EB',
                        '#FF6384',
                        '#4BC0C0'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Income vs Expenses vs Savings',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    } catch (error) {
        console.error('Error creating income vs expenses vs savings chart:', error);
    }
}

function initializeEmptyTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    try {
        trendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)'
                    },
                    {
                        label: 'Expenses',
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)'
                    },
                    {
                        label: 'Savings',
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)'
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
                    title: {
                        display: true,
                        text: 'Monthly Income vs Expenses vs Savings',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return CURRENCY_SYMBOLS[userCurrency] + value;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating empty trend chart:', error);
    }
}

/* ======================
   ANALYTICS FUNCTIONS
====================== */
function loadAnalytics() {
    if (expenses.length === 0 || monthlyIncome === 0) {
        initializeEmptyAnalyticsCharts();
        return;
    }

    const period = document.getElementById('analyticsPeriod')?.value || 'month';
    updateAnalyticsCharts(period);
}

function updateAnalyticsCharts(period) {
    if (expenses.length === 0) {
        initializeEmptyAnalyticsCharts();
        return;
    }
    
    const now = new Date();
    let filteredExpenses = [];
    let labels = [];
    let expenseData = [];
    let incomeData = [];
    let savingsData = [];
    
    switch(period) {
        case 'month':
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            filteredExpenses = expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            });
            
            const weeklyTotals = {1: 0, 2: 0, 3: 0, 4: 0};
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            
            filteredExpenses.forEach(exp => {
                const expDate = new Date(exp.date);
                const weekNumber = Math.ceil(expDate.getDate() / 7);
                if (weekNumber >= 1 && weekNumber <= 4) {
                    weeklyTotals[weekNumber] += exp.amount;
                }
            });
            
            expenseData = labels.map((_, index) => weeklyTotals[index + 1]);
            incomeData = labels.map(() => monthlyIncome / 4);
            savingsData = labels.map((_, index) => (monthlyIncome / 4) - expenseData[index]);
            
            updateMonthlyTrendChart(labels, incomeData, expenseData, savingsData, 'Weekly');
            break;
            
        case 'quarter':
            const quarterAgo = new Date();
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            filteredExpenses = expenses.filter(exp => new Date(exp.date) >= quarterAgo);
            
            const monthlyTotals = {};
            const monthLabels = [];
            
            for (let i = 0; i < 3; i++) {
                const date = new Date();
                date.setMonth(date.getMonth() - (2 - i));
                const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                monthlyTotals[monthName] = 0;
                monthLabels.push(monthName);
            }
            
            labels = monthLabels;
            expenseData = labels.map(label => monthlyTotals[label]);
            incomeData = labels.map(() => monthlyIncome);
            savingsData = labels.map((_, index) => monthlyIncome - expenseData[index]);
            
            updateMonthlyTrendChart(labels, incomeData, expenseData, savingsData, 'Monthly');
            break;
            
        case 'year':
            const yearAgo = new Date();
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            filteredExpenses = expenses.filter(exp => new Date(exp.date) >= yearAgo);
            
            const yearlyMonthlyTotals = {};
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            monthOrder.forEach(month => {
                yearlyMonthlyTotals[month] = 0;
            });
            
            filteredExpenses.forEach(exp => {
                const date = new Date(exp.date);
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                if (yearlyMonthlyTotals[monthName] !== undefined) {
                    yearlyMonthlyTotals[monthName] += exp.amount;
                }
            });
            
            labels = monthOrder;
            expenseData = labels.map(label => yearlyMonthlyTotals[label]);
            incomeData = labels.map(() => monthlyIncome);
            savingsData = labels.map((_, index) => monthlyIncome - expenseData[index]);
            
            updateMonthlyTrendChart(labels, incomeData, expenseData, savingsData, 'Monthly');
            break;
    }
    
    if (filteredExpenses.length > 0) {
        updateCategoryChart(filteredExpenses);
        updateDetailedCategoryChart(filteredExpenses);
    } else {
        updateCategoryChart(expenses);
        updateDetailedCategoryChart(expenses);
    }
}

function updateMonthlyTrendChart(labels, incomeData, expenseData, savingsData, timeLabel) {
    const ctx = document.getElementById('monthlyTrendChart');
    if (!ctx) return;

    if (monthlyTrendChart) {
        monthlyTrendChart.destroy();
    }

    try {
        monthlyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    },
                    {
                        label: 'Savings',
                        data: savingsData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6
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
                    title: {
                        display: true,
                        text: `Income vs Expenses vs Savings Trend (${timeLabel})`,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += CURRENCY_SYMBOLS[userCurrency] + formatCurrency(context.raw);
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return CURRENCY_SYMBOLS[userCurrency] + value;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: timeLabel
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating monthly trend chart:', error);
    }
}

function updateCategoryChart(expenses) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const categories = Object.keys(categoryTotals);
    const data = categories.map(cat => categoryTotals[cat]);
    const colors = categories.map(category => getCategoryColor(category));

    if (categoryChart) {
        categoryChart.destroy();
    }

    try {
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1,
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
                    title: {
                        display: true,
                        text: 'Expense Distribution by Category'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating category chart:', error);
    }
}

function updateDetailedCategoryChart(expenses) {
    const ctx = document.getElementById('detailedCategoryChart');
    if (!ctx) return;

    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const categories = Object.keys(categoryTotals);
    const data = categories.map(cat => categoryTotals[cat]);

    const sortedData = categories
        .map((cat, index) => ({ category: cat, amount: data[index] }))
        .sort((a, b) => b.amount - a.amount);

    const sortedCategories = sortedData.map(item => item.category);
    const sortedAmounts = sortedData.map(item => item.amount);

    if (detailedCategoryChart) {
        detailedCategoryChart.destroy();
    }

    try {
        detailedCategoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedCategories,
                datasets: [{
                    label: 'Amount Spent',
                    data: sortedAmounts,
                    backgroundColor: sortedCategories.map(category => getCategoryColor(category)),
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Expenses by Category (Sorted)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return CURRENCY_SYMBOLS[userCurrency] + value;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Category'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating detailed category chart:', error);
    }
}

function initializeEmptyAnalyticsCharts() {
    const chartIds = ['monthlyTrendChart', 'categoryChart', 'detailedCategoryChart'];
    
    chartIds.forEach(chartId => {
        const ctx = document.getElementById(chartId);
        if (!ctx) return;
        
        if (chartId === 'monthlyTrendChart' && monthlyTrendChart) {
            monthlyTrendChart.destroy();
            monthlyTrendChart = null;
        }
        if (chartId === 'categoryChart' && categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
        }
        if (chartId === 'detailedCategoryChart' && detailedCategoryChart) {
            detailedCategoryChart.destroy();
            detailedCategoryChart = null;
        }

        let chartType = 'line';
        let data = {
            labels: ['No data'],
            datasets: [{
                label: 'No data available',
                data: [0],
                backgroundColor: 'rgba(200, 200, 200, 0.2)',
                borderColor: 'rgba(200, 200, 200, 0.5)'
            }]
        };
        
        if (chartId === 'monthlyTrendChart') {
            chartType = 'line';
            data = {
                labels: ['No data'],
                datasets: [
                    {
                        label: 'Income',
                        data: [0],
                        borderColor: 'rgba(16, 185, 129, 0.5)'
                    },
                    {
                        label: 'Expenses',
                        data: [0],
                        borderColor: 'rgba(239, 68, 68, 0.5)'
                    },
                    {
                        label: 'Savings',
                        data: [0],
                        borderColor: 'rgba(59, 130, 246, 0.5)'
                    }
                ]
            };
        } else if (chartId === 'categoryChart') {
            chartType = 'doughnut';
            data = {
                labels: ['No data'],
                datasets: [{
                    data: [100],
                    backgroundColor: ['rgba(200, 200, 200, 0.2)']
                }]
            };
        } else if (chartId === 'detailedCategoryChart') {
            chartType = 'bar';
            data = {
                labels: ['No data'],
                datasets: [{
                    label: 'Amount Spent',
                    data: [0],
                    backgroundColor: 'rgba(200, 200, 200, 0.2)'
                }]
            };
        }

        try {
            const chart = new Chart(ctx, {
                type: chartType,
                data: data,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: chartId !== 'detailedCategoryChart'
                        },
                        title: {
                            display: true,
                            text: chartId === 'monthlyTrendChart' ? 'Income vs Expenses vs Savings Trend' :
                                  chartId === 'categoryChart' ? 'Expense Distribution by Category' :
                                  'Expenses by Category'
                        }
                    },
                    scales: chartId !== 'categoryChart' && chartId !== 'detailedCategoryChart' ? {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return CURRENCY_SYMBOLS[userCurrency] + value;
                                }
                            }
                        }
                    } : undefined
                }
            });
            
            if (chartId === 'monthlyTrendChart') monthlyTrendChart = chart;
            if (chartId === 'categoryChart') categoryChart = chart;
            if (chartId === 'detailedCategoryChart') detailedCategoryChart = chart;
        } catch (error) {
            console.error(`Error creating empty chart ${chartId}:`, error);
        }
    });
}

function downloadChart(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showNotification('Chart downloaded successfully', 'success');
}

/* ======================
   FILTERS
====================== */
function initializeFilters() {
    const filterMonth = document.getElementById('filterMonth');
    if (filterMonth) {
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            filterMonth.appendChild(option);
        }
    }
}

/* ======================
   RECURRING EXPENSES
====================== */
function showAddRecurringModal() {
    document.getElementById('addRecurringModal').classList.remove('hidden');
    document.getElementById('recurringStartDate').valueAsDate = new Date();
}

function closeAddRecurringModal() {
    document.getElementById('addRecurringModal').classList.add('hidden');
}

function saveRecurringExpense() {
    const title = document.getElementById('recurringTitle').value.trim();
    const amount = parseFloat(document.getElementById('recurringAmount').value);
    const category = document.getElementById('recurringCategory').value;
    const frequency = document.getElementById('recurringFrequency').value;
    const startDate = document.getElementById('recurringStartDate').value;

    if (!title || isNaN(amount) || !category || category === '__add_new__' || !frequency || !startDate) {
        showNotification('Please fill all fields correctly', 'error');
        return;
    }

    const expense = {
        id: Date.now().toString(),
        title: title,
        amount: amount,
        category: category,
        frequency: frequency,
        startDate: startDate,
        nextDue: calculateNextDueDate(startDate, frequency),
        createdAt: new Date().toISOString(),
        isActive: true
    };

    recurringExpenses.push(expense);
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
    
    closeAddRecurringModal();
    showNotification('Recurring expense added successfully', 'success');
    updateRecurringExpensesDisplay();
}

function calculateNextDueDate(startDate, frequency) {
    const date = new Date(startDate);
    const now = new Date();
    
    while (date <= now) {
        switch(frequency) {
            case 'daily': date.setDate(date.getDate() + 1); break;
            case 'weekly': date.setDate(date.getDate() + 7); break;
            case 'monthly': date.setMonth(date.getMonth() + 1); break;
            case 'quarterly': date.setMonth(date.getMonth() + 3); break;
            case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
        }
    }
    
    return date.toISOString().split('T')[0];
}

function updateRecurringExpensesDisplay() {
    const container = document.getElementById('recurringGrid');
    if (!container) return;

    if (recurringExpenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-redo"></i>
                <p>No recurring expenses</p>
                <p class="text-muted">Add your first recurring expense</p>
            </div>
        `;
        return;
    }

    let html = '';
    recurringExpenses.forEach(expense => {
        const nextDue = new Date(expense.nextDue);
        const today = new Date();
        const daysUntilDue = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
        const progress = Math.max(0, Math.min(100, (30 - daysUntilDue) / 30 * 100));
        
        html += `
            <div class="recurring-card">
                <div class="recurring-header">
                    <h3>${expense.title}</h3>
                    <span class="recurring-badge">${expense.frequency}</span>
                </div>
                <div class="recurring-body">
                    <div class="recurring-info">
                        <p><i class="fas fa-rupee-sign"></i> <strong>Amount:</strong> ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(expense.amount)}</p>
                        <p><i class="fas fa-calendar"></i> <strong>Next Due:</strong> ${formatDate(expense.nextDue)}</p>
                        <p><i class="fas fa-redo"></i> <strong>Frequency:</strong> ${expense.frequency}</p>
                        <p><i class="fas fa-tag"></i> <strong>Category:</strong> ${getCategoryIcon(expense.category)} ${expense.category}</p>
                    </div>
                    <div class="recurring-actions">
                        <button class="btn-icon" onclick="editRecurringExpense('${expense.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteRecurringExpense('${expense.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-icon success" onclick="markRecurringPaid('${expense.id}')" title="Mark as Paid">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
                <div class="recurring-footer">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${daysUntilDue <= 0 ? 'Due today' : `Due in ${daysUntilDue} days`}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function editRecurringExpense(id) {
    const expense = recurringExpenses.find(e => e.id === id);
    if (!expense) return;
    
    document.getElementById('recurringTitle').value = expense.title;
    document.getElementById('recurringAmount').value = expense.amount;
    document.getElementById('recurringCategory').value = expense.category;
    document.getElementById('recurringFrequency').value = expense.frequency;
    document.getElementById('recurringStartDate').value = expense.startDate;
    
    recurringExpenses = recurringExpenses.filter(e => e.id !== id);
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
    
    showAddRecurringModal();
    showNotification('Recurring expense loaded for editing', 'info');
}

function markRecurringPaid(id) {
    const expense = recurringExpenses.find(e => e.id === id);
    if (!expense) return;

    const newExpense = {
        _id: 'exp-' + Date.now(),
        userId: userId,
        title: expense.title + ' (Recurring)',
        amount: expense.amount,
        category: expense.category,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    expense.nextDue = calculateNextDueDate(expense.nextDue, expense.frequency);
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
    
    showNotification('Recurring expense marked as paid', 'success');
    updateRecurringExpensesDisplay();
    loadExpenses();
    updateDashboard();
    loadAnalytics();
}

function deleteRecurringExpense(id) {
    if (!confirm('Delete this recurring expense?')) return;
    
    recurringExpenses = recurringExpenses.filter(e => e.id !== id);
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
    
    showNotification('Recurring expense deleted', 'success');
    updateRecurringExpensesDisplay();
}

/* ======================
   BILL REMINDERS
====================== */
function showAddBillModal() {
    document.getElementById('addBillModal').classList.remove('hidden');
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    document.getElementById('billDueDate').valueAsDate = nextMonth;
}

function closeAddBillModal() {
    document.getElementById('addBillModal').classList.add('hidden');
}

function saveBillReminder() {
    const title = document.getElementById('billTitle').value.trim();
    const amount = parseFloat(document.getElementById('billAmount').value);
    const dueDate = document.getElementById('billDueDate').value;
    const category = document.getElementById('billCategory').value;
    const reminderDays = parseInt(document.getElementById('billReminderDays').value);

    if (!title || isNaN(amount) || !dueDate || !category || category === '__add_new__') {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    const bill = {
        id: Date.now().toString(),
        title: title,
        amount: amount,
        dueDate: dueDate,
        category: category,
        reminderDays: reminderDays,
        createdAt: new Date().toISOString(),
        isPaid: false
    };

    billReminders.push(bill);
    localStorage.setItem('billReminders', JSON.stringify(billReminders));
    
    closeAddBillModal();
    showNotification('Bill reminder added successfully', 'success');
    updateBillRemindersDisplay();
}

function updateBillRemindersDisplay() {
    const container = document.getElementById('remindersContainer');
    if (!container) return;

    const today = new Date();
    const sortedBills = billReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    if (sortedBills.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell"></i>
                <p>No bill reminders</p>
                <p class="text-muted">Add your first bill reminder</p>
            </div>
        `;
        return;
    }

    let html = '';
    sortedBills.forEach(bill => {
        const dueDate = new Date(bill.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let status = 'upcoming';
        let statusText = '';
        
        if (bill.isPaid) {
            status = 'paid';
            statusText = 'Paid';
        } else if (daysUntilDue < 0) {
            status = 'overdue';
            statusText = 'Overdue';
        } else if (daysUntilDue <= 3) {
            status = 'upcoming';
            statusText = 'Due Soon';
        } else {
            status = 'upcoming';
            statusText = 'Upcoming';
        }

        html += `
            <div class="reminder-card ${status}">
                <div class="reminder-icon">
                    <i class="fas fa-${status === 'paid' ? 'check-circle' : status === 'overdue' ? 'exclamation-triangle' : 'bolt'}"></i>
                </div>
                <div class="reminder-content">
                    <h3>${bill.title} <small>(${statusText})</small></h3>
                    <p class="reminder-details">
                        <i class="fas fa-calendar"></i> ${bill.isPaid ? 'Paid:' : 'Due:'} 
                        <strong>${formatDate(bill.dueDate)}</strong> • 
                        <i class="fas fa-rupee-sign"></i> Amount: <strong>${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(bill.amount)}</strong>
                    </p>
                    ${!bill.isPaid && daysUntilDue < 0 ? 
                        `<p class="reminder-note text-danger">Overdue by ${Math.abs(daysUntilDue)} days</p>` : 
                        !bill.isPaid ? 
                        `<p class="reminder-note">Due in ${daysUntilDue} days</p>` :
                        `<p class="reminder-note text-success">Paid</p>`
                    }
                </div>
                <div class="reminder-actions">
                    ${!bill.isPaid ? `
                        <button class="btn-${daysUntilDue < 0 ? 'danger' : 'success'} btn-sm" onclick="markBillPaid('${bill.id}')">
                            <i class="fas fa-${daysUntilDue < 0 ? 'exclamation-triangle' : 'check'}"></i> 
                            ${daysUntilDue < 0 ? 'Pay Now' : 'Mark Paid'}
                        </button>
                        <button class="btn-icon" onclick="editBillReminder('${bill.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="snoozeBill('${bill.id}')" title="Snooze">
                            <i class="fas fa-clock"></i>
                        </button>
                    ` : `
                        <button class="btn-icon" onclick="editBillReminder('${bill.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" title="View Receipt">
                            <i class="fas fa-receipt"></i>
                        </button>
                    `}
                    <button class="btn-icon delete" onclick="deleteBillReminder('${bill.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    updateBillCalendar();
}

function editBillReminder(id) {
    const bill = billReminders.find(b => b.id === id);
    if (!bill) return;
    
    document.getElementById('billTitle').value = bill.title;
    document.getElementById('billAmount').value = bill.amount;
    document.getElementById('billDueDate').value = bill.dueDate;
    document.getElementById('billCategory').value = bill.category;
    document.getElementById('billReminderDays').value = bill.reminderDays;
    
    billReminders = billReminders.filter(b => b.id !== id);
    localStorage.setItem('billReminders', JSON.stringify(billReminders));
    
    showAddBillModal();
    showNotification('Bill reminder loaded for editing', 'info');
}

function markBillPaid(id) {
    const bill = billReminders.find(b => b.id === id);
    if (!bill) return;

    bill.isPaid = true;
    bill.paidDate = new Date().toISOString();
    localStorage.setItem('billReminders', JSON.stringify(billReminders));
    
    showNotification('Bill marked as paid', 'success');
    updateBillRemindersDisplay();
}

function snoozeBill(id) {
    const bill = billReminders.find(b => b.id === id);
    if (!bill) return;

    const newDate = new Date(bill.dueDate);
    newDate.setDate(newDate.getDate() + 3);
    bill.dueDate = newDate.toISOString().split('T')[0];
    localStorage.setItem('billReminders', JSON.stringify(billReminders));
    
    showNotification('Bill snoozed for 3 days', 'info');
    updateBillRemindersDisplay();
}

function deleteBillReminder(id) {
    if (!confirm('Delete this bill reminder?')) return;
    
    billReminders = billReminders.filter(b => b.id !== id);
    localStorage.setItem('billReminders', JSON.stringify(billReminders));
    
    showNotification('Bill reminder deleted', 'success');
    updateBillRemindersDisplay();
}

function updateBillCalendar() {
    const calendar = document.getElementById('billCalendar');
    if (!calendar) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    let html = '';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        html += `<div class="calendar-day header">${day}</div>`;
    });
    
    for (let day = 1; day <= 30; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasBill = billReminders.some(bill => 
            !bill.isPaid && bill.dueDate === dateStr
        );
        
        const isToday = day === today.getDate();
        
        html += `
            <div class="calendar-day ${hasBill ? 'has-bill' : ''} ${isToday ? 'today' : ''}">
                ${day}
            </div>
        `;
    }
    
    calendar.innerHTML = html;
}

/* ======================
   SPLIT EXPENSES
====================== */
function showSplitExpenseModal() {
    document.getElementById('splitExpenseModal').classList.remove('hidden');
    resetSplitForm();
}

function closeSplitExpenseModal() {
    document.getElementById('splitExpenseModal').classList.add('hidden');
}

function editSplitExpense(id) {
    const expense = splitExpenses.find(e => e.id === id);
    if (!expense) return;
    
    document.getElementById('splitTitle').value = expense.title;
    document.getElementById('splitTotalAmount').value = expense.totalAmount;
    document.getElementById('splitCategory').value = expense.category;
    document.getElementById('splitMethod').value = expense.method;
    
    const membersContainer = document.getElementById('splitMembersContainer');
    membersContainer.innerHTML = '';
    
    expense.members.forEach((member, index) => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'split-member';
        memberDiv.innerHTML = `
            <div class="member-input">
                <input type="text" placeholder="Member Name" value="${member.name}" ${index === 0 ? 'readonly' : ''} />
                <input type="number" placeholder="Amount" class="split-amount" value="${member.amount}" oninput="updateSplitSummary()" />
            </div>
            ${index > 0 ? `
                <button class="btn-icon remove-member" onclick="removeMember(this)">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        `;
        membersContainer.appendChild(memberDiv);
    });
    
    splitExpenses = splitExpenses.filter(e => e.id !== id);
    localStorage.setItem('splitExpenses', JSON.stringify(splitExpenses));
    
    showSplitExpenseModal();
    updateSplitSummary();
    showNotification('Split expense loaded for editing', 'info');
}

function resetSplitForm() {
    document.getElementById('splitTitle').value = '';
    document.getElementById('splitTotalAmount').value = '';
    document.getElementById('splitCategory').value = 'Food';
    document.getElementById('splitMethod').value = 'equal';
    
    const membersContainer = document.getElementById('splitMembersContainer');
    membersContainer.innerHTML = `
        <div class="split-member">
            <div class="member-input">
                <input type="text" placeholder="Member Name" value="You" readonly />
                <input type="number" placeholder="Amount" class="split-amount" oninput="updateSplitSummary()" />
            </div>
            <button class="btn-icon remove-member" onclick="removeMember(this)" style="visibility: hidden;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    updateSplitSummary();
}

function addMember() {
    const membersContainer = document.getElementById('splitMembersContainer');
    const memberCount = membersContainer.children.length;
    
    const memberDiv = document.createElement('div');
    memberDiv.className = 'split-member';
    memberDiv.innerHTML = `
        <div class="member-input">
            <input type="text" placeholder="Member Name" value="Friend ${memberCount}" />
            <input type="number" placeholder="Amount" class="split-amount" oninput="updateSplitSummary()" />
        </div>
        <button class="btn-icon remove-member" onclick="removeMember(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    membersContainer.appendChild(memberDiv);
    updateSplitSummary();
}

function removeMember(button) {
    const memberDiv = button.closest('.split-member');
    if (document.querySelectorAll('.split-member').length <= 1) {
        showNotification('At least one member is required', 'warning');
        return;
    }
    
    memberDiv.remove();
    updateSplitSummary();
}

function changeSplitMethod() {
    const method = document.getElementById('splitMethod').value;
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount').value) || 0;
    const members = document.querySelectorAll('.split-member');
    
    if (method === 'equal') {
        const equalAmount = totalAmount / members.length;
        members.forEach((member, index) => {
            const amountInput = member.querySelector('.split-amount');
            amountInput.value = index === 0 ? 
                (totalAmount - (equalAmount * (members.length - 1))).toFixed(2) : 
                equalAmount.toFixed(2);
        });
    }
    
    updateSplitSummary();
}

function updateSplitSummary() {
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount').value) || 0;
    const members = document.querySelectorAll('.split-member');
    
    let totalSplit = 0;
    let summaryHTML = '';
    
    members.forEach((member, index) => {
        const nameInput = member.querySelector('input[type="text"]');
        const amountInput = member.querySelector('.split-amount');
        const amount = parseFloat(amountInput.value) || 0;
        totalSplit += amount;
        
        summaryHTML += `
            <div class="split-summary-item">
                <span>${nameInput.value}</span>
                <span class="${index === 0 ? 'text-success' : 'text-danger'}">
                    ${index === 0 ? '+' : '-'}${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(amount)}
                </span>
            </div>
        `;
    });
    
    const difference = totalAmount - totalSplit;
    
    summaryHTML += `
        <div class="split-summary-total">
            <strong>Total: ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(totalAmount)}</strong>
            <strong>Split: ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(totalSplit)}</strong>
            <strong class="${Math.abs(difference) < 0.01 ? 'text-success' : 'text-danger'}">
                ${Math.abs(difference) < 0.01 ? '✓ Balanced' : `Difference: ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(Math.abs(difference))}`}
            </strong>
        </div>
    `;
    
    document.getElementById('splitSummary').innerHTML = summaryHTML;
}

function saveSplitExpense() {
    const title = document.getElementById('splitTitle').value.trim();
    const totalAmount = parseFloat(document.getElementById('splitTotalAmount').value);
    const category = document.getElementById('splitCategory').value;
    const method = document.getElementById('splitMethod').value;
    
    if (!title || isNaN(totalAmount) || !category || category === '__add_new__') {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    const members = [];
    let totalSplit = 0;
    
    document.querySelectorAll('.split-member').forEach((member, index) => {
        const nameInput = member.querySelector('input[type="text"]');
        const amountInput = member.querySelector('.split-amount');
        const amount = parseFloat(amountInput.value) || 0;
        
        members.push({
            name: nameInput.value || `Member ${index + 1}`,
            amount: amount,
            isYou: index === 0
        });
        
        totalSplit += amount;
    });
    
    if (Math.abs(totalAmount - totalSplit) > 0.01) {
        showNotification('Split amounts must equal the total amount', 'error');
        return;
    }
    
    const splitExpense = {
        id: Date.now().toString(),
        title: title,
        totalAmount: totalAmount,
        category: category,
        method: method,
        members: members,
        createdAt: new Date().toISOString(),
        isSettled: false
    };
    
    splitExpenses.push(splitExpense);
    localStorage.setItem('splitExpenses', JSON.stringify(splitExpenses));
    
    closeSplitExpenseModal();
    showNotification('Split expense saved successfully', 'success');
    updateSplitExpensesDisplay();
}

function updateSplitExpensesDisplay() {
    const container = document.getElementById('splitContainer');
    if (!container) return;

    if (splitExpenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No split expenses</p>
                <p class="text-muted">Split your first expense with friends</p>
            </div>
        `;
        return;
    }

    let html = '';
    splitExpenses.forEach(expense => {
        const you = expense.members.find(m => m.isYou);
        
        html += `
            <div class="split-card">
                <div class="split-header">
                    <h3>${expense.title}</h3>
                    <span class="split-status ${expense.isSettled ? 'settled' : 'pending'}">
                        ${expense.isSettled ? 'Settled' : 'Pending'}
                    </span>
                </div>
                <div class="split-body">
                    <p class="split-description">Split among ${expense.members.length} people</p>
                    <div class="split-details">
                        <p><i class="fas fa-rupee-sign"></i> <strong>Total:</strong> ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(expense.totalAmount)}</p>
                        <p><i class="fas fa-user"></i> <strong>You Paid:</strong> ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(you.amount)}</p>
                    </div>
                    
                    <div class="split-members">
                        <h4>Members:</h4>
                        <div class="member-list">
                            ${expense.members.map(member => `
                                <div class="member">
                                    <div class="member-avatar">${member.name.charAt(0)}</div>
                                    <div class="member-info">
                                        <strong>${member.name}${member.isYou ? ' (You)' : ''}</strong>
                                        <span class="member-status">
                                            ${member.isYou ? 'Paid' : 'Owes'} ${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(member.amount)}
                                        </span>
                                    </div>
                                    <div class="member-amount">
                                        <span class="${member.isYou ? 'text-success' : 'text-danger'}">
                                            ${member.isYou ? '+' : '-'}${CURRENCY_SYMBOLS[userCurrency]}${formatCurrency(member.amount)}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="split-footer">
                    <div class="split-actions">
                        <button class="btn-text" onclick="editSplitExpense('${expense.id}')" title="Edit">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${!expense.isSettled ? `
                            <button class="btn-text" onclick="settleSplitExpense('${expense.id}')">
                                <i class="fas fa-handshake"></i> Settle Up
                            </button>
                        ` : `
                            <button class="btn-text" onclick="unsettleSplitExpense('${expense.id}')">
                                <i class="fas fa-undo"></i> Mark as Pending
                            </button>
                        `}
                        <button class="btn-text text-danger" onclick="deleteSplitExpense('${expense.id}')" title="Delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function settleSplitExpense(id) {
    const expense = splitExpenses.find(e => e.id === id);
    if (!expense) return;

    expense.isSettled = true;
    expense.settledAt = new Date().toISOString();
    localStorage.setItem('splitExpenses', JSON.stringify(splitExpenses));
    
    showNotification('Expense settled successfully', 'success');
    updateSplitExpensesDisplay();
}

function unsettleSplitExpense(id) {
    const expense = splitExpenses.find(e => e.id === id);
    if (!expense) return;

    expense.isSettled = false;
    expense.settledAt = null;
    localStorage.setItem('splitExpenses', JSON.stringify(splitExpenses));
    
    showNotification('Expense marked as pending', 'info');
    updateSplitExpensesDisplay();
}

function deleteSplitExpense(id) {
    if (!confirm('Are you sure you want to delete this split expense?')) return;
    
    splitExpenses = splitExpenses.filter(e => e.id !== id);
    localStorage.setItem('splitExpenses', JSON.stringify(splitExpenses));
    
    showNotification('Split expense deleted successfully', 'success');
    updateSplitExpensesDisplay();
}

/* ======================
   UTILITY FUNCTIONS
====================== */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateAllDisplays() {
    loadExpenses();
    updateDashboard();
    loadAnalytics();
    updateRecurringExpensesDisplay();
    updateBillRemindersDisplay();
    updateSplitExpensesDisplay();
    updateBillCalendar();
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    background: white;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transform: translateX(120%);
    transition: transform 0.3s ease;
    z-index: 10000;
    min-width: 280px;
    max-width: 350px;
    border-left: 4px solid #4361ee;
    font-size: 0.875rem;
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    border-left-color: #10b981;
    background: #d1fae5;
}

.notification-error {
    border-left-color: #ef4444;
    background: #fee2e2;
}

.notification-info {
    border-left-color: #3b82f6;
    background: #dbeafe;
}

.notification i {
    font-size: 1.1rem;
}

/* Category Management Styles */
.categories-management {
    padding: 0.5rem;
}

.categories-section {
    margin-bottom: 1.5rem;
}

.categories-section h4 {
    margin-bottom: 1rem;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.categories-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
}

.category-item:hover {
    transform: translateX(4px);
    background: var(--bg-card);
    border-color: var(--primary);
}

.category-info {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.category-icon {
    font-size: 1.25rem;
    width: 40px;
    text-align: center;
}

.category-name {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
}

.category-count {
    color: var(--text-secondary);
    font-size: 0.75rem;
}

.category-badge {
    padding: 0.25rem 0.75rem;
    background: var(--primary-light);
    color: var(--primary);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
}

.category-actions {
    display: flex;
    gap: 0.5rem;
}

.category-actions .btn-icon {
    padding: 0.375rem;
    font-size: 0.875rem;
}

.category-actions .btn-icon.edit {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}

.category-actions .btn-icon.delete {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.category-actions .btn-icon:hover {
    transform: scale(1.1);
}

.add-category-option {
    color: var(--primary) !important;
    font-weight: 600 !important;
    background: var(--bg-hover) !important;
}

/* Category form styles */
.category-form .form-group {
    margin-bottom: 1.5rem;
}

.category-form select {
    font-size: 1.1rem;
    padding: 0.75rem;
}

.category-form option {
    font-size: 1rem;
    padding: 0.5rem;
}

/* Color picker styling */
.category-form input[type="color"] {
    width: 100%;
    height: 50px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    cursor: pointer;
}
`;
document.head.appendChild(style);

console.log('Expense Tracker fully loaded!');






function checkExistingSession() {
    // Get session info
    const session = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession'));
    
    if (session && session.email) {
        // Display email in profile modal
        const emailElement = document.getElementById('profileEmail');
        if (emailElement) {
            emailElement.textContent = session.email;
        }
    }
    
    // Rest of your existing code...
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        try {
            const user = JSON.parse(savedUserData);
            userId = user._id || userId;
            monthlyIncome = user.monthlyIncome || 0;
            userCurrency = user.currency || 'INR';
            monthlyBudget = user.monthlyBudget || 0;
            
            document.getElementById('username').innerHTML = `Welcome back, <span class="text-primary">${user.name}</span>`;
            document.getElementById('totalIncome').textContent = formatCurrency(monthlyIncome);
            
            document.getElementById('currencySelector').value = userCurrency;
            updateCurrencyDisplay();
            
            console.log('User session restored:', user);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}
function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const income = document.getElementById('profileIncome').value;
    const currency = document.getElementById('profileCurrency').value;
    const budget = document.getElementById('profileBudget').value;

    if (!name || !income) {
        showNotification('Please enter name and income', 'error');
        return;
    }

    // Get session to know which user
    const session = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession'));
    
    const user = {
        _id: session?.userId || userId,
        name: name,
        monthlyIncome: Number(income),
        currency: currency,
        monthlyBudget: budget ? Number(budget) : 0,
        updatedAt: new Date().toISOString()
    };

    monthlyIncome = user.monthlyIncome;
    userCurrency = user.currency;
    monthlyBudget = user.monthlyBudget;
    
    // Save to userData
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('currency', userCurrency);

    document.getElementById('username').innerHTML = `Hello, <span class="text-primary">${user.name}</span>`;
    document.getElementById('totalIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('currencySelector').value = userCurrency;
    updateCurrencyDisplay();
    
    showNotification('Profile saved successfully!', 'success');
    toggleProfile();
    
    showSection('dashboard');
}
