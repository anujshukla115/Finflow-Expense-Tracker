// auth.js - Authentication Script for FinFlow

let currentAuthTheme = localStorage.getItem('theme') || 'light';
let authErrorTimeout = null;

// Initialize auth page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth page initialized');
    
    // Apply theme
    applyAuthTheme();
    
    // Check if user is already logged in
    checkExistingAuth();
    
    // Setup form validation
    setupFormValidation();
    
    // Setup password strength checker
    setupPasswordStrength();
    
    // Check for demo parameter
    checkDemoLogin();
});

// Theme management
function toggleAuthTheme() {
    currentAuthTheme = currentAuthTheme === 'light' ? 'dark' : 'light';
    applyAuthTheme();
    localStorage.setItem('theme', currentAuthTheme);
    
    const themeIcon = document.getElementById('authThemeIcon');
    themeIcon.className = currentAuthTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    showAuthMessage(`${currentAuthTheme === 'light' ? 'Light' : 'Dark'} mode enabled`, 'info');
}

function applyAuthTheme() {
    document.documentElement.setAttribute('data-theme', currentAuthTheme);
    const themeIcon = document.getElementById('authThemeIcon');
    if (themeIcon) {
        themeIcon.className = currentAuthTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Form switching
function showAuthForm(formType) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.style.display = 'none';
        form.classList.remove('active');
    });
    
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected form
    const form = document.getElementById(`${formType}Form`);
    if (form) {
        form.style.display = 'block';
        form.classList.add('active');
        
        const tab = Array.from(document.querySelectorAll('.auth-tab')).find(t => 
            t.textContent.toLowerCase().includes(formType)
        );
        if (tab) {
            tab.classList.add('active');
        }
    }
    
    // Clear errors
    clearAuthError();
}

function showForgotPassword() {
    showAuthForm('forgotPassword');
}

// Password visibility toggle
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Password strength checker
function setupPasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            checkPasswordStrength(e.target.value);
        });
    }
}

function checkPasswordStrength(password) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!password) {
        strengthFill.style.width = '0%';
        strengthFill.style.backgroundColor = '';
        strengthText.textContent = 'Password strength: None';
        return;
    }
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Determine strength
    let strength, color, width;
    
    switch(score) {
        case 0:
        case 1:
            strength = 'Weak';
            color = '#ef4444';
            width = '25%';
            break;
        case 2:
        case 3:
            strength = 'Fair';
            color = '#f59e0b';
            width = '50%';
            break;
        case 4:
            strength = 'Good';
            color = '#10b981';
            width = '75%';
            break;
        case 5:
            strength = 'Strong';
            color = '#10b981';
            width = '100%';
            break;
        default:
            strength = 'Weak';
            color = '#ef4444';
            width = '25%';
    }
    
    strengthFill.style.width = width;
    strengthFill.style.backgroundColor = color;
    strengthText.textContent = `Password strength: ${strength}`;
    strengthText.style.color = color;
}

// Form validation setup
function setupFormValidation() {
    const forms = ['loginForm', 'registerForm', 'forgotPasswordForm'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(e) {
                if (!validateForm(formId)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }
    });
}

function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    let isValid = true;
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            showInputError(input, 'This field is required');
            isValid = false;
        } else if (input.type === 'email' && !isValidEmail(input.value)) {
            showInputError(input, 'Please enter a valid email address');
            isValid = false;
        } else if (input.type === 'password' && formId === 'registerForm' && input.id === 'registerPassword') {
            if (input.value.length < 6) {
                showInputError(input, 'Password must be at least 6 characters');
                isValid = false;
            }
        } else if (input.id === 'registerConfirmPassword') {
            const password = document.getElementById('registerPassword').value;
            if (input.value !== password) {
                showInputError(input, 'Passwords do not match');
                isValid = false;
            }
        }
        
        // Clear error on input
        input.addEventListener('input', function() {
            clearInputError(this);
        });
    });
    
    if (formId === 'registerForm') {
        const termsCheckbox = document.getElementById('acceptTerms');
        if (termsCheckbox && !termsCheckbox.checked) {
            showAuthMessage('Please accept the terms and conditions', 'error');
            isValid = false;
        }
    }
    
    return isValid;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showInputError(input, message) {
    clearInputError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    
    input.parentNode.appendChild(errorDiv);
    input.style.borderColor = '#ef4444';
}

function clearInputError(input) {
    const error = input.parentNode.querySelector('.input-error');
    if (error) error.remove();
    input.style.borderColor = '';
}

// Authentication functions
function handleLogin(event) {
    event.preventDefault();
    
    if (!validateForm('loginForm')) return;
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    showAuthLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const demoUsers = [
            { email: 'demo@finflow.com', password: 'demo123', name: 'Demo User' }
        ];
        const allUsers = [...users, ...demoUsers];
        
        const user = allUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Store user session
            const session = {
                userId: 'user-' + Date.now(),
                email: user.email,
                name: user.name,
                isAuthenticated: true,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };
            
            if (rememberMe) {
                localStorage.setItem('userSession', JSON.stringify(session));
            } else {
                sessionStorage.setItem('userSession', JSON.stringify(session));
            }
            
            showAuthMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to main app
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showAuthMessage('Invalid email or password', 'error');
            showAuthLoading(false);
        }
    }, 800);
}

function handleRegister(event) {
    event.preventDefault();
    
    if (!validateForm('registerForm')) return;
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    showAuthLoading(true);
    
    // Check if user already exists
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.some(u => u.email === email)) {
            showAuthMessage('User with this email already exists', 'error');
            showAuthLoading(false);
            return;
        }
        
        // Create new user
        const newUser = {
            id: 'user-' + Date.now(),
            email: email,
            password: password,
            name: name,
            createdAt: new Date().toISOString(),
            monthlyIncome: 0,
            currency: 'INR',
            monthlyBudget: 0
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Auto login after registration
        const session = {
            userId: newUser.id,
            email: newUser.email,
            name: newUser.name,
            isAuthenticated: true,
            loginTime: new Date().toISOString(),
            rememberMe: true
        };
        
        localStorage.setItem('userSession', JSON.stringify(session));
        
        showAuthMessage('Registration successful! Creating your account...', 'success');
        
        // Initialize user data
        initializeUserData(newUser);
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }, 800);
}

function handleForgotPassword(event) {
    event.preventDefault();
    
    if (!validateForm('forgotPasswordForm')) return;
    
    const email = document.getElementById('resetEmail').value;
    
    showAuthLoading(true);
    
    // Simulate password reset process
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userExists = users.some(u => u.email === email);
        
        if (userExists) {
            showAuthMessage('Password reset link sent to your email', 'success');
            
            // In a real app, you would send an email here
            console.log(`Password reset link for: ${email}`);
            
            // Show login form after delay
            setTimeout(() => {
                showAuthForm('login');
                showAuthLoading(false);
            }, 2000);
        } else {
            showAuthMessage('No account found with this email', 'error');
            showAuthLoading(false);
        }
    }, 1000);
}

function useDemoAccount() {
    document.getElementById('loginEmail').value = 'demo@finflow.com';
    document.getElementById('loginPassword').value = 'demo123';
    document.getElementById('rememberMe').checked = true;
    
    showAuthMessage('Demo credentials filled. Click Sign In to continue.', 'info');
}

function checkDemoLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
        useDemoAccount();
    }
}

// Social login (mock implementation)
function socialLogin(provider) {
    showAuthLoading(true);
    
    setTimeout(() => {
        showAuthMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login would redirect to ${provider} authentication in a real app`, 'info');
        
        // Mock social login success
        const socialUser = {
            userId: 'social-user-' + Date.now(),
            email: `user@${provider}.com`,
            name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
            isAuthenticated: true,
            loginTime: new Date().toISOString(),
            provider: provider
        };
        
        localStorage.setItem('userSession', JSON.stringify(socialUser));
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    }, 800);
}

function socialRegister(provider) {
    showAuthLoading(true);
    
    setTimeout(() => {
        showAuthMessage(`Redirecting to ${provider} for registration...`, 'info');
        
        // Mock social registration success
        const socialUser = {
            userId: 'social-user-' + Date.now(),
            email: `newuser@${provider}.com`,
            name: 'New Social User',
            isAuthenticated: true,
            loginTime: new Date().toISOString(),
            provider: provider
        };
        
        localStorage.setItem('userSession', JSON.stringify(socialUser));
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    }, 800);
}

// Initialize user data
function initializeUserData(user) {
    // Initialize user-specific data in localStorage
    const userData = {
        _id: user.id,
        name: user.name,
        monthlyIncome: user.monthlyIncome || 0,
        currency: user.currency || 'INR',
        monthlyBudget: user.monthlyBudget || 0,
        createdAt: user.createdAt
    };
    
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('currency', user.currency || 'INR');
    
    // Initialize empty arrays for user data
    const userPrefix = `user_${user.id}_`;
    
    if (!localStorage.getItem(`${userPrefix}expenses`)) {
        localStorage.setItem(`${userPrefix}expenses`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`${userPrefix}recurringExpenses`)) {
        localStorage.setItem(`${userPrefix}recurringExpenses`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`${userPrefix}billReminders`)) {
        localStorage.setItem(`${userPrefix}billReminders`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`${userPrefix}splitExpenses`)) {
        localStorage.setItem(`${userPrefix}splitExpenses`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`${userPrefix}customCategories`)) {
        localStorage.setItem(`${userPrefix}customCategories`, JSON.stringify([]));
    }
}

// Check existing authentication
function checkExistingAuth() {
    const session = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession'));
    
    if (session && session.isAuthenticated) {
        // Check if session is still valid (24 hours)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
            // Redirect to main app
            window.location.href = 'index.html';
        } else {
            // Clear expired session
            localStorage.removeItem('userSession');
            sessionStorage.removeItem('userSession');
        }
    }
}

// UI helpers
function showAuthMessage(message, type = 'info') {
    const errorDiv = document.getElementById('authError');
    
    errorDiv.textContent = message;
    errorDiv.className = `auth-error ${type}`;
    errorDiv.style.display = 'block';
    
    // Clear previous timeout
    if (authErrorTimeout) {
        clearTimeout(authErrorTimeout);
    }
    
    // Auto-hide success/info messages
    if (type !== 'error') {
        authErrorTimeout = setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function clearAuthError() {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    
    if (authErrorTimeout) {
        clearTimeout(authErrorTimeout);
        authErrorTimeout = null;
    }
}

function showAuthLoading(show) {
    const loadingOverlay = document.getElementById('authLoadingOverlay');
    
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

// Add input error styles to CSS
const authStyles = document.createElement('style');
authStyles.textContent = `
.input-error {
    color: #ef4444 !important;
    font-size: 0.8rem !important;
    margin-top: 0.25rem !important;
}

.input-error + input {
    border-color: #ef4444 !important;
}
`;
document.head.appendChild(authStyles);

console.log('Auth script loaded successfully');