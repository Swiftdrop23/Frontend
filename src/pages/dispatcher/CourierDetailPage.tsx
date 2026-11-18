import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCourierDetail, type CourierDetail } from "../../api/dispatcher";
import "./dispatcher.css";

function statusBadgeClass(status: string): string {
  if (status === "DELIVERED") return "disp-badge delivered";
  if (status === "CANCELLED" || status === "FAILED") return "disp-badge failed";
  if (status === "PENDING" || status === "CREATED") return "disp-badge created";
  return "disp-badge progress";
}

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CourierDetailPage() {
  const { courierId } = useParams();
  const navigate = useNavigate();
  const numericCourierId = Number(courierId);

  const [detail, setDetail] = useState(null as CourierDetail | null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCourierDetail(numericCourierId);
        setDetail(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load courier details.",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [numericCourierId]);

  if (loading) {
    return (
      <div className="disp-page">
        <div className="disp-card">
          <div className="disp-empty">Loading courier workload details...</div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="disp-page">
        <div className="disp-card">
          <p className="notice error">{error || "Courier not found."}</p>
          <button
            type="button"
            className="disp-btn-secondary"
            onClick={() => navigate("/dispatcher/courier-workloads")}
          >
            Back to Courier Workloads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="disp-page">
      <div className="disp-header">
        <div>
          <h2 className="disp-title">{detail.courierName}</h2>
          <p className="disp-sub">
            Active deliveries and daily performance summary.
          </p>
        </div>
        <div className="disp-header-actions">
          <Link
            to="/dispatcher/courier-workloads"
            className="disp-btn-secondary"
          >
            Back to Workloads
          </Link>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="disp-stats-grid">
        <div className="disp-stat-card">
          <div className="disp-stat-label">Active</div>
          <div className="disp-stat-value">{detail.activeCount}</div>
        </div>
        <div className="disp-stat-card">
          <div className="disp-stat-label">Delivered today</div>
          <div className="disp-stat-value">{detail.deliveredTodayCount}</div>
        </div>
        <div className="disp-stat-card">
          <div className="disp-stat-label">Failed today</div>
          <div className="disp-stat-value">{detail.failedTodayCount}</div>
        </div>
      </div>

      {/* Assigned Parcels Table */}
      <section className="disp-card">
        <h3 className="disp-card-title">Assigned Parcels</h3>

        {detail.parcels.length === 0 ? (
          <div className="disp-empty">
            No active parcels currently assigned to {detail.courierName}.
          </div>
        ) : (
          <div className="disp-table-wrap">
            <table className="disp-table">
              <thead>
                <tr>
                  <th>Tracking no.</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {detail.parcels.map((item) => (
                  <tr key={item.assignmentId}>
                    <td>
                      <strong>{item.trackingNumber}</strong>
                    </td>
                    <td>{item.receiverAddress}</td>
                    <td>
                      <span className={statusBadgeClass(item.status)}>
                        {formatStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="disp-btn-secondary"
                        onClick={() =>
                          navigate(
                            `/dispatcher/unassigned-parcels/${item.parcelId}/assign?mode=reassign`,
                          )
                        }
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
