import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCourierWorkloads,
  type CourierWorkload,
} from "../../api/dispatcher";
import "./dispatcher.css";

export default function CourierWorkloadsPage() {
  const [workloads, setWorkloads] = useState([] as CourierWorkload[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCourierWorkloads();
        setWorkloads(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load courier workloads.",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="disp-page">
      <div className="disp-header">
        <div>
          <h2 className="disp-title">Courier Workloads</h2>
          <p className="disp-sub">
            Monitor active delivery distribution across couriers before
            assigning new parcels.
          </p>
        </div>
        <div className="disp-header-actions">
          <Link
            to="/dispatcher/unassigned-parcels"
            className="disp-btn-secondary"
          >
            Unassigned Parcels
          </Link>
          <Link to="/dispatcher/all-parcels" className="disp-btn-secondary">
            All Parcels
          </Link>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      <section className="disp-card">
        {loading ? (
          <div className="disp-empty">Loading courier workloads...</div>
        ) : workloads.length === 0 ? (
          <div className="disp-empty">
            No couriers found. Registered courier profiles will appear here
            automatically.
          </div>
        ) : (
          <div className="disp-table-wrap">
            <table className="disp-table">
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Active</th>
                  <th>Picked up</th>
                  <th>In transit</th>
                  <th>Out for delivery</th>
                  <th style={{ minWidth: "180px" }}>Load</th>
                </tr>
              </thead>
              <tbody>
                {workloads.map((c) => {
                  const pct = Math.min(
                    100,
                    Math.round(
                      (c.activeCount / Math.max(1, c.maxCapacity)) * 100,
                    ),
                  );
                  return (
                    <tr key={c.courierId}>
                      <td>
                        <Link
                          to={`/dispatcher/courier-workloads/${c.courierId}`}
                          className="disp-link"
                        >
                          {c.courierName}
                        </Link>
                      </td>
                      <td>
                        <strong>{c.activeCount}</strong>
                      </td>
                      <td>{c.pickedUpCount}</td>
                      <td>{c.inTransitCount}</td>
                      <td>{c.outForDeliveryCount}</td>
                      <td>
                        <div
                          className="disp-bar-track"
                          title={`${c.activeCount} / ${c.maxCapacity} capacity`}
                        >
                          <div
                            className="disp-bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="disp-caption">
        Click any courier name to inspect their assigned parcels or reassign
        deliveries to balance workload.
      </p>
    </div>
  );
}
