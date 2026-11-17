import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, StatusBadge } from "../../components/ui";
import { getMerchantOrder } from "../../api/merchant";
import type { MerchantOrder } from "../../api/merchant";
import type { ParcelStatus } from "../../types";
import "./merchant.css";

const STEPS: [ParcelStatus, string][] = [
  ["PENDING", "Created"],
  ["PICKED_UP", "Picked Up"],
  ["IN_TRANSIT", "In Transit"],
  ["OUT_FOR_DELIVERY", "Out for Delivery"],
  ["DELIVERED", "Delivered"],
];
const fmt = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState<MerchantOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMerchantOrder(Number(id)).then(setOrder).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <div className="notice error">{error}</div>;
  if (!order) return <p className="hint">Loading order...</p>;

  const reached = STEPS.findIndex(([s]) => s === order.status);
  const timeOf = (s: ParcelStatus, i: number) => {
    const ev = order.events?.find((e) => e.status === s);
    if (ev) return fmt(ev.at);
    if (i === 0) return fmt(order.createdAt);
    return i <= reached ? "" : "pending";
  };

  return (
    <>
      <div className="detail-grid">
        <Card title="Order">
          <div className="kv"><span>Tracking no.</span><b>{order.trackingNumber}</b></div>
          <div className="kv"><span>Status</span><StatusBadge status={order.status} /></div>
          <div className="kv"><span>Recipient</span><b>{order.recipientName}</b></div>
          <div className="kv"><span>Address</span><b>{order.dropoffAddress}</b></div>
          <div className="kv"><span>Weight</span><b>{order.weightKg} kg</b></div>
          <div className="kv"><span>Created</span><b>{fmt(order.createdAt)}</b></div>
        </Card>
        <Card title="Delivery progress">
          <ol className="steps">
            {STEPS.map(([s, label], i) => (
              <li key={s} className={"step" + (i <= reached ? " done" : "")}>
                <span className="dot" />
                <div><b>{label}</b><small>{timeOf(s, i)}</small></div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <div style={{ marginTop: 18 }}>
        <Button onClick={() => nav("/merchant/orders")}>Back to orders</Button>
      </div>
    </>
  );
}