import { useState } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../../api/notifications";
import { useLiveResource } from "./useLiveResource";
import "./notifications.css";

export default function Webhooks() {
  const [draft, setUrl] = useState<string | null>(null);
  const live = useLiveResource(notificationApi.merchant);

  if (!live.data) return <p className="card" role={live.error ? "alert" : "status"}>
    {live.error ?? "Loading webhooks…"}
  </p>;

  const { endpoint, deliveries } = live.data;
  const url = draft ?? endpoint;
  function save() {
    void live.run(async () => {
      const saved = await notificationApi.saveEndpoint(url.trim());
      setUrl(saved.endpoint);
    }, "Endpoint saved.");
  }

  return (
    <section className="notification-section">
      <form className="card" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <h2>Webhook endpoint</h2>
        <div className="notification-actions endpoint-actions">
          <input aria-label="Webhook endpoint" type="url" required value={url} disabled={live.busy}
            placeholder="https://your-shop.example/hooks/swiftdrop" onChange={(event) => setUrl(event.target.value)} />
          <button type="submit" className="btn primary" disabled={live.busy}>Save</button>
          <button type="button" className="btn-outline" disabled={live.busy || !endpoint || url !== endpoint}
            onClick={() => void live.run(notificationApi.test, "Test delivery queued.")}>Send test</button>
        </div>
        {live.notice && <p role="status">{live.notice}</p>}
      </form>
      <div className="card notification-table">
        <h2>Delivery log</h2>
        <table>
          <thead><tr><th>Time</th><th>Parcel</th><th>Event</th><th>Attempt</th><th>Result</th></tr></thead>
          <tbody>{deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td>{delivery.time}</td><td>{delivery.tracking}</td>
              <td><Link to={delivery.id}>{delivery.event}</Link></td><td>{delivery.attemptCount}</td>
              <td><span className="webhook-result" data-result={delivery.result}>{delivery.result}</span></td>
            </tr>
          ))}</tbody>
        </table>
        {deliveries.length === 0 && <p>No deliveries yet.</p>}
      </div>
    </section>
  );
}
