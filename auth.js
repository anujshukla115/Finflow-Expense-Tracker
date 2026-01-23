const auth = {
  register: async (name, email, password) => {
    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }

    const user = {
      _id: "user-" + Date.now(),
      name,
      email,
      password,
      monthlyIncome: 0,
      currency: "INR",
      monthlyBudget: 0
    };

    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));

    // auto login after register
    localStorage.setItem("token", "local-token");
    localStorage.setItem("userData", JSON.stringify(user));
  },

  login: async (email, password) => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    localStorage.setItem("token", "local-token");
    localStorage.setItem("userData", JSON.stringify(user));
  }
};
