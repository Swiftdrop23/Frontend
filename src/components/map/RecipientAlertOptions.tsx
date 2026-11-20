import { useId } from "react";
import type { RecipientAlertSettings } from "../../api/liveMap";
import "./alertOptions.css";

const OPTIONS: [keyof RecipientAlertSettings, string][] = [
  ["pickedUp", "When the parcel is picked up"],
  ["outForDelivery", "When it is out for delivery"],
  ["delivered", "When it is delivered"],
];

/**
 * Ticks for the optional SMS updates the recipient gets. Nothing is sent unless the sender ticks a box.
 * A div group (not a nested fieldset) so the Create Delivery form's fieldset/legend/label styles do not apply.
 */
export default function RecipientAlertOptions({ value, onChange, disabled = false }: {
  value: RecipientAlertSettings;
  onChange: (value: RecipientAlertSettings) => void;
  disabled?: boolean;
}) {
  const titleId = useId();
  return (
    <div className="sd-alert-box" role="group" aria-labelledby={titleId}>
      <p id={titleId} className="sd-alert-box-title">Send SMS updates to the recipient (optional)</p>
      {OPTIONS.map(([key, label]) => (
        <label key={key} className="sd-alert-box-option">
          <input type="checkbox" checked={value[key]} disabled={disabled}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })} />
          <span>{label}</span>
        </label>
      ))}
      <p className="sd-alert-box-note">Leave all unticked if the recipient should not get messages.</p>
    </div>
  );
}
