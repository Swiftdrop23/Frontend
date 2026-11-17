// Shared request helper for backend-backed application data.
const API = import.meta.env.VITE_API_URL;
export const isMock = !API;
export const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  if (!API) throw new Error("The backend is not configured. Set VITE_API_URL and restart the frontend.");
  const token = localStorage.getItem("token");
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || "Something went wrong. Please try again.";
    if (res.status === 401 && token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    throw new Error(message);
  }
  return data as T;
}
