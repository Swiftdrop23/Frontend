import { request } from "./http";

export interface AdminProfile {
  fullName: string;
  email: string;
  role: string;
}

export function getAdminProfile(): Promise<AdminProfile> {
  return request<AdminProfile>("GET", "/admin/profile");
}
