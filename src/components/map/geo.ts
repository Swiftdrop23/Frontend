// Address → coordinates (OpenStreetMap Nominatim) and road routes (OSRM). Both are free and need no key.
// Results are cached in the browser so the public services are called as little as possible.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  path: LatLng[];
  distanceKm: number | null;
  durationMin: number | null;
  /** false when the road route was unavailable and a straight line is shown instead */
  roads: boolean;
}

const CACHE_KEY = "swiftdrop.geo.v1";
const memory = new Map<string, LatLng | null>();
let lastLookup = 0;

function loadCache(): Record<string, LatLng | null> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, LatLng | null>;
  } catch {
    return {};
  }
}

function saveCache(key: string, value: LatLng | null): void {
  memory.set(key, value);
  try {
    const all = loadCache();
    all[key] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked: the in-memory cache still works */
  }
}

/** Queries to try, most precise first: the full address, then without the house/street parts, then the town. */
export function candidateQueries(address: string): string[] {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const queries: string[] = [];
  for (let i = 0; i < parts.length; i++) queries.push(parts.slice(i).join(", "));
  return [...new Set(queries)];
}

async function nominatim(query: string): Promise<LatLng | null> {
  // Nominatim's usage policy allows about one request per second.
  const wait = lastLookup + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastLookup = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=lk&accept-language=en&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export async function geocode(address: string | null | undefined): Promise<LatLng | null> {
  if (!address || !address.trim()) return null;
  const key = address.trim().toLowerCase();
  if (memory.has(key)) return memory.get(key) ?? null;
  const cached = loadCache();
  if (key in cached) {
    memory.set(key, cached[key]);
    return cached[key];
  }
  try {
    for (const query of candidateQueries(address)) {
      const found = await nominatim(query);
      if (found) {
        saveCache(key, found);
        return found;
      }
    }
    saveCache(key, null);
    return null;
  } catch {
    return null; // network problem: try again next time
  }
}

function straight(from: LatLng, to: LatLng): RouteInfo {
  return { path: [from, to], distanceKm: null, durationMin: null, roads: false };
}

export async function roadRoute(from: LatLng, to: LatLng): Promise<RouteInfo> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=simplified&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return straight(from, to);
    const data = (await res.json()) as {
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = data.routes?.[0];
    if (!route) return straight(from, to);
    return {
      path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      roads: true,
    };
  } catch {
    return straight(from, to);
  }
}
