import type { OkResponse, Role, Session, User } from "../types";
import { decodeClaims } from "./session";

const API = import.meta.env.VITE_API_URL;
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

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
  if (!res.ok) {
    const rawFieldErrors = data.fieldErrors ?? data.errors;
    const fieldErrors: Record<string, string> =
      rawFieldErrors && typeof rawFieldErrors === "object"
        ? Array.isArray(rawFieldErrors)
          ? Object.fromEntries(rawFieldErrors
              .filter((item: { field?: string; message?: string }) => item.field)
              .map((item: { field: string; message: string }) => [item.field, item.message]))
          : rawFieldErrors
        : {};
    throw new ApiError(res.status, data.message || "Something went wrong. Please try again.", fieldErrors);
  }
  return data as T;
}

// Mock only: admin@x.com, dispatcher@x.com, courier@x.com or merchant@x.com log in with that role; any other email is a customer.
function mockUser(email: string): User {
  const k = email.split("@")[0].toLowerCase();
  const special: Role[] = ["ADMIN", "DISPATCHER", "COURIER", "MERCHANT"];
  const role = special.find((r) => r.toLowerCase() === k) ?? "CUSTOMER";
  return { name: "Demo User", role };
}

/** Login response from the backend (Member 1): an access token plus a refresh token. */
export type LoginSession = Session & { refreshToken?: string; expiresIn?: number };

export const login = async (email: string, password: string): Promise<LoginSession> => {
  if (!API) {
    await wait(500);
    if (email.toLowerCase().endsWith("@merchant.test")) {
      let status = "PENDING";
      let rejectionReason = "";
      try {
        const merchant = JSON.parse(localStorage.getItem("swiftdrop.mock.merchant") ?? "{}");
        status = merchant.status ?? status;
        rejectionReason = merchant.rejectionReason ?? "";
      } catch {
        // Use the mock pending status.
      }
      if (status === "PENDING") throw new ApiError(403, "Your merchant application is still being reviewed.");
      if (status === "REJECTED") throw new ApiError(403, `Your merchant application was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`);
    }
  }
  return post<LoginSession>("/auth/login", { email, password }, { token: "dev-token", user: mockUser(email) });
};
export const registerCustomer = (data: Record<string, string>) =>
  post<OkResponse>("/auth/register/customer", data, { ok: true });
export const registerMerchant = (data: Record<string, string>) =>
  post<OkResponse>("/auth/register/merchant", data, { ok: true });
/** resetToken is only returned when the backend runs with SWIFTDROP_DEV_RESET_TOKENS=true (no mail server). */
export const forgotPassword = (email: string) =>
  post<OkResponse & { resetToken?: string }>("/auth/forgot-password", { email }, { ok: true });
export const resetPassword = (token: string, password: string) =>
  post<OkResponse>("/auth/reset-password", { token, password }, { ok: true });

export function saveSession({ token, user, refreshToken }: LoginSession): void {
  localStorage.setItem("token", token);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  else localStorage.removeItem("refreshToken");
  // Merchant accounts carry their merchants.id in the token ("mid"); the merchant dashboard needs it.
  const mid = decodeClaims(token)?.mid;
  localStorage.setItem("user", JSON.stringify(typeof mid === "number" ? { ...user, merchantId: mid } : user));
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
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

/** Signs out on the server too, so the refresh token can no longer be used. */
export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem("refreshToken");
  const token = localStorage.getItem("token");
  clearSession();
  if (!API || !token) return;
  try {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Already signed out locally; the refresh token simply expires on its own.
  }
}
