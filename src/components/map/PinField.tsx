import { lazy, Suspense, useState } from "react";
import type { LatLng } from "./geo";

// The map library loads only when the customer opens a picker.
const LocationPinPicker = lazy(() => import("./LocationPinPicker"));

export interface PinFieldProps {
  kind: "pickup" | "dropoff";
  address: string;
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
}

/** "Pin exact location on map" control shown under an address field (optional). */
export default function PinField({ kind, address, value, onChange }: PinFieldProps) {
  const [open, setOpen] = useState(false);
  const what = kind === "pickup" ? "pickup" : "drop-off";
  return (
    <div className="sd-pin-field">
      <div className="sd-pin-field-row">
        <span className={`sd-pin-state${value ? " set" : ""}`}>
          {value ? `📍 Exact ${what} location pinned` : `No map pin yet (optional, helps the courier find the place)`}
        </span>
        <button type="button" className="sd-pin-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Done" : value ? "Change pin" : `Pin ${what} on map`}
        </button>
      </div>
      {open && (
        <Suspense fallback={<p className="sd-map-note">Loading map…</p>}>
          <LocationPinPicker kind={kind} address={address} value={value} onChange={onChange} />
        </Suspense>
      )}
    </div>
  );
}
