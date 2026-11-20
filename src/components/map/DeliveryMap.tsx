import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocode, roadRoute } from "./geo";
import type { LatLng, RouteInfo } from "./geo";
import "./map.css";

export interface DeliveryMapProps {
  /** Where the courier is going (the customer's pickup location) */
  pickupAddress?: string | null;
  /** Exact pin set by the customer; used instead of looking up the address */
  pickupPoint?: LatLng | null;
  /** Live courier position */
  courier?: { latitude: number; longitude: number } | null;
  height?: number;
}

const SRI_LANKA: L.LatLngExpression = [7.87, 80.77];

export function pin(kind: "pickup" | "dropoff" | "courier", text: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span class="sd-pin sd-pin-${kind}">${text}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Customer's live map: their pickup location, the courier and the road route with an arrival estimate. */
export default function DeliveryMap({ pickupAddress, pickupPoint, courier, height = 340 }: DeliveryMapProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const [target, setTarget] = useState<LatLng | null>(pickupPoint ?? null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [large, setLarge] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => map.current?.invalidateSize(), 50);
    return () => clearTimeout(timer);
  }, [large]);

  useEffect(() => {
    if (!element.current || map.current) return;
    const created = L.map(element.current).setView(SRI_LANKA, 7);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(created);
    layer.current = L.layerGroup().addTo(created);
    map.current = created;
    return () => {
      created.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  const pinLat = pickupPoint?.lat;
  const pinLng = pickupPoint?.lng;
  useEffect(() => {
    let active = true;
    if (pinLat != null && pinLng != null) {
      setTarget({ lat: pinLat, lng: pinLng });
      return undefined;
    }
    void geocode(pickupAddress).then((found) => { if (active) setTarget(found); });
    return () => { active = false; };
  }, [pickupAddress, pinLat, pinLng]);

  const courierLat = courier?.latitude;
  const courierLng = courier?.longitude;
  useEffect(() => {
    let active = true;
    if (courierLat == null || courierLng == null || !target) {
      setRoute(null);
      return undefined;
    }
    void roadRoute({ lat: courierLat, lng: courierLng }, target).then((value) => { if (active) setRoute(value); });
    return () => { active = false; };
  }, [target, courierLat, courierLng]);

  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    const bounds: L.LatLngTuple[] = [];
    if (target) {
      L.marker([target.lat, target.lng], { icon: pin("pickup", "P") }).bindPopup("<strong>Your pickup location</strong>").addTo(group);
      bounds.push([target.lat, target.lng]);
    }
    if (courierLat != null && courierLng != null) {
      L.marker([courierLat, courierLng], { icon: pin("courier", "🛵"), zIndexOffset: 1000 }).bindPopup("<strong>Courier</strong>").addTo(group);
      bounds.push([courierLat, courierLng]);
    }
    if (route && route.path.length > 1) {
      L.polyline(route.path.map((p) => [p.lat, p.lng] as L.LatLngTuple), {
        color: "#f97316", weight: 5, opacity: 0.85, dashArray: route.roads ? undefined : "8 8",
      }).addTo(group);
    }
    // Fit once so the map does not jump while the customer is looking at it.
    if (!fitted.current && bounds.length > 0) {
      if (bounds.length === 1) m.setView(bounds[0], 15);
      else m.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 16 });
      fitted.current = bounds.length > 1;
    }
  }, [target, route, courierLat, courierLng]);

  return (
    <div className="sd-map">
      <div ref={element} className="sd-map-canvas" style={{ height: large ? "70vh" : height }} role="region" aria-label="Live courier map" />
      <div className="sd-map-legend">
        <span><i className="sd-dot sd-dot-pickup" /> Your pickup location</span>
        {courierLat != null && <span><i className="sd-dot sd-dot-courier" /> Courier</span>}
        <button type="button" className="sd-map-size" onClick={() => setLarge((v) => !v)} aria-pressed={large}>{large ? "Smaller map" : "Larger map"}</button>
        {route?.durationMin != null && (
          <strong className="sd-map-eta">About {route.durationMin} min away · {route.distanceKm} km</strong>
        )}
      </div>
    </div>
  );
}
