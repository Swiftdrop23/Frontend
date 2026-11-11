import { useEffect, useRef, useState } from "react";
import { liveTrackingUrl } from "../../api/tracking";
import type { PublicTracking } from "../../types/tracking";

/** live = pushed by the server; polling = the page refreshes on a timer instead. */
export type LiveMode = "off" | "connecting" | "live" | "polling";

const FINAL = ["DELIVERED", "FAILED", "CANCELLED"];
const RETRY_AFTER_CLOSE_MS = 30_000;

/**
 * Opens an SSE connection for one parcel and calls onUpdate with each pushed status.
 * Falls back to "polling" while the connection is down; the caller polls in that mode.
 */
export function useLiveTracking(trackingNumber: string | undefined, onUpdate: (update: PublicTracking) => void): LiveMode {
  const [mode, setMode] = useState<LiveMode>("off");
  const callback = useRef(onUpdate);
  callback.current = onUpdate;

  useEffect(() => {
    if (!trackingNumber) { setMode("off"); return; }
    const url = liveTrackingUrl(trackingNumber);
    if (!url || typeof EventSource === "undefined") { setMode("polling"); return; }

    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = () => {
      setMode("connecting");
      source = new EventSource(url);
      source.onopen = () => setMode("live");
      source.addEventListener("status", (event) => {
        let update: PublicTracking;
        try {
          update = JSON.parse((event as MessageEvent<string>).data) as PublicTracking;
        } catch {
          return;
        }
        setMode("live");
        callback.current(update);
        // The server closes finished parcels; close first so the browser does not keep reconnecting.
        if (FINAL.includes(update.status)) { stopped = true; source?.close(); setMode("off"); }
      });
      source.onerror = () => {
        if (stopped) return;
        setMode("polling");
        // CONNECTING = the browser retries by itself. CLOSED (e.g. 404/503) = we retry later.
        if (source?.readyState === EventSource.CLOSED) {
          source.close();
          retry = setTimeout(connect, RETRY_AFTER_CLOSE_MS);
        }
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      source?.close();
    };
  }, [trackingNumber]);

  return mode;
}
