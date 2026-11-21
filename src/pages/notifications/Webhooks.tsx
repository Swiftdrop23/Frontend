import { useState } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../../api/notifications";
import { useLiveResource } from "./useLiveResource";
import "./notifications.css";
import "./webhooks.css";

/*
 * Merchant webhooks, in plain words: SwiftDrop tells the shop's own server whenever one of its orders
 * changes status, so the shop can update its website (or email its shoppers) automatically.
 */

const SAMPLE = `{
  "event": "parcel.status.changed",
  "trackingNumber": "SD-3840D22FB3",
  "newStatus": "PICKED_UP"
}`;

const RESULT_TEXT: Record<string, string> = {
  Success: "Delivered",
  Retrying: "Retrying",
  Pending: "Sending",
  "Failed (DLQ)": "Failed",
};

export default function Webhooks() {
  const [draft, setUrl] = useState<string | null>(null);
  const live = useLiveResource(notificationApi.merchant);

  if (!live.data) return <p className="card" role={live.error ? "alert" : "status"}>
    {live.error ?? "Loading webhooks..."}
  </p>;

  const { endpoint, deliveries } = live.data;
  const url = draft ?? endpoint ?? "";
  const connected = Boolean(endpoint);
  const count = (r: string) => deliveries.filter((d) => d.result === r).length;

  function save() {
    void live.run(async () => {
      const saved = await notificationApi.saveEndpoint(url.trim());
      setUrl(saved.endpoint);
    }, "Saved. SwiftDrop will send order updates to this address.");
  }

  return (
    <section className="notification-section wh">
      <div className="wh-hero">
        <div>
          <p className="wh-eyebrow">Webhooks</p>
          <h2>Get order updates on your shop's server</h2>
          <p>
            Each time one of your orders changes (booked, picked up, out for delivery, delivered), SwiftDrop sends a
            short message to your server. Your shop can then update the order on its website automatically.
          </p>
        </div>
        <span className={connected ? "wh-pill on" : "wh-pill"}>{connected ? "Connected" : "Not connected"}</span>
      </div>

      <form className="card wh-step" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <div className="wh-step-head"><span className="wh-num">1</span><h3>Where should we send updates?</h3></div>
        <p className="notification-muted">The web address on your shop's server that receives SwiftDrop updates. It must start with https://</p>
        <div className="notification-actions endpoint-actions">
          <input aria-label="Webhook endpoint" type="url" required value={url} disabled={live.busy}
            placeholder="https://your-shop.example/hooks/swiftdrop" onChange={(event) => setUrl(event.target.value)} />
          <button type="submit" className="btn primary" disabled={live.busy || !url.trim() || url === endpoint}>Save</button>
        </div>
        <p className="wh-hint">
          No server yet? Open <a href="https://webhook.site" target="_blank" rel="noreferrer">webhook.site</a>, copy
          your free test URL and paste it here to watch the updates arrive.
        </p>
      </form>

      <div className="card wh-step">
        <div className="wh-step-head"><span className="wh-num">2</span><h3>Check that it works</h3></div>
        <p className="notification-muted">Send a test message to your address. It appears in the list below within a few seconds.</p>
        <div className="notification-actions">
          <button type="button" className="btn-outline" disabled={live.busy || !connected || url !== endpoint}
            onClick={() => void live.run(notificationApi.test, "Test sent. Refresh the list in a moment.")}>
            Send a test update
          </button>
          {!connected && <span className="notification-muted">Save an address first.</span>}
        </div>
      </div>

      {live.notice && <p className="wh-notice" role="status">{live.notice}</p>}

      <div className="card notification-table wh-step">
        <div className="wh-step-head"><span className="wh-num">3</span><h3>Updates sent to your shop</h3></div>
        {deliveries.length > 0 && (
          <div className="wh-stats">
            <span><b>{count("Success")}</b> delivered</span>
            <span><b>{count("Retrying") + count("Pending")}</b> retrying</span>
            <span><b>{count("Failed (DLQ)")}</b> failed</span>
          </div>
        )}
        {deliveries.length === 0 ? (
          <p className="notification-muted">No updates sent yet. They start when your orders change status.</p>
        ) : (
          <table>
            <thead><tr><th>Time</th><th>Order</th><th>Update</th><th>Tries</th><th>Result</th></tr></thead>
            <tbody>{deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td>{delivery.time}</td>
                <td>{delivery.tracking}</td>
                <td><Link to={delivery.id}>{delivery.event}</Link></td>
                <td>{delivery.attemptCount}</td>
                <td><span className="webhook-result" data-result={delivery.result}>{RESULT_TEXT[delivery.result] ?? delivery.result}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <p className="wh-hint">If your server is down, SwiftDrop tries again automatically. Open an update to see each try.</p>
      </div>

      <details className="card wh-dev">
        <summary>For developers: what SwiftDrop sends</summary>
        <p className="notification-muted">A JSON <code>POST</code> to your address for every status change. Reply with any 2xx status to confirm.</p>
        <pre>{SAMPLE}</pre>
      </details>
    </section>
  );
}
