import { notificationApi } from "../../api/notifications";
import { useLiveResource } from "./useLiveResource";
import "./notifications.css";

export default function FailedWebhooks() {
  const live = useLiveResource(notificationApi.failed);

  function update(id: string, action: "retry" | "discard") {
    if (action === "discard" && !window.confirm("Discard this failed webhook?")) return;
    void live.run(
      () => action === "retry" ? notificationApi.retryFailed(id) : notificationApi.discard(id),
      action === "retry" ? "Retry queued." : "Webhook discarded.",
    );
  }

  return (
    <section className="notification-section">
      <p className="notification-muted">Webhooks that failed after all retries (dead-letter queue).</p>
      <div className="card notification-table">
        {!live.data ? <p role={live.error ? "alert" : "status"}>
          {live.error ?? "Loading failed webhooks…"}
        </p> : live.data.length === 0 ? <p>No failed webhooks.</p> : (
          <table>
            <thead><tr><th>Merchant</th><th>Parcel</th><th>Event</th><th>Attempts</th><th>Last error</th><th>Actions</th></tr></thead>
            <tbody>{live.data.map((delivery) => (
              <tr key={delivery.id}>
                <td>{delivery.merchant}</td><td>{delivery.tracking}</td><td>{delivery.event}</td>
                <td>{delivery.attemptCount}</td><td>{delivery.lastError}</td>
                <td><div className="notification-actions">
                  <button type="button" className="btn primary" disabled={live.busy} onClick={() => update(delivery.id, "retry")}>Retry</button>
                  <button type="button" className="btn-outline webhook-danger" disabled={live.busy} onClick={() => update(delivery.id, "discard")}>Discard</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {live.notice && <p role="status">{live.notice}</p>}
    </section>
  );
}
