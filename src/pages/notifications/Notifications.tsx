import { Link, useLocation } from "react-router-dom";
import { formatStatus, formatTime, notificationApi } from "../../api/notifications";
import { useLiveResource } from "./useLiveResource";
import "./notifications.css";

export default function Notifications() {
  const live = useLiveResource(notificationApi.list);
  // Customers can open a parcel's Live Tracking straight from its "Courier on the way" notification.
  const isCustomer = useLocation().pathname.startsWith("/customer");
  // The list is newest first, so the first row for a parcel is its latest update.
  const latestId = new Map<string, string | number>();
  for (const row of live.data ?? []) if (!latestId.has(row.trackingNumber)) latestId.set(row.trackingNumber, row.id);
  const updates = live.data?.map((row) => ({
      id: row.id, tracking: row.trackingNumber, title: formatStatus(row.status),
      time: formatTime(row.createdAt), read: row.read,
      // Live tracking only while the courier is still coming: once a newer update arrives (picked up etc.) the link goes.
      liveNow: row.status === "COURIER_ON_THE_WAY" && latestId.get(row.trackingNumber) === row.id,
    })) ?? [];

  return (
    <section className="notification-section">
      <div className="notification-toolbar">
        <p>Latest updates on your parcels</p>
        <div className="notification-actions">
          <Link className="btn-outline" to="settings">Settings</Link>
          <button className="btn-outline" type="button" disabled={live.busy || updates.every((row) => row.read)}
            onClick={() => void live.run(notificationApi.readAll, "All notifications marked as read.")}>
            Mark all as read
          </button>
        </div>
      </div>
      {updates.length === 0 && <p className="card" role={live.error ? "alert" : "status"}>
        {live.error ?? (live.data ? "No notifications yet." : "Loading notifications…")}
      </p>}
      {updates.length > 0 && <ul className="card notification-list">
        {updates.map(({ id, title, tracking, time, read, liveNow }) => (
          <li key={id}>
            <span className={read ? "notification-dot" : "notification-dot unread"} role="img"
              aria-label={read ? "Read" : "Unread"} />
            {isCustomer && liveNow
              ? <Link className="notification-link" to={`/customer/live-tracking?parcel=${encodeURIComponent(tracking)}`}>
                  <strong>{title}</strong><div className="notification-muted">{tracking}</div>
                  <span className="notification-cta">View live tracking →</span>
                </Link>
              : <div><strong>{title}</strong><div className="notification-muted">{tracking}</div></div>}
            <span className="notification-muted">{time}</span>
          </li>
        ))}
      </ul>}
      {live.notice && <p role="status">{live.notice}</p>}
    </section>
  );
}
