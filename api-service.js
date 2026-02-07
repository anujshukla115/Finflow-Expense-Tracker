// ================= API SERVICE =================
const API_URL = 'http://localhost:5000/api';

/* ================= TOKEN HELPERS ================= */

// Get JWT token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Build auth headers
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
}

// Handle API response
async function handleResponse(response) {
    const data = await response.json();

    if (response.status === 401 || data.message === 'No token, authorization denied') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }

    return data;
}

/* ================= AUTH CHECK ================= */

async function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: getAuthHeaders()
        });
        const data = await handleResponse(res);
        return data.user;
    } catch (err) {
        console.error('Auth check failed', err);
        return false;
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/* ================= EXPENSE API ================= */

const ExpenseAPI = {
    async getAll() {
        const res = await fetch(`${API_URL}/expenses`, {
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    async create(data) {
        const res = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async update(id, data) {
        const res = await fetch(`${API_URL}/expenses/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async delete(id) {
        const res = await fetch(`${API_URL}/expenses/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    }
};

/* ================= RECURRING API ================= */

const RecurringAPI = {
    async getAll() {
        const res = await fetch(`${API_URL}/recurring`, {
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    async create(data) {
        const res = await fetch(`${API_URL}/recurring`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async delete(id) {
        const res = await fetch(`${API_URL}/recurring/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    }
};

/* ================= BILLS API ================= */

const BillsAPI = {
    async getAll() {
        const res = await fetch(`${API_URL}/bills`, {
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    async create(data) {
        const res = await fetch(`${API_URL}/bills`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async markPaid(id) {
        const res = await fetch(`${API_URL}/bills/${id}/pay`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    }
};

/* ================= SPLIT API ================= */

const SplitAPI = {
    async getAll() {
        const res = await fetch(`${API_URL}/split`, {
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    async create(data) {
        const res = await fetch(`${API_URL}/split`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    }
};

/* ================= CATEGORY API ================= */

const CategoriesAPI = {
    async getAll() {
        const res = await fetch(`${API_URL}/categories`, {
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    }
};

/* ================= USER API ================= */

const UserAPI = {
    async updateProfile(data) {
        const res = await fetch(`${API_URL}/user/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    }
};

console.log('✅ API Service Loaded Successfully');
