// ================= API SERVICE =================
const API_URL = 'http://localhost:5000/api';

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Get auth headers
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Check authentication
async function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!data.success) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return false;
        }
        
        return data.user;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ================= EXPENSES API =================
const ExpenseAPI = {
    // Get all expenses
    async getAll(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/expenses?${queryString}`, {
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Get expenses error:', error);
            return { success: false, message: 'Failed to fetch expenses' };
        }
    },
    
    // Create expense
    async create(expenseData) {
        try {
            const response = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(expenseData)
            });
            return await response.json();
        } catch (error) {
            console.error('Create expense error:', error);
            return { success: false, message: 'Failed to create expense' };
        }
    },
    
    // Update expense
    async update(id, expenseData) {
        try {
            const response = await fetch(`${API_URL}/expenses/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(expenseData)
            });
            return await response.json();
        } catch (error) {
            console.error('Update expense error:', error);
            return { success: false, message: 'Failed to update expense' };
        }
    },
    
    // Delete expense
    async delete(id) {
        try {
            const response = await fetch(`${API_URL}/expenses/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Delete expense error:', error);
            return { success: false, message: 'Failed to delete expense' };
        }
    },
    
    // Get statistics
    async getStats(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/expenses/stats/summary?${queryString}`, {
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Get stats error:', error);
            return { success: false, message: 'Failed to fetch statistics' };
        }
    }
};

// ================= RECURRING EXPENSES API =================
const RecurringAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_URL}/recurring`, {
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Get recurring expenses error:', error);
            return { success: false, message: 'Failed to fetch recurring expenses' };
        }
    },
    
    async create(data) {
        try {
            const response = await fetch(`${API_URL}/recurring`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Create recurring expense error:', error);
            return { success: false, message: 'Failed to create recurring expense' };
        }
    },
    
    async update(id, data) {
        try {
            const response = await fetch(`${API_URL}/recurring/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Update recurring expense error:', error);
            return { success: false, message: 'Failed to update recurring expense' };
        }
    },
    
    async delete(id) {
        try {
            const response = await fetch(`${API_URL}/recurring/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Delete recurring expense error:', error);
            return { success: false, message: 'Failed to delete recurring expense' };
        }
    },
    
    async toggle(id) {
        try {
            const response = await fetch(`${API_URL}/recurring/${id}/toggle`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Toggle recurring expense error:', error);
            return { success: false, message: 'Failed to toggle recurring expense' };
        }
    }
};

// ================= BILLS API =================
const BillsAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_URL}/bills`, {
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Get bills error:', error);
            return { success: false, message: 'Failed to fetch bills' };
        }
    },
    
    async create(data) {
        try {
            const response = await fetch(`${API_URL}/bills`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Create bill error:', error);
            return { success: false, message: 'Failed to create bill' };
        }
    },
    
    async update(id, data) {
        try {
            const response = await fetch(`${API_URL}/bills/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Update bill error:', error);
            return { success: false, message: 'Failed to update bill' };
        }
    },
    
    async delete(id) {
        try {
            const response = await fetch(`${API_URL}/bills/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Delete bill error:', error);
            return { success: false, message: 'Failed to delete bill' };
        }
    },
    
    async markPaid(id) {
        try {
            const response = await fetch(`${API_URL}/bills/${id}/pay`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Mark bill paid error:', error);
            return { success: false, message: 'Failed to mark bill as paid' };
        }
    }
};

// ================= SPLIT EXPENSES API =================
const SplitAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_URL}/split`, {
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Get split expenses error:', error);
            return { success: false, message: 'Failed to fetch split expenses' };
        }
    },
    
    async create(data) {
        try {
            const response = await fetch(`${API_URL}/split`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Create split expense error:', error);
            return { success: false, message: 'Failed to create split expense' };
        }
    },
    
    async update(id, data) {
        try {
            const response = await fetch(`${API_URL}/split/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Update split expense error:', error);
            return { success: false, message: 'Failed to update split expense' };
        }
    },
    
    async delete(id) {
        try {
            const response = await fetch(`${API_URL}/split/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Delete split expense error:', error);
            return { success: false, message: 'Failed to delete split expense' };
        }
    },
    
    async markMemberPaid(id, memberIndex) {
        try {
            const response = await fetch(`${API_URL}/split/${id}/member/${memberIndex}/pay`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Mark member paid error:', error);
            return { success: false, message: 'Failed to update member payment status' };
        }
    }
};

// ================= CATEGORIES API =================
const CategoriesAPI = {
    async getAll() {
        try {
            const response = await fetch(`${API_URL}/categories`, {
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Get categories error:', error);
            return { success: false, message: 'Failed to fetch categories' };
        }
    },
    
    async create(data) {
        try {
            const response = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Create category error:', error);
            return { success: false, message: 'Failed to create category' };
        }
    },
    
    async update(id, data) {
        try {
            const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Update category error:', error);
            return { success: false, message: 'Failed to update category' };
        }
    },
    
    async delete(id) {
        try {
            const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Delete category error:', error);
            return { success: false, message: 'Failed to delete category' };
        }
    }
};

// ================= USER API =================
const UserAPI = {
    async updateProfile(data) {
        try {
            const response = await fetch(`${API_URL}/user/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, message: 'Failed to update profile' };
        }
    },
    
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${API_URL}/user/password`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });
            return await response.json();
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: 'Failed to change password' };
        }
    }
};