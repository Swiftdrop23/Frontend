import type { RecipientAlertSettings } from "../../api/liveMap";

const OPTIONS: [keyof RecipientAlertSettings, string][] = [
  ["pickedUp", "When the parcel is picked up"],
  ["outForDelivery", "When it is out for delivery"],
  ["delivered", "When it is delivered"],
];

/** Ticks for the optional SMS updates the recipient gets. Nothing is sent unless the sender ticks a box. */
export default function RecipientAlertOptions({ value, onChange, disabled = false }: {
  value: RecipientAlertSettings;
  onChange: (value: RecipientAlertSettings) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="sd-alert-options">
      <legend>Send SMS updates to the recipient (optional)</legend>
      {OPTIONS.map(([key, label]) => (
        <label key={key}>
          <input type="checkbox" checked={value[key]} disabled={disabled}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })} />
          <span>{label}</span>
        </label>
      ))}
      <p className="sd-map-note">Leave all unticked if the recipient should not get messages.</p>
    </fieldset>
  );
}
