import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { notificationApi } from "../../api/notifications";
import { useLiveResource } from "./useLiveResource";
import "./notifications.css";

export default function WebhookDelivery() {
  const { deliveryId } = useParams();
  return <DeliveryView key={deliveryId} deliveryId={deliveryId ?? ""} />;
}

function DeliveryView({ deliveryId }: { deliveryId: string }) {
  const load = useCallback(() => notificationApi.details(deliveryId), [deliveryId]);
  const live = useLiveResource(load);

  if (!live.data) return <div className="card">
    <p role={live.error ? "alert" : "status"}>
      {live.error ?? "Loading webhook delivery…"}
    </p><Link to="../webhooks">Back to webhooks</Link>
  </div>;

  const { delivery, payload, attempts } = live.data;

  return (
    <section className="notification-section">
      <div className="webhook-details">
        <div className="card">
          <h2>Event</h2>
          <dl>
            <div><dt>Event</dt><dd>{delivery.eventName}</dd></div>
            <div><dt>Parcel</dt><dd>{delivery.tracking}</dd></div>
            <div><dt>Result</dt><dd><span className="webhook-result" data-result={delivery.result}>{delivery.result}</span></dd></div>
            <div><dt>Attempts</dt><dd>{attempts.length}</dd></div>
          </dl>
        </div>
        <div className="card"><h2>Payload</h2><pre>{JSON.stringify(payload, null, 2)}</pre></div>
      </div>
      <div className="card notification-table">
        <table aria-label="Delivery attempts">
          <thead><tr><th>Attempt</th><th>Time</th><th>Response</th><th>Result</th></tr></thead>
          <tbody>{attempts.map(({ time, response, success }, index) => (
            <tr key={index}><td>{index + 1}</td><td>{time}</td><td>{response}</td>
              <td><span className="webhook-result" data-result={success ? "Success" : "Failed"}>{success ? "Success" : "Failed"}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="notification-actions">
        <button className="btn primary" type="button"
          disabled={live.busy || delivery.result === "Success" || delivery.result === "Pending"}
          onClick={() => void live.run(() => notificationApi.retry(delivery.id), "Retry queued.")}>Retry now</button>
        <Link className="btn-outline" to="../webhooks">Back to webhooks</Link>
      </div>
      {live.notice && <p role="status">{live.notice}</p>}
    </section>
  );
}
