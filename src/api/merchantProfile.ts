import { request, isMock, wait } from "./http";

// Member 10: the signed-in merchant's business profile (GET/PUT /api/merchant/profile).

export interface MerchantProfile {
  id: string;
  businessName: string;
  registrationNo: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface MerchantProfileUpdate {
  contactName: string;
  phone: string;
  address: string;
}

// Mock data used only when VITE_API_URL is not set.
let mockProfile: MerchantProfile = {
  id: "1", businessName: "Demo Mart", registrationNo: "PV00012345", contactName: "Demo Merchant",
  email: "merchant@swiftdrop.test", phone: "0775678901", address: "25 Galle Road, Colombo 03",
  status: "APPROVED", submittedAt: "2026-11-20T18:48:00Z", reviewedAt: "2026-11-20T18:55:00Z",
};

export async function getMerchantProfile(): Promise<MerchantProfile> {
  if (!isMock) return request<MerchantProfile>("GET", "/merchant/profile");
  await wait(200);
  return { ...mockProfile };
}

export async function updateMerchantProfile(update: MerchantProfileUpdate): Promise<MerchantProfile> {
  if (!isMock) return request<MerchantProfile>("PUT", "/merchant/profile", update);
  await wait(200);
  mockProfile = { ...mockProfile, ...update, phone: update.phone.replace(/\s+/g, "") };
  return { ...mockProfile };
}
