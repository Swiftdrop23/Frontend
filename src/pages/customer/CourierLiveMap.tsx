import { useEffect, useState } from "react";
import DeliveryMap from "../../components/map/DeliveryMap";
import { liveMapApi, telUrl } from "../../api/liveMap";
import type { CustomerLiveView } from "../../api/liveMap";
import "../../components/map/map.css";

const LIVE_REFRESH_MS = 10000;
const IDLE_REFRESH_MS = 30000;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s ago` : `${Math.round(seconds / 60)} min ago`;
}

/**
 * Live courier tracking for the customer who created the parcel. It appears only after the courier
 * pressed "Start pickup" (the customer also gets a notification) and ends when the parcel is picked up.
 */
export default function CourierLiveMap({ trackingNumber }: { trackingNumber: string }) {
  const [view, setView] = useState<CustomerLiveView | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      let next: CustomerLiveView | null = null;
      try {
        next = await liveMapApi.customerView(trackingNumber);
        if (active) setView(next);
      } catch {
        /* keep the last view; try again later */
      }
      if (!active) return;
      const done = next && ["DELIVERED", "FAILED", "CANCELLED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(next.status);
      if (!done) timer = setTimeout(() => void load(), next?.live ? LIVE_REFRESH_MS : IDLE_REFRESH_MS);
    };
    void load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [trackingNumber]);

  if (!view) return null;
  if (!view.live) {
    return <p className="sd-live-hint" role="status">{view.message}</p>;
  }

  const courier = view.courier;
  return (
    <section className="sd-live-card" aria-label="Courier on the way">
      <div className="sd-live-head">
        <h2>Courier on the way</h2>
        <span className="sd-live-badge on">● Live</span>
      </div>
      <p className="sd-live-message">{view.message}</p>
      {courier && (
        <div className="sd-courier-card">
          <div className="sd-courier-avatar" aria-hidden="true">{(courier.name ?? "C").charAt(0).toUpperCase()}</div>
          <dl>
            <div><dt>Courier</dt><dd>{courier.name ?? "SwiftDrop courier"}</dd></div>
            <div><dt>Vehicle</dt><dd>{courier.vehicleType ?? "Not provided"}</dd></div>
            <div><dt>Vehicle number</dt><dd>{courier.vehicleNumber ?? "Not provided"}</dd></div>
            <div><dt>Phone</dt><dd>{courier.phone ?? "Not provided"}</dd></div>
          </dl>
          {courier.phone && <a className="sd-call" href={telUrl(courier.phone)}>Call courier</a>}
        </div>
      )}
      <DeliveryMap pickupAddress={view.pickupAddress} pickupPoint={view.pickup}
        courier={view.position ? { latitude: view.position.latitude, longitude: view.position.longitude } : null} />
      {view.position && <p className="sd-live-updated">Location updated {timeAgo(view.position.updatedAt)}.</p>}
    </section>
  );
}
