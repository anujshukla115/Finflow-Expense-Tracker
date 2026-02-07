// API Configuration
const API_URL = 'http://localhost:5000/api';

// Show/Hide Forms
function showSignup() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
  hideMessage();
}

function showLogin() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  hideMessage();
}

// Toggle Password Visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector('.toggle-password i');
  
  if (input.type === 'password') {
    input.type = 'text';
    button.classList.remove('fa-eye');
    button.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    button.classList.remove('fa-eye-slash');
    button.classList.add('fa-eye');
  }
}

// Show Message
function showMessage(message, type = 'success') {
  const alert = document.getElementById('messageAlert');
  const messageText = document.getElementById('messageText');
  
  messageText.textContent = message;
  alert.className = `message-alert ${type}`;
  alert.classList.remove('hidden');
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    hideMessage();
  }, 5000);
}

function hideMessage() {
  const alert = document.getElementById('messageAlert');
  alert.classList.add('hidden');
}

// Handle Login
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');
  
  // Validate
  if (!email || !password) {
    showMessage('Please fill in all fields', 'error');
    return;
  }
  
  // Show loading state
  loginBtn.classList.add('loading');
  loginBtn.disabled = true;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      showMessage('Login successful! Redirecting...', 'success');
      
      // Redirect to main app
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      showMessage(data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage('Unable to connect to server. Please try again.', 'error');
  } finally {
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
  }
}

// Handle Signup
async function handleSignup(event) {
  event.preventDefault();
  
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const signupBtn = document.getElementById('signupBtn');
  
  // Validate
  if (!name || !email || !password || !confirmPassword) {
    showMessage('Please fill in all fields', 'error');
    return;
  }
  
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }
  
  // Show loading state
  signupBtn.classList.add('loading');
  signupBtn.disabled = true;
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      showMessage('Account created successfully! Redirecting...', 'success');
      
      // Redirect to main app
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      showMessage(data.message || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showMessage('Unable to connect to server. Please try again.', 'error');
  } finally {
    signupBtn.classList.remove('loading');
    signupBtn.disabled = false;
  }
}

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Verify token is still valid
    fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = 'index.html';
      }
    })
    .catch(() => {
      // Invalid token, remove it
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  }
});