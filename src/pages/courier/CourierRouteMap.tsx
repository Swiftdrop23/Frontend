import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { liveMapApi, navigationUrl, telUrl, VEHICLE_TYPES } from "../../api/liveMap";
import type { CourierProfile, CourierStop } from "../../api/liveMap";
import { updateStatus } from "../../features/courier/courierApi";
import "../../components/map/map.css";

const SEND_EVERY_MS = 15000;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "To pick up",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
};

/**
 * Courier "Pickups & Drops": no map on this page, only one-tap Google Maps navigation (destination
 * already filled in), call buttons, and "Start pickup", which notifies the customer and shares the
 * courier's live location with that customer until the parcel is picked up.
 */
export default function CourierRouteMap() {
  const [stops, setStops] = useState<CourierStop[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);

  const load = useCallback(async () => {
    try {
      setStops(await liveMapApi.stops());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your pickups and drops.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const tripRunning = Boolean(stops?.some((s) => s.tripActive && s.status === "PENDING"));

  // Share GPS only while at least one pickup trip is running.
  useEffect(() => {
    if (!tripRunning) {
      if (watchId.current != null) {
        navigator.geolocation?.clearWatch(watchId.current);
        watchId.current = null;
        void liveMapApi.stopSharing().catch(() => undefined);
      }
      return undefined;
    }
    if (watchId.current != null || typeof navigator === "undefined" || !navigator.geolocation) {
      if (typeof navigator !== "undefined" && !navigator.geolocation) setGpsError("This browser cannot share location.");
      return undefined;
    }
    lastSentAt.current = 0;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (Date.now() - lastSentAt.current < SEND_EVERY_MS) return;
        lastSentAt.current = Date.now();
        liveMapApi.shareLocation(pos.coords.latitude, pos.coords.longitude,
          Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null)
          .then(() => { setLastSent(new Date()); setGpsError(null); })
          .catch((e: unknown) => setGpsError(e instanceof Error ? e.message : "Could not send your location."));
      },
      (err) => setGpsError(err.code === err.PERMISSION_DENIED
        ? "Location permission was denied. Allow location for this site so the customer can see you coming."
        : "Your location is not available right now."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    );
    return undefined;
  }, [tripRunning]);

  useEffect(() => () => {
    if (watchId.current != null) navigator.geolocation?.clearWatch(watchId.current);
  }, []);

  async function startPickup(stop: CourierStop) {
    setBusy(stop.deliveryId); setNotice(null);
    try {
      await liveMapApi.startTrip(stop.deliveryId);
      setNotice(`The customer was notified that you are on the way to pick up ${stop.trackingNumber}.`);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not start the pickup.");
    } finally {
      setBusy(null);
    }
  }

  async function markPickedUp(stop: CourierStop) {
    setBusy(stop.deliveryId); setNotice(null);
    try {
      await updateStatus(stop.deliveryId, { status: "PICKED_UP", version: stop.version, recipientName: "", failureReason: "", note: "" });
      await liveMapApi.endTrip(stop.deliveryId).catch(() => undefined);
      setNotice(`${stop.trackingNumber} marked as picked up. Live tracking for the customer has ended.`);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not update the parcel.");
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return <div className="sd-route-empty" role="alert">{error} <button type="button" onClick={() => void load()}>Try again</button></div>;
  }
  if (!stops) return <div className="sd-route-empty">Loading your pickups and drops…</div>;

  const pickups = stops.filter((s) => s.status === "PENDING");
  const drops = stops.filter((s) => s.status !== "PENDING");

  return (
    <div className="sd-trips">
      <VehicleForm />
      {tripRunning && (
        <p className="sd-trip-gps" role="status">
          ● Sharing your live location with the customer{lastSent ? ` · last sent ${lastSent.toLocaleTimeString()}` : ""}. Keep this page open.
        </p>
      )}
      {gpsError && <p className="notice error" role="alert">{gpsError}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}

      <h2 className="sd-trips-heading">Pickups ({pickups.length})</h2>
      {pickups.length === 0 && <p className="sd-route-empty">No parcels waiting to be picked up.</p>}
      {pickups.map((stop) => (
        <article key={stop.deliveryId} className="sd-trip-card" aria-label={`Pickup ${stop.trackingNumber}`}>
          <header>
            <strong>{stop.trackingNumber}</strong>
            <span className={`sd-trip-status${stop.tripActive ? " live" : ""}`}>{stop.tripActive ? "● On the way" : STATUS_LABEL[stop.status]}</span>
          </header>
          <p className="sd-trip-place"><small>Pick up from</small>{stop.senderName ?? "Customer"} · {stop.pickupAddress ?? "Address not recorded"}</p>
          <p className="sd-trip-pin">{stop.pickup ? "📍 Exact location pinned by the customer" : "No map pin: navigation goes to the town; call the customer for directions."}</p>
          <div className="sd-route-actions">
            {!stop.tripActive ? (
              <button type="button" className="start" disabled={busy === stop.deliveryId} onClick={() => void startPickup(stop)}>Start pickup</button>
            ) : (
              <button type="button" className="done" disabled={busy === stop.deliveryId} onClick={() => void markPickedUp(stop)}>Mark picked up</button>
            )}
            <a className="pickup" href={navigationUrl(stop.pickupAddress, stop.pickup)} target="_blank" rel="noreferrer">Navigate to pickup</a>
            {stop.senderPhone && <a className="call" href={telUrl(stop.senderPhone)}>Call customer</a>}
          </div>
        </article>
      ))}

      <h2 className="sd-trips-heading">Drop-offs ({drops.length})</h2>
      {drops.length === 0 && <p className="sd-route-empty">No parcels to drop off yet.</p>}
      {drops.map((stop) => (
        <article key={stop.deliveryId} className="sd-trip-card" aria-label={`Drop-off ${stop.trackingNumber}`}>
          <header>
            <strong>{stop.trackingNumber}</strong>
            <span className="sd-trip-status">{STATUS_LABEL[stop.status] ?? stop.status}</span>
          </header>
          <p className="sd-trip-place"><small>Deliver to</small>{stop.recipientName ?? "Recipient"} · {stop.dropoffAddress ?? "Address not recorded"}</p>
          <p className="sd-trip-pin">{stop.dropoff ? "📍 Exact location pinned by the customer" : "No map pin: navigation goes to the town; call the recipient for directions."}</p>
          <div className="sd-route-actions">
            <a className="dropoff" href={navigationUrl(stop.dropoffAddress, stop.dropoff)} target="_blank" rel="noreferrer">Navigate to drop-off</a>
            {stop.recipientPhone && <a className="call" href={telUrl(stop.recipientPhone)}>Call recipient</a>}
          </div>
          <p className="sd-map-note">Update the delivery status in My Deliveries.</p>
        </article>
      ))}
    </div>
  );
}

/** The courier's phone and vehicle, shown to customers during a pickup trip. */
function VehicleForm() {
  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [form, setForm] = useState({ phone: "", vehicleType: "", vehicleNumber: "" });
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    liveMapApi.profile().then((p) => {
      setProfile(p);
      setForm({ phone: p.phone ?? "", vehicleType: p.vehicleType ?? "", vehicleNumber: p.vehicleNumber ?? "" });
      if (!p.vehicleType || !p.vehicleNumber) setOpen(true);
    }).catch(() => undefined);
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      const saved = await liveMapApi.saveProfile(form);
      setProfile(saved); setOpen(false); setMessage("Saved. Customers will see these details when you are on the way.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    }
  }

  return (
    <section className="sd-vehicle" aria-label="My vehicle">
      <div className="sd-vehicle-row">
        <span>
          <strong>{profile?.name ?? "Courier"}</strong>
          {profile?.vehicleType ? ` · ${profile.vehicleType} ${profile.vehicleNumber ?? ""}` : " · Add your vehicle so customers know who is coming"}
        </span>
        <button type="button" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Edit vehicle"}</button>
      </div>
      {open && (
        <form className="sd-vehicle-form" onSubmit={(e) => void save(e)}>
          <label>Vehicle type
            <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} required>
              <option value="">Choose…</option>
              {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Vehicle number
            <input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="e.g. BAB-1234" required maxLength={20} />
          </label>
          <label>Phone
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0771234567" maxLength={20} />
          </label>
          <button type="submit">Save</button>
        </form>
      )}
      {message && <p className="sd-map-note" role="status">{message}</p>}
    </section>
  );
}
