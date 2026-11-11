import { request, isMock, wait } from "./http";
import type { ParcelStatus } from "../types";
import type { HistoryFilter, HistoryPage, ParcelDetails, PublicTracking, TimelineStep } from "../types/tracking";

// Member 3: Tracking, History & Receipt.
// With VITE_API_URL=http://localhost:8080/api these call /api/v1/tracking/... on the Spring Boot backend.
// Without it they return the mock parcels below (same data as the UI designs).

export const NOT_FOUND_MESSAGE = "We could not find that parcel.";

const STEPS: [ParcelStatus, string][] = [
  ["CREATED", "Created"], ["PICKED_UP", "Picked Up"], ["IN_TRANSIT", "In Transit"],
  ["OUT_FOR_DELIVERY", "Out for Delivery"], ["DELIVERED", "Delivered"],
];

/** Mock-only timeline builder; the real one lives in the backend (TrackingTimeline). */
function mockTimeline(reachedTimes: string[], failedAt?: string): TimelineStep[] {
  const last = reachedTimes.length - 1;
  const steps: TimelineStep[] = STEPS.map(([status, label], i) => ({
    status, label, reached: i <= last, current: !failedAt && i === last, at: reachedTimes[i] ?? null,
  }));
  if (failedAt) steps.push({ status: "FAILED", label: "Failed", reached: true, current: true, at: failedAt });
  return steps;
}

const mockParcels: ParcelDetails[] = [
  {
    trackingNumber: "SD-000123", status: "IN_TRANSIT", createdAt: "2026-10-27T08:10:00Z", from: "Colombo 03", to: "Kandy",
    recipientName: "Nimal P.", weightKg: 2, feeAmount: 850, feeCurrency: "LKR", courierName: "Kamal S.", proof: null,
    timeline: mockTimeline(["2026-10-27T08:10:00Z", "2026-10-27T10:25:00Z", "2026-10-27T13:40:00Z"]),
  },
  {
    trackingNumber: "SD-000099", status: "DELIVERED", createdAt: "2026-10-20T06:30:00Z", from: "Colombo 03", to: "Galle",
    recipientName: "Kamala S.", weightKg: 2, feeAmount: 950, feeCurrency: "LKR", courierName: "Ruwan D.",
    proof: { receivedBy: "Kamala S.", at: "2026-10-20T08:40:00Z", photoUrl: null },
    timeline: mockTimeline(["2026-10-20T06:30:00Z", "2026-10-20T07:05:00Z", "2026-10-20T07:20:00Z",
      "2026-10-20T08:00:00Z", "2026-10-20T08:40:00Z"]),
  },
  {
    trackingNumber: "SD-000087", status: "FAILED", createdAt: "2026-10-14T05:00:00Z", from: "Kandy", to: "Colombo",
    recipientName: "Sunil W.", weightKg: 1.5, feeAmount: 850, feeCurrency: "LKR", courierName: "Kamal S.", proof: null,
    timeline: mockTimeline(["2026-10-14T05:00:00Z", "2026-10-14T06:15:00Z", "2026-10-14T08:00:00Z",
      "2026-10-14T11:30:00Z"], "2026-10-14T12:45:00Z"),
  },
  {
    trackingNumber: "SD-000071", status: "DELIVERED", createdAt: "2026-10-02T04:20:00Z", from: "Colombo", to: "Negombo",
    recipientName: "Dilani R.", weightKg: 0.8, feeAmount: 600, feeCurrency: "LKR", courierName: "Ruwan D.",
    proof: { receivedBy: "Dilani R.", at: "2026-10-02T09:05:00Z", photoUrl: null },
    timeline: mockTimeline(["2026-10-02T04:20:00Z", "2026-10-02T05:00:00Z", "2026-10-02T06:10:00Z",
      "2026-10-02T08:30:00Z", "2026-10-02T09:05:00Z"]),
  },
];

const normalise = (trackingNumber: string) => trackingNumber.trim().toUpperCase();

function findMock(trackingNumber: string): ParcelDetails {
  const found = mockParcels.find((p) => p.trackingNumber === normalise(trackingNumber));
  if (!found) throw new Error(NOT_FOUND_MESSAGE);
  return structuredClone(found);
}

function matchesFilter(status: ParcelStatus, filter: HistoryFilter): boolean {
  switch (filter) {
    case "delivered": return status === "DELIVERED";
    case "failed": return status === "FAILED";
    case "in_progress": return !["DELIVERED", "FAILED", "CANCELLED"].includes(status);
    default: return true;
  }
}

/** Public mobile tracking page. No login needed. */
export async function trackPublic(trackingNumber: string): Promise<PublicTracking> {
  if (!isMock) return request<PublicTracking>("GET", `/v1/tracking/public/${encodeURIComponent(normalise(trackingNumber))}`);
  await wait(300);
  const { status, timeline } = findMock(trackingNumber);
  return { trackingNumber: normalise(trackingNumber), status, timeline };
}

/** Delivery History list for the signed-in customer. */
export async function getHistory(filter: HistoryFilter = "all", page = 0, size = 20): Promise<HistoryPage> {
  if (!isMock) {
    const query = new URLSearchParams({ filter, page: String(page), size: String(size) });
    return request<HistoryPage>("GET", `/v1/tracking/history?${query}`);
  }
  await wait(300);
  const rows = mockParcels.filter((p) => matchesFilter(p.status, filter));
  const items = rows.slice(page * size, page * size + size).map(({ trackingNumber, createdAt, from, to, status, feeAmount, feeCurrency }) =>
    ({ trackingNumber, createdAt, from, to, status, feeAmount, feeCurrency }));
  return { items, page, size, hasMore: rows.length > (page + 1) * size };
}

/**
 * Server-Sent Events URL for live updates, or null in mock mode (the page then refreshes on a timer).
 * The stream sends the public view only, so no login token is needed (EventSource cannot send headers).
 */
export function liveTrackingUrl(trackingNumber: string): string | null {
  const base = import.meta.env.VITE_API_URL;
  if (!base) return null;
  return `${base}/v1/tracking/live/${encodeURIComponent(normalise(trackingNumber))}`;
}

/**
 * Downloads the receipt PDF and saves it as SwiftDrop-receipt-<tracking>.pdf.
 * Returns false in mock mode (no backend), so the page can fall back to the print dialog.
 */
export async function downloadReceiptPdf(trackingNumber: string): Promise<boolean> {
  const base = import.meta.env.VITE_API_URL;
  if (!base) return false;
  const tracking = normalise(trackingNumber);
  const token = localStorage.getItem("token");
  let res: Response;
  try {
    res = await fetch(`${base}/v1/tracking/parcels/${encodeURIComponent(tracking)}/receipt.pdf`, {
      headers: { Accept: "application/pdf", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "The receipt could not be downloaded. Please try again.");
  }
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = `SwiftDrop-receipt-${tracking}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}

/** Delivery details, receipt and Live Tracking pages. Only the parcel's owner gets a result. */
export async function getParcelDetails(trackingNumber: string): Promise<ParcelDetails> {
  if (!isMock) return request<ParcelDetails>("GET", `/v1/tracking/parcels/${encodeURIComponent(normalise(trackingNumber))}`);
  await wait(300);
  return findMock(trackingNumber);
}
