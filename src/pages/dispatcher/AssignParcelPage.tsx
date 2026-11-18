import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  assignParcel,
  getAllDispatcherParcels,
  getCourierWorkloads,
  reassignParcel,
  type CourierWorkload,
  type DispatcherParcel,
} from "../../api/dispatcher";
import "./dispatcher.css";

export default function AssignParcelPage() {
  const { parcelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const numericParcelId = Number(parcelId);
  const isReassignMode = searchParams.get("mode") === "reassign";

  const [parcel, setParcel] = useState(null as DispatcherParcel | null);
  const [workloads, setWorkloads] = useState([] as CourierWorkload[]);
  const [selectedCourierId, setSelectedCourierId] = useState(
    null as number | null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [allParcels, courierList] = await Promise.all([
          getAllDispatcherParcels(),
          getCourierWorkloads(),
        ]);
        const found = allParcels.find((p) => p.id === numericParcelId) || null;
        setParcel(found);
        setWorkloads(courierList);

        if (courierList.length > 0) {
          const preferred =
            courierList.find((c) => c.courierId !== found?.assignedCourierId) ||
            courierList[0];
          setSelectedCourierId(preferred.courierId);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load parcel details.",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [numericParcelId]);

  async function handleConfirm() {
    if (!parcel || !selectedCourierId) return;
    setSaving(true);
    setError(null);
    try {
      if (isReassignMode || parcel.assignedCourierId) {
        await reassignParcel(
          parcel.id,
          selectedCourierId,
          "Reassigned via dispatcher screen",
        );
      } else {
        await assignParcel(parcel.id, selectedCourierId);
      }
      navigate("/dispatcher/unassigned-parcels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed.");
      setSaving(false);
    }
  }

  function deriveZone(address: string): string {
    const parts = address.split(",");
    return parts[parts.length - 1]?.trim() || "Standard Zone";
  }

  if (loading) {
    return (
      <div className="disp-page">
        <div className="disp-card">
          <div className="disp-empty">Loading assignment details...</div>
        </div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="disp-page">
        <div className="disp-card">
          <p className="notice error">Parcel not found.</p>
          <button
            type="button"
            className="disp-btn-secondary"
            onClick={() => navigate("/dispatcher/unassigned-parcels")}
          >
            Back to Unassigned Parcels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="disp-page">
      <div className="disp-header">
        <div>
          <h2 className="disp-title">
            {isReassignMode || parcel.assignedCourierId ? "Reassign" : "Assign"}{" "}
            {parcel.trackingNumber}
          </h2>
          <p className="disp-sub">
            Compare active courier workloads before confirming dispatch.
          </p>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="disp-grid-equal">
        {/* Left Card: Parcel Info */}
        <section className="disp-card">
          <h3 className="disp-card-title">Parcel</h3>
          <div className="disp-kv-list">
            <div className="disp-kv-row">
              <span className="disp-kv-label">Route</span>
              <span className="disp-kv-val">{parcel.routeSummary}</span>
            </div>
            <div className="disp-kv-row">
              <span className="disp-kv-label">Recipient</span>
              <span className="disp-kv-val">{parcel.receiverName}</span>
            </div>
            <div className="disp-kv-row">
              <span className="disp-kv-label">Destination</span>
              <span className="disp-kv-val">{parcel.receiverAddress}</span>
            </div>
            <div className="disp-kv-row">
              <span className="disp-kv-label">Zone</span>
              <span className="disp-kv-val">
                {deriveZone(parcel.receiverAddress)}
              </span>
            </div>
            {parcel.assignedCourierName && (
              <div className="disp-kv-row">
                <span className="disp-kv-label">Current Courier</span>
                <span className="disp-kv-val">
                  {parcel.assignedCourierName}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Right Card: Choose a courier */}
        <section className="disp-card">
          <h3 className="disp-card-title">Choose a courier</h3>

          {workloads.length === 0 ? (
            <div className="disp-empty">No couriers available to assign.</div>
          ) : (
            <div className="disp-radio-list">
              {workloads.map((courier) => {
                const isSelected = selectedCourierId === courier.courierId;
                const pct = Math.min(
                  100,
                  Math.round(
                    (courier.activeCount / Math.max(1, courier.maxCapacity)) *
                      100,
                  ),
                );
                return (
                  <div
                    key={courier.courierId}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={`disp-radio-option ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedCourierId(courier.courierId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedCourierId(courier.courierId);
                      }
                    }}
                  >
                    <div className="disp-radio-top">
                      <span className="disp-radio-dot" />
                      <span>{courier.courierName}</span>
                    </div>
                    <div className="disp-bar-track">
                      <div
                        className="disp-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="disp-workload-count">
                      {courier.activeCount} active deliveries
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="disp-header-actions">
            <button
              type="button"
              className="disp-btn-orange"
              disabled={saving || !selectedCourierId}
              onClick={() => void handleConfirm()}
            >
              {saving ? "Assigning..." : "Assign courier"}
            </button>
            <button
              type="button"
              className="disp-btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
