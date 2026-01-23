// ================= AUTH SYSTEM =================
window.auth = (() => {
    const USER_KEY = "finflow_user";
    const SESSION_KEY = "finflow_session";

    function getUser() {
        return JSON.parse(localStorage.getItem(USER_KEY));
    }

    function getSession() {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    }

    function isLoggedIn() {
        return !!getSession();
    }

    function register({ name, email, password }) {
        const user = {
            id: "user_" + Date.now(),
            name,
            email,
            password, // demo only (no hashing)
            createdAt: new Date().toISOString(),
            profile: {
                currency: "INR",
                monthlyIncome: 0,
                monthlyBudget: 0
            }
        };

        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));

        return user;
    }

    function login(email, password) {
        const user = getUser();
        if (!user) return null;

        if (user.email === email && user.password === password) {
            localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
            return user;
        }

        return null;
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);

        // ✅ Netlify-safe redirect
        window.location.replace("/");
    }

    function getCurrentUser() {
        if (!isLoggedIn()) return null;
        return getUser();
    }

    function updateUserInfo(updatedUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }

    function deleteAccount() {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(SESSION_KEY);
        window.location.replace("/");
    }

    return {
        register,
        login,
        logout,
        isLoggedIn,
        getCurrentUser,
        updateUserInfo,
        deleteAccount
    };
})();
