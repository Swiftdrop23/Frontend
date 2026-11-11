import type { MerchantStatus, ParcelStatus } from "../../types";
import "./ui.css";

type BadgeStatus = ParcelStatus | MerchantStatus;

const LABELS: Record<BadgeStatus, string> = {
  CREATED: "Created",
  PENDING: "Pending",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function StatusBadge({ status }: { status: BadgeStatus }) {
  return <span className={`badge ${status.toLowerCase()}`}>{LABELS[status]}</span>;
}
