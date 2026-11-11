import type { ParcelStatus } from "../types";

// Mirrors the Member 3 backend responses (swiftdrop.backend.tracking.TrackingQueryService).

export interface TimelineStep {
  status: ParcelStatus;
  label: string;
  reached: boolean;
  current: boolean;
  at: string | null; // ISO time, null while pending or when the time was not recorded
}

/** Public tracking: status and timeline only, never names or addresses. */
export interface PublicTracking {
  trackingNumber: string;
  status: ParcelStatus;
  timeline: TimelineStep[];
}

/** Proof of delivery recorded by the courier (Member 7). Optional until that module is connected. */
export interface DeliveryProof {
  receivedBy: string;
  at: string;
  photoUrl?: string | null;
}

export interface ParcelDetails {
  trackingNumber: string;
  status: ParcelStatus;
  createdAt: string | null;
  from: string;
  to: string;
  recipientName: string;
  weightKg: number | string | null;
  feeAmount: number | string | null;
  feeCurrency: string | null;
  courierName?: string | null;
  proof?: DeliveryProof | null;
  timeline: TimelineStep[];
}

export interface HistoryItem {
  trackingNumber: string;
  createdAt: string | null;
  from: string;
  to: string;
  status: ParcelStatus;
  feeAmount: number | string | null;
  feeCurrency: string | null;
}

export interface HistoryPage {
  items: HistoryItem[];
  page: number;
  size: number;
  hasMore: boolean;
}

export type HistoryFilter = "all" | "delivered" | "in_progress" | "failed";
