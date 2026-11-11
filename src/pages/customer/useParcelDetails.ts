import { useCallback, useEffect, useState } from "react";
import { getParcelDetails } from "../../api/tracking";
import { errMessage } from "../../utils/errors";
import type { ParcelDetails, PublicTracking } from "../../types/tracking";

/** Loads one owned parcel. reload() refetches quietly (used by Live Tracking polling). */
export function useParcelDetails(trackingNumber: string | undefined) {
  const [parcel, setParcel] = useState<ParcelDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(trackingNumber));
  const [error, setError] = useState("");

  const load = useCallback(async (quiet: boolean) => {
    if (!trackingNumber) return;
    if (!quiet) { setLoading(true); setError(""); }
    try {
      setParcel(await getParcelDetails(trackingNumber));
      setError("");
    } catch (e) {
      if (!quiet) setParcel(null);
      setError(errMessage(e));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [trackingNumber]);

  useEffect(() => {
    if (!trackingNumber) { setParcel(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError("");
    getParcelDetails(trackingNumber)
      .then((p) => active && setParcel(p))
      .catch((e) => { if (active) { setParcel(null); setError(errMessage(e)); } })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [trackingNumber]);

  /** Applies a live update (status + timeline) without refetching the whole parcel. */
  const applyLive = useCallback((update: PublicTracking) => {
    setParcel((current) => current && current.trackingNumber === update.trackingNumber
      ? { ...current, status: update.status, timeline: update.timeline }
      : current);
  }, []);

  return { parcel, loading, error, reload: () => load(true), applyLive };
}
