import { request, isMock, wait } from "./http";
import type { NewParcel, Parcel } from "../types";

// THE PATTERN every api module follows:
//   - if VITE_API_URL is set  -> call the real backend through request()
//   - otherwise               -> return mock data, so the UI works before the backend is ready
// With VITE_API_URL=http://localhost:8080/api these paths hit /api/parcels on the Spring Boot backend.

let parcels: Parcel[] = [
  { id: 1, trackingNumber: "SD-1A2B3C4D", senderName: "Kamal", receiverName: "Nimal", receiverAddress: "No 12, Galle Road, Colombo", status: "IN_TRANSIT", createdAt: "2026-11-08T10:15:00" },
  { id: 2, trackingNumber: "SD-5E6F7A8B", senderName: "Kamal", receiverName: "Sunil", receiverAddress: "No 45, Peradeniya Road, Kandy", status: "PENDING", createdAt: "2026-11-09T09:30:00" },
  { id: 3, trackingNumber: "SD-9C0D1E2F", senderName: "Amali", receiverName: "Dilani", receiverAddress: "No 7, Main Street, Galle", status: "DELIVERED", createdAt: "2026-11-05T14:00:00" },
];
let nextId = 4;

export async function listParcels(): Promise<Parcel[]> {
  if (!isMock) return request<Parcel[]>("GET", "/parcels");
  await wait(300);
  return parcels.map((p) => ({ ...p }));
}

export async function createParcel(data: NewParcel): Promise<Parcel> {
  if (!isMock) return request<Parcel>("POST", "/parcels", data);
  await wait(400);
  const created: Parcel = {
    id: nextId++,
    trackingNumber: "SD-" + Math.random().toString(16).slice(2, 10).toUpperCase(),
    status: "PENDING",
    createdAt: new Date().toISOString(),
    ...data,
  };
  parcels = [created, ...parcels];
  return { ...created };
}

export async function trackParcel(trackingNumber: string): Promise<Parcel> {
  if (!isMock) return request<Parcel>("GET", `/parcels/track/${encodeURIComponent(trackingNumber)}`);
  await wait(300);
  const found = parcels.find((p) => p.trackingNumber === trackingNumber.trim().toUpperCase());
  if (!found) throw new Error("Parcel not found.");
  return { ...found };
}
