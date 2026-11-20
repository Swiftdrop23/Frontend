import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { liveMapApi } from "../../api/liveMap";
import type { CourierStop } from "../../api/liveMap";
import "../notifications/notifications.css";

const REFRESH_MS = 30_000;

function describe(stop: CourierStop): { title: string; detail: string; action: string } {
  if (stop.status === "PENDING" && stop.tripActive) {
    return { title: "Pickup in progress", detail: `${stop.trackingNumber} · ${stop.pickupAddress ?? "Pickup address not set"}`, action: "Open Pickups & Drops →" };
  }
  if (stop.status === "PENDING") {
    return {
      title: "New pickup assigned to you",
      detail: `${stop.trackingNumber} · from ${stop.senderName ?? "the sender"}, ${stop.pickupAddress ?? "address not set"}`,
      action: "Start the pickup in Pickups & Drops →",
    };
  }
  return {
    title: stop.status === "OUT_FOR_DELIVERY" ? "Out for delivery" : "Ready to deliver",
    detail: `${stop.trackingNumber} · to ${stop.recipientName ?? "the recipient"}, ${stop.dropoffAddress ?? "address not set"}`,
    action: "Open Pickups & Drops →",
  };
}

/** Member 10: the courier's current work as notifications — new pickups first, then parcels to deliver. */
export default function CourierNotifications() {
  const [stops, setStops] = useState<CourierStop[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const next = await liveMapApi.stops();
        if (!active) return;
        setStops([...next].sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING")));
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
        <p>Your pickups and deliveries for today. This list refreshes every 30 seconds.</p>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {!stops && !error && <p className="card" role="status">Loading notifications…</p>}
      {stops && stops.length === 0 && <p className="card" role="status">No pickups or deliveries assigned to you right now.</p>}
      {stops && stops.length > 0 && <ul className="card notification-list">
        {stops.map((stop) => {
          const { title, detail, action } = describe(stop);
          return (
            <li key={stop.deliveryId}>
              <span className={stop.status === "PENDING" ? "notification-dot unread" : "notification-dot"} aria-hidden="true" />
              <Link className="notification-link" to="/courier/route-map">
                <strong>{title}</strong><div className="notification-muted">{detail}</div>
                <span className="notification-cta">{action}</span>
              </Link>
              <span />
            </li>
          );
        })}
      </ul>}
    </section>
  );
}
