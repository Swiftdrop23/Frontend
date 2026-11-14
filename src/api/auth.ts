import type { OkResponse, Role, Session, User } from "../types";

const API = import.meta.env.VITE_API_URL;
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function post<T>(path: string, body: unknown, mock: T): Promise<T> {
  if (!API) {
    await wait(500);
    return mock;
  }
  let res: Response;
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
  return data as T;
}

// Mock only: admin@x.com, dispatcher@x.com, courier@x.com or merchant@x.com log in with that role; any other email is a customer.
function mockUser(email: string, forcedRole?: Role): User {
  if (forcedRole) return { name: "Demo User", role: forcedRole };
  const k = email.split("@")[0].toLowerCase();
  const special: Role[] = ["ADMIN", "DISPATCHER", "COURIER", "MERCHANT"];
  const role = special.find((r) => r.toLowerCase() === k) ?? "CUSTOMER";
  return { name: "Demo User", role };
}

export const login = (email: string, password: string, role?: Role) =>
  post<Session>("/auth/login", { email, password, ...(role ? { role } : {}) }, { token: "dev-token", user: mockUser(email, role) });
export const registerCustomer = (data: Record<string, string>) =>
  post<OkResponse>("/auth/register/customer", data, { ok: true });
export const registerMerchant = (data: Record<string, string>) =>
  post<OkResponse>("/auth/register/merchant", data, { ok: true });
export const forgotPassword = (email: string) =>
  post<OkResponse>("/auth/forgot-password", { email }, { ok: true });
export const resetPassword = (token: string, password: string) =>
  post<OkResponse>("/auth/reset-password", { token, password }, { ok: true });

export function saveSession({ token, user }: Session): void {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "null") as User | null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ---- Real-backend session handling (no effect in mock mode) ----

function jwtExpiry(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null; // not a real JWT (mock "dev-token")
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

let refreshing: Promise<Session> | null = null;

// Trades the HttpOnly refresh cookie for a new access token. Parallel callers share one request.
export function refreshSession(): Promise<Session> {
  if (!refreshing) {
    refreshing = post<Session>("/auth/refresh", {}, { token: "", user: { name: "", role: "CUSTOMER" } })
      .then((session) => {
        saveSession(session);
        return session;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// Returns the stored token, first renewing it if it expires within 30 seconds.
export async function getAccessToken(): Promise<string | null> {
  const token = localStorage.getItem("token");
  if (!token || !API) return token;
  const exp = jwtExpiry(token);
  if (exp === null || exp * 1000 - Date.now() > 30_000) return token;
  try {
    return (await refreshSession()).token;
  } catch {
    clearSession();
    return null;
  }
}

// Tells the server to revoke the refresh token and clear the cookie.
export async function logout(): Promise<void> {
  if (!API) return;
  try {
    await post<unknown>("/auth/logout", {}, {});
  } catch {
    // the local session is cleared regardless
  }
}
