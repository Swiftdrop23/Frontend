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
