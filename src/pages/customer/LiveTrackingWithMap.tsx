import { useSearchParams } from "react-router-dom";
import LiveTracking from "./LiveTracking";
import CourierLiveMap from "./CourierLiveMap";
import RecipientAlertsPanel from "./RecipientAlertsPanel";

/** Member 3's Live Tracking page, plus (Member 10) the pickup-trip live map and the recipient SMS settings. */
export default function LiveTrackingWithMap() {
  const [params] = useSearchParams();
  const trackingNumber = params.get("parcel")?.trim();
  return (
    <>
      <LiveTracking />
      {trackingNumber && <CourierLiveMap key={`map-${trackingNumber}`} trackingNumber={trackingNumber} />}
      {trackingNumber && <RecipientAlertsPanel key={`alerts-${trackingNumber}`} trackingNumber={trackingNumber} />}
    </>
  );
}
