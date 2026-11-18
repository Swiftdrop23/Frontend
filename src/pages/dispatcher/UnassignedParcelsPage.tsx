import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  assignParcel,
  getCourierWorkloads,
  getUnassignedParcels,
  type CourierWorkload,
  type UnassignedParcel,
} from "../../api/dispatcher";
import "./dispatcher.css";

export default function UnassignedParcelsPage() {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([] as UnassignedParcel[]);
  const [workloads, setWorkloads] = useState([] as CourierWorkload[]);
  const [selectedCourier, setSelectedCourier] = useState(
    {} as Record<number, number>,
  );
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null as number | null);
  const [notice, setNotice] = useState(
    null as { type: "ok" | "error"; text: string } | null,
  );

  async function loadData() {
    setLoading(true);
    try {
      const [unassignedData, workloadData] = await Promise.all([
        getUnassignedParcels(),
        getCourierWorkloads(),
      ]);
      setParcels(unassignedData);
      setWorkloads(workloadData);
    } catch (err) {
      setNotice({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to load dispatcher data.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleQuickAssign(parcel: UnassignedParcel) {
    const courierId = selectedCourier[parcel.id];
    if (!courierId) {
      navigate(`/dispatcher/unassigned-parcels/${parcel.id}/assign`);
      return;
    }
    setSubmittingId(parcel.id);
    setNotice(null);
    try {
      const result = await assignParcel(parcel.id, courierId);
      setNotice({
        type: "ok",
        text: `${result.trackingNumber} assigned to ${result.courierName}.`,
      });
      await loadData();
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Could not assign parcel.",
      });
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="disp-page">
      <div className="disp-header">
        <div>
          <h2 className="disp-title">Unassigned Parcels</h2>
          <p className="disp-sub">
            Review parcels waiting for dispatch and balance courier workloads.
          </p>
        </div>
        <div className="disp-header-actions">
          <Link to="/dispatcher/all-parcels" className="disp-btn-secondary">
            All Parcels
          </Link>
          <Link
            to="/dispatcher/courier-workloads"
            className="disp-btn-secondary"
          >
            View Detailed Workloads
          </Link>
        </div>
      </div>

      {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

      <div className="disp-grid-main">
        {/* Left Panel: Waiting for a courier */}
        <section className="disp-card">
          <h3 className="disp-card-title">Waiting for a courier</h3>

          {loading ? (
            <div className="disp-empty">Loading unassigned parcels...</div>
          ) : parcels.length === 0 ? (
            <div className="disp-empty">
              No unassigned parcels waiting right now. New customer or merchant
              orders will appear here automatically.
            </div>
          ) : (
            <div className="disp-table-wrap">
              <table className="disp-table">
                <thead>
                  <tr>
                    <th>Tracking no.</th>
                    <th>Route</th>
                    <th>Courier</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parcels.map((parcel) => (
                    <tr key={parcel.id}>
                      <td>
                        <Link
                          to={`/dispatcher/unassigned-parcels/${parcel.id}/assign`}
                          className="disp-link"
                        >
                          {parcel.trackingNumber}
                        </Link>
                      </td>
                      <td>{parcel.routeSummary}</td>
                      <td>
                        <select
                          className="disp-select"
                          aria-label={`Select courier for ${parcel.trackingNumber}`}
                          value={selectedCourier[parcel.id] || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedCourier((prev) => ({
                              ...prev,
                              [parcel.id]: val,
                            }));
                          }}
                        >
                          <option value="">Select courier</option>
                          {workloads.map((c) => (
                            <option key={c.courierId} value={c.courierId}>
                              {c.courierName} ({c.activeCount} active)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="disp-btn-orange"
                          disabled={submittingId === parcel.id}
                          onClick={() => void handleQuickAssign(parcel)}
                        >
                          {submittingId === parcel.id
                            ? "Assigning..."
                            : "Assign"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Panel: Live Courier Workloads */}
        <aside className="disp-card">
          <h3 className="disp-card-title">Courier workloads</h3>

          {loading ? (
            <div className="disp-empty">Loading workloads...</div>
          ) : workloads.length === 0 ? (
            <div className="disp-empty">No courier profiles available yet.</div>
          ) : (
            <div className="disp-workload-list">
              {workloads.map((courier) => {
                const pct = Math.min(
                  100,
                  Math.round(
                    (courier.activeCount / Math.max(1, courier.maxCapacity)) *
                      100,
                  ),
                );
                return (
                  <div key={courier.courierId} className="disp-workload-row">
                    <div className="disp-workload-meta">
                      <Link
                        to={`/dispatcher/courier-workloads/${courier.courierId}`}
                        className="disp-link disp-workload-name"
                      >
                        {courier.courierName}
                      </Link>
                      <span className="disp-workload-count">
                        {courier.activeCount} active
                      </span>
                    </div>
                    <div className="disp-bar-track">
                      <div
                        className="disp-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
