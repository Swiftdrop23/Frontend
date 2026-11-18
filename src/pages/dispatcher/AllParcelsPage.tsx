import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  getAllDispatcherParcels,
  type DispatcherParcel,
} from "../../api/dispatcher";
import "./dispatcher.css";

const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "CREATED", label: "Created" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "FAILED", label: "Failed" },
];

function badgeClass(status: string): string {
  if (status === "DELIVERED") return "disp-badge delivered";
  if (status === "CANCELLED" || status === "FAILED") return "disp-badge failed";
  if (status === "PENDING" || status === "CREATED") return "disp-badge created";
  return "disp-badge progress";
}

function formatStatus(status: string): string {
  if (status === "PENDING") return "Created";
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AllParcelsPage() {
  const [parcels, setParcels] = useState([] as DispatcherParcel[]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getAllDispatcherParcels(appliedQuery, activeTab);
        setParcels(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load parcels.",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [appliedQuery, activeTab]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setAppliedQuery(searchInput);
  }

  return (
    <div className="disp-page">
      <div className="disp-header">
        <div>
          <h2 className="disp-title">All Parcels</h2>
          <p className="disp-sub">
            Search parcels by tracking number or filter by delivery status.
          </p>
        </div>
        <div className="disp-header-actions">
          <Link
            to="/dispatcher/unassigned-parcels"
            className="disp-btn-secondary"
          >
            Unassigned Parcels
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <form className="disp-search-row" onSubmit={handleSearch}>
        <input
          type="text"
          className="disp-search-input"
          placeholder="Search by tracking number"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="disp-btn-orange">
          Search
        </button>
      </form>

      {/* Filter Tabs */}
      <div
        className="disp-tabs"
        role="tablist"
        aria-label="Parcel status filter"
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`disp-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="notice error">{error}</div>}

      {/* Parcels Table */}
      <section className="disp-card">
        {loading ? (
          <div className="disp-empty">Loading parcels...</div>
        ) : parcels.length === 0 ? (
          <div className="disp-empty">
            No parcels match the selected filter.
          </div>
        ) : (
          <div className="disp-table-wrap">
            <table className="disp-table">
              <thead>
                <tr>
                  <th>Tracking no.</th>
                  <th>Route</th>
                  <th>Courier</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        to={`/dispatcher/unassigned-parcels/${p.id}/assign`}
                        className="disp-link"
                      >
                        {p.trackingNumber}
                      </Link>
                    </td>
                    <td>{p.routeSummary}</td>
                    <td>
                      {p.assignedCourierName && p.assignedCourierId ? (
                        <Link
                          to={`/dispatcher/courier-workloads/${p.assignedCourierId}`}
                          className="disp-link"
                        >
                          {p.assignedCourierName}
                        </Link>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={badgeClass(p.status)}>
                        {formatStatus(p.status)}
                      </span>
                    </td>
                    <td>{formatDate(p.createdAt)}</td>
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
