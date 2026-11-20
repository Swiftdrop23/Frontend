import { useEffect, useState } from "react";
import RecipientAlertOptions from "../../components/map/RecipientAlertOptions";
import { liveMapApi } from "../../api/liveMap";
import type { RecipientAlertsView } from "../../api/liveMap";
import { formatStatus, formatTime } from "../../api/notifications";

const RESULT_LABEL = { SENT: "Sent", LOGGED: "Recorded (demo, SMS gateway not connected)", FAILED: "Could not send" } as const;

/** Lets the sender change the recipient's SMS updates after booking and see what was already sent. */
export default function RecipientAlertsPanel({ trackingNumber }: { trackingNumber: string }) {
  const [view, setView] = useState<RecipientAlertsView | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    liveMapApi.recipientAlerts(trackingNumber).then((v) => { if (active) setView(v); }).catch(() => undefined);
    return () => { active = false; };
  }, [trackingNumber]);

  if (!view) return null;

  async function change(settings: RecipientAlertsView["settings"]) {
    setSaving(true); setMessage(null);
    try {
      setView(await liveMapApi.saveRecipientAlerts(trackingNumber, settings));
      setMessage("Saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="sd-live-card" aria-label="Recipient SMS updates">
      <div className="sd-live-head">
        <h2>Recipient updates</h2>
        {view.recipientPhone && <span className="sd-live-badge">SMS to {view.recipientPhone}</span>}
      </div>
      <RecipientAlertOptions value={view.settings} onChange={(s) => void change(s)} disabled={saving} />
      {message && <p className="sd-map-note" role="status">{message}</p>}
      {view.sent.length > 0 && (
        <ul className="sd-alert-log">
          {view.sent.map((a) => (
            <li key={a.status}>
              <strong>{formatStatus(a.status)}</strong> · {formatTime(a.createdAt)} · {RESULT_LABEL[a.result]}
              <span>{a.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
