import { useState } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../../api/notifications";
import type { NotificationPreferences } from "../../api/notifications";
import { useLiveResource } from "./useLiveResource";
import "./notifications.css";

const groups = [
  { title: "How should we notify you?", options: [["email", "Email"], ["sms", "SMS"]] },
  { title: "Notify me when", options: [
    ["pickedUp", "Parcel is picked up"], ["outForDelivery", "Out for delivery"],
    ["delivered", "Delivered"], ["failed", "Delivery failed"],
  ] },
] as const;

export default function NotificationSettings() {
  const [draft, setSettings] = useState<NotificationPreferences | null>(null);
  const live = useLiveResource(notificationApi.settings);
  const settings = draft ?? live.data;

  if (!settings) return <div className="card">
    <p role={live.error ? "alert" : "status"}>{live.error ?? "Loading settings…"}</p>
    <Link to="../notifications">Back to notifications</Link>
  </div>;

  return (
    <form className="card notification-settings" onSubmit={(event) => {
      event.preventDefault();
      void live.run(() => notificationApi.saveSettings(settings), "Settings saved.");
    }}>
      {groups.map(({ title, options }) => (
        <fieldset key={title}>
          <legend>{title}</legend>
          {options.map(([key, label]) => (
            <label className="notification-switch" key={key}>
              <input type="checkbox" role="switch" checked={settings[key]} disabled={live.busy} onChange={(event) => {
                setSettings({ ...settings, [key]: event.target.checked });
              }} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <div className="notification-actions">
        <button className="btn primary" type="submit" disabled={live.busy}>Save settings</button>
        <Link className="btn-outline" to="../notifications">Back to notifications</Link>
      </div>
      {live.notice && <p role="status">{live.notice}</p>}
    </form>
  );
}
