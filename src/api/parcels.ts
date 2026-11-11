import { request, isMock, wait } from "./http";
import type { NewParcel, Parcel } from "../types";

// THE PATTERN every api module follows:
//   - if VITE_API_URL is set  -> call the real backend through request()
//   - otherwise               -> return mock data, so the UI works before the backend is ready
// With VITE_API_URL=http://localhost:8080/api these paths hit /api/parcels on the Spring Boot backend.

const parcels: Parcel[] = [
  { id: 1, trackingNumber: "SD-1A2B3C4D", senderName: "Kamal", receiverName: "Nimal", receiverAddress: "No 12, Galle Road, Colombo", status: "IN_TRANSIT", createdAt: "2026-11-08T10:15:00" },
  { id: 2, trackingNumber: "SD-5E6F7A8B", senderName: "Kamal", receiverName: "Sunil", receiverAddress: "No 45, Peradeniya Road, Kandy", status: "PENDING", createdAt: "2026-11-09T09:30:00" },
  { id: 3, trackingNumber: "SD-9C0D1E2F", senderName: "Amali", receiverName: "Dilani", receiverAddress: "No 7, Main Street, Galle", status: "DELIVERED", createdAt: "2026-11-05T14:00:00" },
];

export async function listParcels(): Promise<Parcel[]> {
  if (!isMock) return request<Parcel[]>("GET", "/parcels");
  await wait(300);
  return parcels.map((p) => ({ ...p }));
}

/** @deprecated Legacy module only. Member 2 customers use quote confirmation. */
export async function createParcel(data: NewParcel): Promise<Parcel> {
  if (isMock) throw new Error("Use delivery quote confirmation to create a parcel.");
  // The backend permits this only while Member 2 persistence is disabled.
  // A configured server decides readiness; never fabricate saved parcels here.
  return request<Parcel>("POST", "/parcels", data);
}

export async function trackParcel(trackingNumber: string): Promise<Parcel> {
  if (!isMock) return request<Parcel>("GET", `/parcels/track/${encodeURIComponent(trackingNumber)}`);
  await wait(300);
  const found = parcels.find((p) => p.trackingNumber === trackingNumber.trim().toUpperCase());
  if (!found) throw new Error("Parcel not found.");
  return { ...found };
}
