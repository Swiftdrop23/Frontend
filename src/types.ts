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
