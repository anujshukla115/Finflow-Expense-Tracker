// auth.js (PRODUCTION READY FOR NETLIFY)

const API_BASE = "https://YOUR-BACKEND-URL/api"; // 🔴 CHANGE THIS LATER

class AuthService {
  constructor() {
    this.tokenKey = "finflow_token";
    this.userKey = "finflow_user";
  }

  /* ======================
     TOKEN HELPERS
  ====================== */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  getCurrentUser() {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  /* ======================
     AUTH ACTIONS
  ====================== */
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    this.setToken(data.token);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    return data.user;
  }

  async register(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    this.setToken(data.token);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    return data.user;
  }

  logout() {
    this.clearAuth();
    window.location.href = "index.html"; // login page
  }
}

/* 🔴 VERY IMPORTANT */
window.auth = new AuthService();
