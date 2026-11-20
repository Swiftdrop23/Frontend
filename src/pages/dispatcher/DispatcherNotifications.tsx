import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllDispatcherParcels, getUnassignedParcels } from "../../api/dispatcher";
import "../notifications/notifications.css";
import "./dispatcher.css";

const REFRESH_MS = 30_000;

interface Alert {
  key: string;
  title: string;
  detail: string;
  at: string | null;
  link: string;
  action: string;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Member 10: what needs the dispatcher's attention — parcels waiting for a courier and failed deliveries. */
export default function DispatcherNotifications() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const [waiting, failed] = await Promise.all([getUnassignedParcels(), getAllDispatcherParcels("", "FAILED")]);
        if (!active) return;
        const next: Alert[] = [
          ...waiting.map((p) => ({
            key: `w-${p.id}`, title: "New parcel waiting for a courier", detail: `${p.trackingNumber} · ${p.routeSummary}`,
            at: p.createdAt, link: `/dispatcher/unassigned-parcels/${p.id}/assign`, action: "Assign a courier →",
          })),
          ...failed.map((p) => ({
            key: `f-${p.id}`, title: "Delivery failed",
            detail: `${p.trackingNumber} · ${p.receiverAddress}${p.assignedCourierName ? ` · ${p.assignedCourierName}` : ""}`,
            at: p.createdAt, link: "/dispatcher/all-parcels", action: "View in All Parcels →",
          })),
        ].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
        setAlerts(next);
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
        <p>Parcels that need your attention. This list refreshes every 30 seconds.</p>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {!alerts && !error && <p className="card" role="status">Loading notifications…</p>}
      {alerts && alerts.length === 0 && <p className="card" role="status">Nothing needs your attention right now. New parcels waiting for a courier will show here.</p>}
      {alerts && alerts.length > 0 && <ul className="card notification-list">
        {alerts.map((a) => (
          <li key={a.key}>
            <span className="notification-dot unread" aria-hidden="true" />
            <Link className="notification-link" to={a.link}>
              <strong>{a.title}</strong><div className="notification-muted">{a.detail}</div>
              <span className="notification-cta">{a.action}</span>
            </Link>
            <span className="notification-muted">{formatTime(a.at)}</span>
          </li>
        ))}
      </ul>}
    </section>
  );
}
