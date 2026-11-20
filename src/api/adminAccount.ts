import { request } from "./http";

export interface AdminProfile {
  fullName: string;
  email: string;
  role: string;
}

// The signed-in admin's own account (Member 1: GET /api/auth/me works for every role).
export function getAdminProfile(): Promise<AdminProfile> {
  return request<AdminProfile>("GET", "/auth/me");
}
