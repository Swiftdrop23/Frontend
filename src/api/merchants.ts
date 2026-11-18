import { isMock, request, wait } from "./http";
import type { MerchantApplication, MerchantStatus } from "../types";

const APPLICATIONS_KEY = "swiftdrop.mock.merchantApplications";

const seedApplications: MerchantApplication[] = [
  {
    id: "merchant-1001",
    businessName: "Lanka Gifts",
    registrationNo: "PV-10001",
    contactName: "Nimal Perera",
    email: "gifts@example.com",
    phone: "0771234567",
    address: "12 Main Street, Colombo",
    status: "PENDING",
    submittedAt: "2026-11-18T09:20:00",
  },
  {
    id: "merchant-1002",
    businessName: "Ceylon Books",
    registrationNo: "PV-10002",
    contactName: "Shanika Silva",
    email: "books@example.com",
    phone: "0712345678",
    address: "45 Lake Road, Kandy",
    status: "PENDING",
    submittedAt: "2026-11-17T14:10:00",
  },
  {
    id: "merchant-1003",
    businessName: "Green Grocers",
    registrationNo: "PV-10003",
    contactName: "Amal Fernando",
    email: "green@example.com",
    phone: "0763456789",
    address: "8 Temple Road, Galle",
    status: "APPROVED",
    submittedAt: "2026-11-15T11:30:00",
  },
];

function readApplications(): MerchantApplication[] {
  try {
    const value = localStorage.getItem(APPLICATIONS_KEY);
    return value ? JSON.parse(value) as MerchantApplication[] : seedApplications;
  } catch {
    return seedApplications;
  }
}

function writeApplications(applications: MerchantApplication[]): void {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
}

export async function listMerchantApplications(status: MerchantStatus): Promise<MerchantApplication[]> {
  if (isMock) {
    await wait(400);
    return readApplications().filter((application) => application.status === status);
  }
  const data = await request<MerchantApplication[] | { content: MerchantApplication[] }>(
    "GET",
    `/admin/merchants?status=${status}`,
  );
  return Array.isArray(data) ? data : data.content;
}

export async function approveMerchant(id: string): Promise<MerchantApplication> {
  if (isMock) {
    await wait(350);
    const applications = readApplications();
    const selected = applications.find((application) => application.id === id);
    if (!selected) throw new Error("Application not found.");
    const updated = { ...selected, status: "APPROVED" as const, reviewedAt: new Date().toISOString() };
    writeApplications(applications.map((application) => application.id === id ? updated : application));
    return updated;
  }
  return request<MerchantApplication>("POST", `/admin/merchants/${id}/approve`);
}

export async function rejectMerchant(id: string, reason: string): Promise<MerchantApplication> {
  if (!reason.trim()) throw new Error("A rejection reason is required.");
  if (isMock) {
    await wait(350);
    const applications = readApplications();
    const selected = applications.find((application) => application.id === id);
    if (!selected) throw new Error("Application not found.");
    const updated = {
      ...selected,
      status: "REJECTED" as const,
      rejectionReason: reason.trim(),
      reviewedAt: new Date().toISOString(),
    };
    writeApplications(applications.map((application) => application.id === id ? updated : application));
    return updated;
  }
  return request<MerchantApplication>("POST", `/admin/merchants/${id}/reject`, { reason: reason.trim() });
}
