import { request, isMock, wait } from "./http";
import { getUser } from "./auth";
import type { ParcelStatus } from "../types";

export interface TrackEvent { status: ParcelStatus; at: string }
export interface MerchantOrder {
  id: number;
  trackingNumber: string;
  recipientName: string;
  dropoffAddress: string;
  weightKg: number;
  status: ParcelStatus;
  createdAt: string;
  events?: TrackEvent[];
}
export interface ApiCredential { id: number; clientId: string; active: boolean; createdAt: string }
export interface GeneratedCredential { id: number; clientId: string; clientSecret: string }

// Login (Member 1) user.merchantId return karanakota eka use wenawa.
// Ippa nathnam .env.local eke VITE_MERCHANT_ID (default 1).
const merchantId = (): number =>
  (getUser() as { merchantId?: number } | null)?.merchantId ??
  Number(import.meta.env.VITE_MERCHANT_ID ?? 1);

// Mock data is used only when VITE_API_URL is not set.
const orders: MerchantOrder[] = [
  { id: 1001, trackingNumber: "SD-000123", recipientName: "Nimal P.", dropoffAddress: "Kandy", weightKg: 2, status: "IN_TRANSIT", createdAt: "2026-10-27T09:00:00",
    events: [{ status: "PENDING", at: "2026-10-27T09:00:00" }, { status: "PICKED_UP", at: "2026-10-27T13:20:00" }, { status: "IN_TRANSIT", at: "2026-10-28T08:10:00" }] },
  { id: 1002, trackingNumber: "SD-000124", recipientName: "Kamala S.", dropoffAddress: "Galle", weightKg: 1, status: "DELIVERED", createdAt: "2026-10-25T10:00:00" },
  { id: 1003, trackingNumber: "SD-000125", recipientName: "R. Fernando", dropoffAddress: "Colombo 03", weightKg: 4, status: "CANCELLED", createdAt: "2026-10-24T11:30:00" },
  { id: 1004, trackingNumber: "SD-000126", recipientName: "A. Silva", dropoffAddress: "Matara", weightKg: 3, status: "PENDING", createdAt: "2026-10-29T15:45:00" },
];
let mockCreds: ApiCredential[] = [
  { id: 1, clientId: "sd_client_8f3a91c2", active: true, createdAt: "2026-10-20T09:00:00" },
];

export async function listMerchantOrders(): Promise<MerchantOrder[]> {
  if (!isMock) return request<MerchantOrder[]>("GET", `/v1/merchant/dashboard/orders?merchantId=${merchantId()}`);
  await wait(300);
  return orders.map((o) => ({ ...o }));
}

export async function getMerchantOrder(id: number): Promise<MerchantOrder> {
  if (!isMock) return request<MerchantOrder>("GET", `/v1/merchant/dashboard/orders/${id}?merchantId=${merchantId()}`);
  await wait(300);
  const found = orders.find((o) => o.id === id);
  if (!found) throw new Error("Order not found.");
  return { ...found };
}

export async function listCredentials(): Promise<ApiCredential[]> {
  if (!isMock) return request<ApiCredential[]>("GET", `/v1/merchant/credentials?merchantId=${merchantId()}`);
  await wait(300);
  return mockCreds.map((c) => ({ ...c }));
}

export async function generateCredential(): Promise<GeneratedCredential> {
  if (!isMock) return request<GeneratedCredential>("POST", "/v1/merchant/credentials", { merchantId: merchantId() });
  await wait(400);
  const id = Date.now();
  const clientId = "sd_" + Math.random().toString(36).slice(2, 12);
  mockCreds = [...mockCreds, { id, clientId, active: true, createdAt: new Date().toISOString() }];
  return { id, clientId, clientSecret: "mock_secret_" + Math.random().toString(16).slice(2, 14) };
}

export async function revokeCredential(id: number): Promise<void> {
  if (!isMock) {
    await request<void>("DELETE", `/v1/merchant/credentials/${id}`);
    return;
  }
  await wait(300);
  mockCreds = mockCreds.map((c) => (c.id === id ? { ...c, active: false } : c));
}