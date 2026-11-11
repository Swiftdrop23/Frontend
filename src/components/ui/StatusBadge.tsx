import type { ParcelStatus } from "../../types";
import "./ui.css";

const LABELS: Record<ParcelStatus, string> = {
  CREATED: "Created",
  PENDING: "Pending",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export default function StatusBadge({ status }: { status: ParcelStatus }) {
  return <span className={`badge ${status.toLowerCase()}`}>{LABELS[status]}</span>;
}
