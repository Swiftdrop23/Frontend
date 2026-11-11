export type Role = "CUSTOMER" | "MERCHANT" | "COURIER" | "DISPATCHER" | "ADMIN";

export interface User {
  name: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
}

export interface Profile {
  fullName: string;
  email: string;
  phone: string;
}

export interface Address {
  id?: number;
  label: string;
  address: string;
}

export interface Notice {
  type: "ok" | "error";
  text: string;
}

export interface OkResponse {
  ok: boolean;
}

export type ParcelStatus =
  | "CREATED"
  | "PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

// Mirrors the Parcel entity in the Spring Boot backend (swiftdrop.backend.parcel.Parcel).
export interface Parcel {
  id: number;
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  receiverAddress: string;
  status: ParcelStatus;
  createdAt: string;
}

export type NewParcel = Pick<Parcel, "senderName" | "receiverName" | "receiverAddress">;

export type MerchantStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface MerchantApplication {
  id: string;
  businessName: string;
  registrationNo: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: MerchantStatus;
  submittedAt: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}
export type MerchantOrderStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
export type ParcelSize = "SMALL" | "MEDIUM" | "LARGE";

export interface Merchant {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  registrationNo: string;
  address: string;
  registeredAt: string;
  status: MerchantStatus;
  rejectionReason?: string;
}

export interface MerchantOrder {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupAddress: string;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  parcelDescription: string;
  weight: number;
  size: ParcelSize;
  specialInstructions: string;
  deliveryFee: number;
  status: MerchantOrderStatus;
  createdAt: string;
}

export type NewMerchantOrder = Omit<MerchantOrder, "id" | "trackingNumber" | "deliveryFee" | "status" | "createdAt">;
