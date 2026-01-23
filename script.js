/* =====================================================
   FINFLOW – FIXED SCRIPT.JS (STABLE VERSION)
   Only broken parts corrected
===================================================== */

/* ======================
   AUTH GUARD (SAFE)
====================== */
(function () {
  const user = JSON.parse(localStorage.getItem("userData"));
  if (!user) {
    window.location.replace("login.html");
  }
})();

/* ======================
   GLOBAL STATE
====================== */
let userId = null;
let monthlyIncome = 0;
let monthlyBudget = 0;
let userCurrency = "INR";

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let recurringExpenses = JSON.parse(localStorage.getItem("recurringExpenses")) || [];
let billReminders = JSON.parse(localStorage.getItem("billReminders")) || [];
let splitExpenses = JSON.parse(localStorage.getItem("splitExpenses")) || [];
let customCategories = JSON.parse(localStorage.getItem("customCategories")) || [];

/* ======================
   CURRENCY
====================== */
const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/* ======================
   LOAD USER (SINGLE SOURCE OF TRUTH)
====================== */
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  if (!user) return;

  userId = user._id;
  monthlyIncome = Number(user.monthlyIncome) || 0;
  monthlyBudget = Number(user.monthlyBudget) || 0;
  userCurrency = user.currency || "INR";

  const usernameEl = document.getElementById("username");
  if (usernameEl) usernameEl.innerText = `Welcome, ${user.name}`;

  const emailEl = document.getElementById("profileEmail");
  if (emailEl) emailEl.innerText = user.email || "—";

  document.getElementById("currencySelector").value = userCurrency;

  updateAllDisplays();
});

/* ======================
   LOGOUT (SAFE)
====================== */
window.logout = function () {
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  window.location.replace("login.html");
};

/* ======================
   PROFILE SAVE (FIXED ID)
====================== */
function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  const income = Number(document.getElementById("profileIncome").value);
  const currency = document.getElementById("profileCurrency").value;
  const budget = Number(document.getElementById("profileBudget").value || 0);

  if (!name || !income) {
    alert("Name and income required");
    return;
  }

  const existing = JSON.parse(localStorage.getItem("userData"));

  const user = {
    _id: existing?._id || "user-main",
    name,
    email: existing?.email || "",
    monthlyIncome: income,
    currency,
    monthlyBudget: budget,
  };

  localStorage.setItem("userData", JSON.stringify(user));

  userId = user._id;
  monthlyIncome = income;
  monthlyBudget = budget;
  userCurrency = currency;

  updateAllDisplays();
  toggleProfile();
}

/* ======================
   EXPENSE ADD (FIXED)
====================== */
function addExpense() {
  if (!userId) return alert("Save profile first");

  const title = document.getElementById("title").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("expenseDate").value;

  if (!title || !amount || !category) {
    alert("Fill all fields");
    return;
  }

  expenses.push({
    _id: "exp-" + Date.now(),
    userId,
    title,
    amount,
    category,
    date,
  });

  localStorage.setItem("expenses", JSON.stringify(expenses));

  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";

  updateAllDisplays();
}

/* ======================
   LOAD + FILTER EXPENSES
====================== */
function loadExpenses() {
  const list = document.getElementById("expenseList");
  const totalEl = document.getElementById("expenseTotal");
  if (!list) return;

  const userExpenses = expenses.filter(e => e.userId === userId);

  if (!userExpenses.length) {
    list.innerHTML = "<p>No expenses</p>";
    totalEl.innerText = `${CURRENCY_SYMBOLS[userCurrency]}0`;
    return;
  }

  let total = 0;
  list.innerHTML = "";

  userExpenses.forEach(exp => {
    total += exp.amount;
    list.innerHTML += `
      <div class="expense-item">
        <strong>${exp.title}</strong>
        <span>${CURRENCY_SYMBOLS[userCurrency]}${exp.amount}</span>
      </div>
    `;
  });

  totalEl.innerText = `${CURRENCY_SYMBOLS[userCurrency]}${total}`;
}

/* ======================
   DASHBOARD
====================== */
function updateDashboard() {
  const userExpenses = expenses.filter(e => e.userId === userId);
  const totalExpense = userExpenses.reduce((s, e) => s + e.amount, 0);
  const balance = monthlyIncome - totalExpense;

  document.getElementById("totalIncome").innerText =
    CURRENCY_SYMBOLS[userCurrency] + monthlyIncome;

  document.getElementById("totalExpense").innerText =
    CURRENCY_SYMBOLS[userCurrency] + totalExpense;

  document.getElementById("balance").innerText =
    CURRENCY_SYMBOLS[userCurrency] + balance;
}

/* ======================
   UPDATE EVERYTHING
====================== */
function updateAllDisplays() {
  loadExpenses();
  updateDashboard();
}

/* ======================
   PROFILE MODAL
====================== */
function toggleProfile() {
  document.getElementById("profileModal")?.classList.toggle("hidden");
}
