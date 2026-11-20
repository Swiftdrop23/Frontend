import { request, isMock, wait } from "./http";
import { getUser } from "./auth";
import type { Address, OkResponse, Profile } from "../types";

// Member 1 backend: /api/auth/me (profile), /api/auth/me/password, /api/auth/me/addresses.
// Mock data is used until the backend is configured (VITE_API_URL not set).
let profile: Profile | null = null;
let addresses: Address[] = [
  { id: 1, label: "Home", address: "No. 12, Galle Road, Colombo 03" },
  { id: 2, label: "Work", address: "No. 45, Peradeniya Road, Kandy" },
];
let nextId = 3;

export async function getProfile(): Promise<Profile> {
  if (!isMock) return request<Profile>("GET", "/auth/me");
  await wait(300);
  if (!profile) profile = { fullName: getUser()?.name || "Demo User", email: "demo@example.com", phone: "" };
  return { ...profile };
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  if (!isMock) return request<Profile>("PUT", "/auth/me", data);
  await wait(400);
  profile = { ...(profile ?? { fullName: "", email: "", phone: "" }), ...data };
  return { ...profile };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<OkResponse> {
  if (!isMock) return request<OkResponse>("POST", "/auth/me/password", { currentPassword, newPassword });
  await wait(400);
  return { ok: true };
}

export async function listAddresses(): Promise<Address[]> {
  if (!isMock) return request<Address[]>("GET", "/auth/me/addresses");
  await wait(300);
  return addresses.map((a) => ({ ...a }));
}

export async function saveAddress(a: Address): Promise<Address> {
  if (!isMock) {
    return a.id
      ? request<Address>("PUT", `/auth/me/addresses/${a.id}`, a)
      : request<Address>("POST", "/auth/me/addresses", a);
  }
  await wait(300);
  if (a.id) addresses = addresses.map((x) => (x.id === a.id ? { ...x, ...a } : x));
  else addresses = [...addresses, { ...a, id: nextId++ }];
  return a;
}

export async function deleteAddress(id: number): Promise<OkResponse> {
  if (!isMock) {
    await request<unknown>("DELETE", `/auth/me/addresses/${id}`);
    return { ok: true };
  }
  await wait(300);
  addresses = addresses.filter((a) => a.id !== id);
  return { ok: true };
}
