import type { Merchant, MerchantApplication, MerchantOrder, MerchantStatus, NewMerchantOrder } from "../types";

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

const seedOrders: MerchantOrder[] = [
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

export async function getMerchantOrders(): Promise<MerchantOrder[]> {
  return read(ORDERS_KEY, seedOrders);
}

export async function createMerchantOrder(data: NewMerchantOrder): Promise<MerchantOrder> {
  const orders = await getMerchantOrders();
  const order: MerchantOrder = {
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
