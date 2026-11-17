import { request, isMock, wait } from "./http";
import { getUser } from "./auth";
import type {
  Merchant,
  MerchantApplication,
  MerchantOrder as StoredMerchantOrder,
  MerchantStatus,
  NewMerchantOrder,
  ParcelStatus,
} from "../types";

/* =====================================================================
 * Member 4 — Merchant registration & approval (local mock storage)
 * ===================================================================== */

const MERCHANT_KEY = "swiftdrop.mock.merchant";
const ORDERS_KEY = "swiftdrop.mock.merchant.orders";
const APPLICATIONS_KEY = "swiftdrop.mock.merchantApplications";

const seedMerchant: Merchant = {
  id: "merchant-demo",
  businessName: "SwiftDrop Demo Store",
  ownerName: "Demo Merchant",
  email: "merchant@x.com",
  phone: "0771234567",
  registrationNo: "PV-10001",
  address: "12 Main Street, Colombo",
  registeredAt: "2026-01-15",
  status: "APPROVED",
};

const seedOrders: StoredMerchantOrder[] = [
  {
    id: "ORD-1001",
    trackingNumber: "SD1001001",
    customerName: "Amal Perera",
    customerEmail: "amal@example.com",
    customerPhone: "0712345678",
    pickupContactName: "SwiftDrop Demo Store",
    pickupContactPhone: "0771234567",
    pickupAddress: "12 Main Street, Colombo",
    receiverName: "Amal Perera",
    receiverPhone: "0712345678",
    deliveryAddress: "45 Lake Road, Kandy",
    parcelDescription: "Clothing",
    weight: 1.2,
    size: "MEDIUM",
    specialInstructions: "Call before delivery",
    deliveryFee: 850,
    status: "IN_TRANSIT",
    createdAt: "2026-02-14",
  },
  {
    id: "ORD-1002",
    trackingNumber: "SD1001002",
    customerName: "Nadeesha Silva",
    customerEmail: "nadeesha@example.com",
    customerPhone: "0723456789",
    pickupContactName: "SwiftDrop Demo Store",
    pickupContactPhone: "0771234567",
    pickupAddress: "12 Main Street, Colombo",
    receiverName: "Nadeesha Silva",
    receiverPhone: "0723456789",
    deliveryAddress: "8 Temple Road, Galle",
    parcelDescription: "Books",
    weight: 0.8,
    size: "SMALL",
    specialInstructions: "",
    deliveryFee: 550,
    status: "DELIVERED",
    createdAt: "2026-02-10",
  },
];

const read = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown): void => localStorage.setItem(key, JSON.stringify(value));

export async function registerMerchantMock(data: Omit<Merchant, "id" | "registeredAt" | "status">): Promise<Merchant> {
  const merchant: Merchant = {
    ...data,
    id: `merchant-${Date.now()}`,
    registeredAt: new Date().toISOString().slice(0, 10),
    status: "PENDING",
  };
  write(MERCHANT_KEY, merchant);

  let applications: MerchantApplication[] = [];
  try {
    applications = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) ?? "[]") as MerchantApplication[];
  } catch {
    applications = [];
  }
  applications.unshift({
    id: merchant.id,
    businessName: merchant.businessName,
    registrationNo: merchant.registrationNo,
    contactName: merchant.ownerName,
    email: merchant.email,
    phone: merchant.phone,
    address: merchant.address,
    status: "PENDING",
    submittedAt: new Date().toISOString(),
  });
  write(APPLICATIONS_KEY, applications);
  return merchant;
}

export async function getMerchant(): Promise<Merchant> {
  return read(MERCHANT_KEY, seedMerchant);
}

export function isMerchantApproved(): boolean {
  return read<Merchant>(MERCHANT_KEY, seedMerchant).status === "APPROVED";
}

export async function updateMerchant(data: Omit<Merchant, "id" | "registeredAt" | "status">): Promise<Merchant> {
  const current = await getMerchant();
  const updated = { ...current, ...data };
  write(MERCHANT_KEY, updated);
  return updated;
}

export async function getMerchantOrders(): Promise<StoredMerchantOrder[]> {
  return read(ORDERS_KEY, seedOrders);
}

export async function createMerchantOrder(data: NewMerchantOrder): Promise<StoredMerchantOrder> {
  const orders = await getMerchantOrders();
  const order: StoredMerchantOrder = {
    ...data,
    id: `ORD-${1000 + orders.length + 1}`,
    trackingNumber: `SD${Date.now().toString().slice(-8)}`,
    deliveryFee: Math.round(data.weight * 500 + 250),
    status: "PENDING",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  write(ORDERS_KEY, [order, ...orders]);
  return order;
}

export async function getAdminMerchants(): Promise<Merchant[]> {
  const current = await getMerchant();
  return [current, { ...seedMerchant, id: "merchant-second", businessName: "Lanka Gifts", email: "gifts@example.com", status: "PENDING", registeredAt: "2026-02-20" }];
}

export async function setMerchantStatus(id: string, status: MerchantStatus, rejectionReason?: string): Promise<Merchant[]> {
  const merchants = await getAdminMerchants();
  const updated = merchants.map((merchant) => merchant.id === id ? { ...merchant, status, rejectionReason } : merchant);
  const selected = updated.find((merchant) => merchant.id === id);
  if (selected) write(MERCHANT_KEY, selected);
  return updated;
}

/* =====================================================================
 * Member 5 — Merchant dashboard: orders & API credentials
 * ===================================================================== */

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

// Uses user.merchantId once login (Member 1) returns it; otherwise VITE_MERCHANT_ID from .env.local (default 1).
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