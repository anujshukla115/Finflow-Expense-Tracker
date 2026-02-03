window.auth = (() => {
  const API_BASE = "https://your-railway-backend.up.railway.app/api/auth";
  const TOKEN_KEY = "finflow_token";
  const USER_KEY = "finflow_user";

  async function request(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    return res.json();
  }

  function save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  return {
    login: async (email, password) => {
      const d = await request("/login", { email, password });
      save(d.token, d.user);
      return d.user;
    },

    register: async (data) => {
      const d = await request("/register", data);
      save(d.token, d.user);
      return d.user;
    },

    logout() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      location.href = "index.html";
    },

    getToken: () => localStorage.getItem(TOKEN_KEY),
    getUser: () => JSON.parse(localStorage.getItem(USER_KEY)),
    isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY)
  };
})();
