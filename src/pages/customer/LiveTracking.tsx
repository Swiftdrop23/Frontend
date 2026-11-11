import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, EmptyState, StatusBadge } from "../../components/ui";
import Timeline from "../../components/tracking/Timeline";
import DetailList from "../../components/tracking/DetailList";
import { formatWeight } from "../../components/tracking/format";
import { getHistory } from "../../api/tracking";
import { errMessage } from "../../utils/errors";
import { useParcelDetails } from "./useParcelDetails";
import { useLiveTracking } from "./useLiveTracking";
import type { HistoryItem } from "../../types/tracking";
import "../../components/tracking/tracking.css";

// Updates arrive over SSE. Polling every 15s is the fallback while that connection is down (or in mock mode).
export const POLL_MS = 15_000;

export default function LiveTracking() {
  const [params, setParams] = useSearchParams();
  const selected = params.get("parcel") ?? "";
  const [active, setActive] = useState<HistoryItem[]>([]);
  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const { parcel, loading, error, reload, applyLive } = useParcelDetails(selected || undefined);
  const finished = parcel ? ["DELIVERED", "FAILED", "CANCELLED"].includes(parcel.status) : true;
  const mode = useLiveTracking(selected && parcel && !finished ? selected : undefined, applyLive);

  useEffect(() => {
    let live = true;
    getHistory("in_progress", 0, 50)
      .then((page) => {
        if (!live) return;
        setActive(page.items);
        if (!selected && page.items.length > 0) setParams({ parcel: page.items[0].trackingNumber }, { replace: true });
      })
      .catch((e) => live && setListError(errMessage(e)))
      .finally(() => live && setListLoading(false));
    return () => { live = false; };
    // Load the list once; selecting a parcel only changes the query string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const polling = mode === "polling";
  useEffect(() => {
    if (!selected || finished || !polling) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") reload();
    }, POLL_MS);
    return () => clearInterval(timer);
    // reload is recreated each render; the interval only depends on the selected parcel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, finished, polling]);

  const options = active.some((p) => p.trackingNumber === selected) || !selected
    ? active
    : [...active, { trackingNumber: selected } as HistoryItem];

  return (
    <>
      <div className="live-bar">
        <label className="sr-only" htmlFor="live-parcel">Select a parcel</label>
        <select id="live-parcel" value={selected} disabled={listLoading}
          onChange={(e) => setParams(e.target.value ? { parcel: e.target.value } : {})}>
          <option value="">{listLoading ? "Loading parcels..." : "Select a parcel"}</option>
          {options.map((p) => (
            <option key={p.trackingNumber} value={p.trackingNumber}>
              {p.trackingNumber}{p.from ? ` · ${p.from} to ${p.to}` : ""}
            </option>
          ))}
        </select>
        {parcel && (
          <span className="live-state">
            {finished ? "Delivery finished" : mode === "live" ? "Updates automatically" : "Refreshing every 15 seconds"}
            <span className={`live-pill${mode === "live" ? "" : " paused"}`}>
              {finished ? "Final" : mode === "live" ? "Live" : mode === "connecting" ? "Connecting" : "Auto-refresh"}
            </span>
          </span>
        )}
      </div>

      {listError && <div className="notice error" role="alert">{listError}</div>}

      {!selected ? (
        !listLoading && <Card><EmptyState title="No parcel selected" message={active.length ? "Choose a parcel to follow it live." : "You have no deliveries in progress."} /></Card>
      ) : loading ? (
        <Card><p className="hint" role="status">Loading parcel...</p></Card>
      ) : !parcel ? (
        <Card><EmptyState title="Parcel not found" message={error || "We could not find that parcel."} /></Card>
      ) : (
        <div className="tracking-grid">
          <Card>
            <div className="tracking-head">
              <div>
                <span className="tracking-label">Tracking number</span>
                <span className="tracking-number">{parcel.trackingNumber}</span>
              </div>
              <StatusBadge status={parcel.status} />
            </div>
            <Timeline steps={parcel.timeline} />
            {error && <p className="hint" role="status" style={{ marginTop: 16 }}>Could not refresh: {error}</p>}
          </Card>
          <Card title="Delivery details">
            <DetailList rows={[
              ["From", parcel.from],
              ["To", parcel.to],
              ["Courier", parcel.courierName || "Not assigned yet"],
              ["Weight", formatWeight(parcel.weightKg)],
            ]} />
          </Card>
        </div>
      )}
    </>
  );
}
