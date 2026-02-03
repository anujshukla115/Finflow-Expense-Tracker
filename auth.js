window.auth = (() => {
  const API_BASE =
    "https://finflow-expense-tracker-backend-production.up.railway.app/api/auth";

  const TOKEN_KEY = "finflow_token";
  const USER_KEY = "finflow_user";

  async function request(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Request failed");
    }

    return res.json();
  }

  return {
    async login(email, password) {
      const data = await request("/login", { email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    },

    async register(payload) {
      const data = await request("/register", payload);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    },

    logout() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace("index.html");
    },

    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    getUser() {
      return JSON.parse(localStorage.getItem(USER_KEY));
    },

    getCurrentUser() {
      return JSON.parse(localStorage.getItem(USER_KEY));
    },

    isLoggedIn() {
      return !!localStorage.getItem(TOKEN_KEY);
    }
  };
})();
