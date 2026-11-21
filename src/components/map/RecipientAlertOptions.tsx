import { useId } from "react";
import { isEmail } from "../../api/liveMap";
import type { RecipientAlertSettings } from "../../api/liveMap";
import "./alertOptions.css";

const OPTIONS: [keyof Omit<RecipientAlertSettings, "email">, string][] = [
  ["pickedUp", "When the parcel is picked up"],
  ["outForDelivery", "When it is out for delivery"],
  ["delivered", "When it is delivered"],
];

/**
 * Member 10: optional email updates to the recipient. Nothing is sent unless the sender ticks a box and gives
 * the recipient's email. A div group (not a nested fieldset) so the Create Delivery form styles do not apply.
 */
export default function RecipientAlertOptions({ value, onChange, disabled = false }: {
  value: RecipientAlertSettings;
  onChange: (value: RecipientAlertSettings) => void;
  disabled?: boolean;
}) {
  const titleId = useId();
  const emailId = useId();
  const anyTicked = value.pickedUp || value.outForDelivery || value.delivered;
  const email = value.email ?? "";
  const emailError = anyTicked && email.trim() !== "" && !isEmail(email);
  const emailMissing = anyTicked && email.trim() === "";
  return (
    <div className="sd-alert-box" role="group" aria-labelledby={titleId}>
      <p id={titleId} className="sd-alert-box-title">Send email updates to the recipient (optional)</p>
      {OPTIONS.map(([key, label]) => (
        <label key={key} className="sd-alert-box-option">
          <input type="checkbox" checked={value[key]} disabled={disabled}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })} />
          <span>{label}</span>
        </label>
      ))}
      {anyTicked && (
        <div className="sd-alert-email">
          <label htmlFor={emailId}>Recipient email</label>
          <input id={emailId} type="email" value={email} disabled={disabled} placeholder="recipient@example.com" autoComplete="off"
            aria-invalid={emailError || emailMissing} onChange={(e) => onChange({ ...value, email: e.target.value })} />
          {emailMissing && <small className="sd-alert-email-hint">Add the recipient's email so they get these updates.</small>}
          {emailError && <small className="sd-alert-email-err" role="alert">Enter a valid email address.</small>}
        </div>
      )}
      <p className="sd-alert-box-note">Leave all unticked if the recipient should not get emails.</p>
    </div>
  );
}
