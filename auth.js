// ================= AUTH SYSTEM =================
window.auth = (() => {
    const API_BASE = "https://your-railway-backend.up.railway.app/api/auth";
    const TOKEN_KEY = "finflow_token";
    const USER_KEY = "finflow_user";

    async function makeRequest(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Request failed');
        }
        
        return await response.json();
    }

    function saveAuthData(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getUser() {
        return JSON.parse(localStorage.getItem(USER_KEY));
    }

    function isLoggedIn() {
        return !!getToken();
    }

    async function register({ name, email, password }) {
        const data = await makeRequest('/register', { name, email, password });
        saveAuthData(data.token, data.user);
        return data.user;
    }

    async function login(email, password) {
        const data = await makeRequest('/login', { email, password });
        saveAuthData(data.token, data.user);
        return data.user;
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.replace("/");
    }

    function getCurrentUser() {
        if (!isLoggedIn()) return null;
        return getUser();
    }

    return {
        register,
        login,
        logout,
        isLoggedIn,
        getCurrentUser,
        getToken // Add this for API requests
    };
})();
