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
function mockUser(email: string): User {
  const k = email.split("@")[0].toLowerCase();
  const special: Role[] = ["ADMIN", "DISPATCHER", "COURIER", "MERCHANT"];
  const role = special.find((r) => r.toLowerCase() === k) ?? "CUSTOMER";
  return { name: "Demo User", role };
}

export const login = (email: string, password: string) =>
  post<Session>("/auth/login", { email, password }, { token: "dev-token", user: mockUser(email) });
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
  // Do not keep a frontend-only demo session when the backend is configured.
  if (API && localStorage.getItem("token") === "dev-token") {
    clearSession();
    return null;
  }
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
