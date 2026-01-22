const API_URL = "https://finflow-expense-tracker-backend-production.up.railway.app";

const auth = {
 async register(name, email, password) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  console.log("REGISTER RESPONSE:", data);

  if (!res.ok) {
    throw new Error(data.message || "Registration failed");
  }

  localStorage.setItem("token", data.token);
  return data;
}


  async register(name, email, password) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // ✅ THIS IS MISSING IN YOUR CODE
    localStorage.setItem("token", data.token);

    return data;
  }
};

