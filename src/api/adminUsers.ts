import { request, isMock, wait } from "./http";

// Member 1: admin user management (GET/POST /api/admin/users, PATCH /{id}/role, PATCH /{id}/status).

export type ManagedRole = "CUSTOMER" | "MERCHANT" | "COURIER" | "DISPATCHER" | "ADMIN";
export const STAFF_ROLES: ManagedRole[] = ["CUSTOMER", "COURIER", "DISPATCHER", "ADMIN"];

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: ManagedRole;
  status: string;
  enabled: boolean;
  createdAt: string | null;
}

export interface NewUser {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: ManagedRole;
}

// Mock data used only when VITE_API_URL is not set.
let mockUsers: ManagedUser[] = [
  { id: "1", fullName: "Demo Admin", email: "admin@swiftdrop.test", phone: "0774567890", role: "ADMIN", status: "ACTIVE", enabled: true, createdAt: "2026-11-19T10:00:00Z" },
  { id: "2", fullName: "Demo Dispatcher", email: "dispatcher@swiftdrop.test", phone: "0773456789", role: "DISPATCHER", status: "ACTIVE", enabled: true, createdAt: "2026-11-19T10:00:00Z" },
  { id: "3", fullName: "Demo Courier", email: "courier@swiftdrop.test", phone: "0772345678", role: "COURIER", status: "ACTIVE", enabled: true, createdAt: "2026-11-19T10:00:00Z" },
  { id: "4", fullName: "Demo Customer", email: "customer@swiftdrop.test", phone: "0771234567", role: "CUSTOMER", status: "ACTIVE", enabled: true, createdAt: "2026-11-19T10:00:00Z" },
];

export async function listUsers(role = "", query = ""): Promise<ManagedUser[]> {
  if (!isMock) {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    return request<ManagedUser[]>("GET", `/admin/users${qs ? `?${qs}` : ""}`);
  }
  await wait(250);
  const q = query.trim().toLowerCase();
  return mockUsers
    .filter((u) => !role || u.role === role)
    .filter((u) => !q || u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q))
    .map((u) => ({ ...u }));
}

export async function createUser(data: NewUser): Promise<ManagedUser> {
  if (!isMock) return request<ManagedUser>("POST", "/admin/users", data);
  await wait(300);
  if (mockUsers.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  const user: ManagedUser = {
    id: String(Date.now()), fullName: data.fullName.trim(), email: data.email.trim(), phone: data.phone.trim() || null,
    role: data.role, status: "ACTIVE", enabled: true, createdAt: new Date().toISOString(),
  };
  mockUsers = [user, ...mockUsers];
  return { ...user };
}

export async function changeRole(id: string, role: ManagedRole): Promise<ManagedUser> {
  if (!isMock) return request<ManagedUser>("PATCH", `/admin/users/${encodeURIComponent(id)}/role`, { role });
  await wait(250);
  mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, role } : u));
  const found = mockUsers.find((u) => u.id === id);
  if (!found) throw new Error("User not found.");
  return { ...found };
}

export async function setUserEnabled(id: string, enabled: boolean): Promise<ManagedUser> {
  if (!isMock) return request<ManagedUser>("PATCH", `/admin/users/${encodeURIComponent(id)}/status`, { enabled });
  await wait(250);
  mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, enabled, status: enabled ? "ACTIVE" : "DISABLED" } : u));
  const found = mockUsers.find((u) => u.id === id);
  if (!found) throw new Error("User not found.");
  return { ...found };
}
