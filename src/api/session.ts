// Member 1: keeps the signed-in session alive.
// Access tokens (JWT) live 15 minutes; a refresh token swaps them for new ones without a new login.

const API = import.meta.env.VITE_API_URL;
const TOKEN = "token";
const REFRESH = "refreshToken";
const USER = "user";

/** Reads the claims of a JWT without verifying it (the server verifies). Null for non-JWT tokens. */
export function decodeClaims(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(Array.from(atob(padded), (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
    const claims: unknown = JSON.parse(json);
    return typeof claims === "object" && claims !== null ? (claims as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** True when a JWT expires within the given number of seconds. Tokens without an expiry never count as expiring. */
export function expiresSoon(token: string | null, seconds = 60, nowMs = Date.now()): boolean {
  const exp = decodeClaims(token)?.exp;
  return typeof exp === "number" && exp * 1000 - nowMs < seconds * 1000;
}

function clearStored(): void {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
}

let refreshing: Promise<string | null> | null = null;

/** Swaps the stored refresh token for a new session. Returns the new access token, or null when signed out. */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = localStorage.getItem(REFRESH);
    if (!API || !refreshToken) return null;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearStored();
        return null;
      }
      const data = (await res.json()) as { token: string; refreshToken: string; user: { name: string; role: string } };
      localStorage.setItem(TOKEN, data.token);
      localStorage.setItem(REFRESH, data.refreshToken);
      const mid = decodeClaims(data.token)?.mid;
      localStorage.setItem(USER, JSON.stringify(typeof mid === "number" ? { ...data.user, merchantId: mid } : data.user));
      return data.token;
    } catch {
      return null; // network problem: keep the session and let the request fail normally
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** The access token to send now, refreshed first when it is about to expire. */
export async function freshToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN);
  if (!token || !expiresSoon(token)) return token;
  return (await refreshAccessToken()) ?? null;
}
