// If VITE_API_URL is not set (backend not ready), these functions return mock
// results so the UI can be tested. Set VITE_API_URL in .env to use the real API.
const API = import.meta.env.VITE_API_URL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body, mock) {
  if (!API) {
    await wait(500);
    return mock;
  }
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

// Mock only: admin@x.com, dispatcher@x.com, courier@x.com or merchant@x.com log in with that role; any other email is a customer.
function mockUser(email) {
  const k = email.split("@")[0].toLowerCase();
  const role = ["admin", "dispatcher", "courier", "merchant"].includes(k) ? k.toUpperCase() : "CUSTOMER";
  return { name: "Demo User", role };
}

export const login = (email, password) =>
  post("/auth/login", { email, password }, { token: "dev-token", user: mockUser(email) });
export const registerCustomer = (data) => post("/auth/register/customer", data, { ok: true });
export const registerMerchant = (data) => post("/auth/register/merchant", data, { ok: true });
export const forgotPassword = (email) => post("/auth/forgot-password", { email }, { ok: true });
export const resetPassword = (token, password) => post("/auth/reset-password", { token, password }, { ok: true });

export function saveSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}