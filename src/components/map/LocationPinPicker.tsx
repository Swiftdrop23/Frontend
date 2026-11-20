import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocode } from "./geo";
import type { LatLng } from "./geo";
import { pin, TILE_ATTRIBUTION, TILE_URL } from "./DeliveryMap";
import "./map.css";

export interface LocationPinPickerProps {
  kind: "pickup" | "dropoff";
  /** Typed address, used to place the pin near it the first time */
  address: string;
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
}

const SRI_LANKA: L.LatLngTuple = [7.87, 80.77];

/** Map where the customer taps (or drags the pin) to set the exact pickup or drop-off location. */
export default function LocationPinPicker({ kind, address, value, onChange }: LocationPinPickerProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const change = useRef(onChange);
  const [status, setStatus] = useState("");
  const [large, setLarge] = useState(false);

  useEffect(() => { change.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!element.current || map.current) return;
    const created = L.map(element.current).setView(value ? [value.lat, value.lng] : SRI_LANKA, value ? 17 : 7);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(created);
    created.on("click", (event: L.LeafletMouseEvent) => change.current({ lat: event.latlng.lat, lng: event.latlng.lng }));
    map.current = created;
    return () => {
      created.remove();
      map.current = null;
      marker.current = null;
    };
    // The map is created once; later pin changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draggable marker in sync with the chosen location.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!value) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      marker.current = L.marker([value.lat, value.lng], { icon: pin(kind, kind === "pickup" ? "P" : "D"), draggable: true }).addTo(m);
      marker.current.on("dragend", () => {
        const at = marker.current?.getLatLng();
        if (at) change.current({ lat: at.lat, lng: at.lng });
      });
    } else {
      marker.current.setLatLng([value.lat, value.lng]);
    }
  }, [value, kind]);

  async function findAddress() {
    if (!address.trim()) {
      setStatus("Type the address above first, or tap the map.");
      return;
    }
    setStatus("Finding the address…");
    const found = await geocode(address);
    if (!found) {
      setStatus("Could not find that address. Zoom in and tap your location on the map.");
      return;
    }
    change.current(found);
    map.current?.setView([found.lat, found.lng], 16);
    setStatus("Pin placed near the address. Drag it to the exact spot if needed.");
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("This browser cannot share your location.");
      return;
    }
    setStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        change.current(here);
        map.current?.setView([here.lat, here.lng], 17);
        setStatus("Pin set to your current location.");
      },
      () => setStatus("Location permission was denied. Tap the map instead."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  // Let Leaflet redraw tiles after the map is resized.
  useEffect(() => {
    const timer = setTimeout(() => map.current?.invalidateSize(), 50);
    return () => clearTimeout(timer);
  }, [large]);

  // Place the pin near the typed address the first time the map opens.
  useEffect(() => {
    if (!value && address.trim()) void findAddress();
    // Only when the picker first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sd-pin-picker">
      <div ref={element} className="sd-map-canvas" style={{ height: large ? "70vh" : 260 }} role="application"
        aria-label={`Map to set the exact ${kind === "pickup" ? "pickup" : "drop-off"} location`} />
      <div className="sd-pin-actions">
        <button type="button" onClick={() => setLarge((v) => !v)} aria-pressed={large}>{large ? "Smaller map" : "Larger map"}</button>
        <button type="button" onClick={() => void findAddress()}>Find typed address</button>
        <button type="button" onClick={useMyLocation}>Use my current location</button>
        {value && <button type="button" onClick={() => { change.current(null); setStatus(""); }}>Remove pin</button>}
      </div>
      <p className="sd-map-note" role="status">{status || "Tap the map or drag the pin to the exact gate or building."}</p>
    </div>
  );
}
