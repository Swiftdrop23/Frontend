import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, StatusBadge } from "../../components/ui";
import { getMerchantOrder } from "../../api/merchant";
import { bookMerchantOrder, isBooked, shownStatus } from "../../api/merchantBooking";
import type { BookableOrder } from "../../api/merchantBooking";
import "./merchant.css";
import "./merchantOrders.css";

const STEPS: [string, string][] = [
  ["PENDING", "Order received"],
  ["CREATED", "Delivery booked"],
  ["PICKED_UP", "Picked Up"],
  ["IN_TRANSIT", "In Transit"],
  ["OUT_FOR_DELIVERY", "Out for Delivery"],
  ["DELIVERED", "Delivered"],
];
const fmt = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState<BookableOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = () => getMerchantOrder(Number(id)).then((o) => setOrder(o as BookableOrder)).catch((e: Error) => setError(e.message));
  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const book = async () => {
    if (!order) return;
    setBusy(true);
    setNotice("");
    try {
      await bookMerchantOrder(order.id);
      setNotice("Delivery booked. A dispatcher will assign a courier to collect it.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="notice error">{error}</div>;
  if (!order) return <p className="hint">Loading order...</p>;

  const status = shownStatus(order);
  const booked = isBooked(order);
  const reached = STEPS.findIndex(([s]) => s === status);
  const timeOf = (s: string, i: number) => {
    const ev = order.events?.find((e) => e.status === s);
    if (ev) return fmt(ev.at);
    if (i === 0) return fmt(order.createdAt);
    return i <= reached ? "" : "pending";
  };

  return (
    <>
      {!booked && (
        <div className="mo-banner mo-banner-row" role="status">
          <span>This order is waiting for you. Pack the item, then book the delivery so a courier collects it.</span>
          <button type="button" className="mo-book" disabled={busy} onClick={() => void book()}>{busy ? "Booking…" : "Book delivery"}</button>
        </div>
      )}
      {notice && <div className="notice ok" role="status">{notice}</div>}
      <div className="detail-grid">
        <Card title="Order">
          <div className="kv"><span>Tracking no.</span><b>{order.trackingNumber}</b></div>
          <div className="kv"><span>Status</span>{booked ? <StatusBadge status={status} /> : <span className="mo-new">New order</span>}</div>
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
