import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMerchantOrders } from "../../api/merchant";
import type { MerchantOrder } from "../../api/merchant";
import "../notifications/notifications.css";

const REFRESH_MS = 30_000;

const LABELS: Record<string, string> = {
  PENDING: "Order received", CREATED: "Order received", PICKED_UP: "Picked up", IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", FAILED: "Delivery failed", CANCELLED: "Cancelled",
};

interface Update { key: string; orderId: number; title: string; detail: string; at: string }

function toUpdates(orders: MerchantOrder[]): Update[] {
  return orders.flatMap((o) => {
    const events = o.events?.length ? o.events : [{ status: o.status, at: o.createdAt }];
    return events.map((e, i) => ({
      key: `${o.id}-${i}`, orderId: o.id, title: `${o.trackingNumber}: ${LABELS[e.status] ?? e.status}`,
      detail: `${o.recipientName} · ${o.dropoffAddress}`, at: e.at,
    }));
  }).sort((a, b) => b.at.localeCompare(a.at));
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Member 10: status updates for the merchant's orders (the same changes their webhook receives). */
export default function MerchantNotifications() {
  const [updates, setUpdates] = useState<Update[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const orders = await listMerchantOrders();
        if (!active) return;
        setUpdates(toUpdates(orders));
        setError(null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load notifications.");
      }
      if (active) timer = setTimeout(() => void load(), REFRESH_MS);
    };
    void load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <section className="notification-section">
      <div className="notification-toolbar">
        <p>Status updates for your orders. Your webhook gets the same updates.</p>
        <div className="notification-actions"><Link className="btn-outline" to="/merchant/webhooks">Webhook settings</Link></div>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {!updates && !error && <p className="card" role="status">Loading notifications…</p>}
      {updates && updates.length === 0 && <p className="card" role="status">No updates yet. Orders you create through the API will show their status changes here.</p>}
      {updates && updates.length > 0 && <ul className="card notification-list">
        {updates.map((u) => (
          <li key={u.key}>
            <span className="notification-dot" aria-hidden="true" />
            <Link className="notification-link" to={`/merchant/orders/${u.orderId}`}>
              <strong>{u.title}</strong><div className="notification-muted">{u.detail}</div>
              <span className="notification-cta">View order →</span>
            </Link>
            <span className="notification-muted">{formatTime(u.at)}</span>
          </li>
        ))}
      </ul>}
    </section>
  );
}
