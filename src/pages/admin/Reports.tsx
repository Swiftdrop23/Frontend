import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReportSummary, type ReportSummary } from "./adminData";
import "./admin.css";

/*
 * Weekly delivery performance. Parcels still on their way are shown as "In progress", not as failures, and the
 * success rate is measured on finished parcels only (delivered / (delivered + failed or cancelled)).
 */
export function breakdown(summary: ReportSummary) {
  const total = Math.max(0, summary.total);
  const delivered = Math.max(0, summary.delivered);
  const failed = Math.max(0, summary.failed);
  const inProgress = Math.max(0, total - delivered - failed);
  const finished = delivered + failed;
  const successRate = finished ? Math.round((delivered / finished) * 100) : null;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  return { total, delivered, failed, inProgress, successRate, pct };
}

export default function Reports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getReportSummary().then(setSummary)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load reports."));
  }, []);
  const daily = summary?.daily ?? [];
  const max = Math.max(1, ...daily.map((row) => row.total));
  const b = summary ? breakdown(summary) : null;
  return <div className="admin-page">
    <div className="admin-page-actions"><p className="admin-note">Delivery performance for the last 7 days</p><Link className="admin-button" to="/admin/reports/delivery-report">View delivery report</Link></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {!summary && !error && <p className="admin-muted" role="status">Loading report data…</p>}
    {summary && b && <>
      <div className="report-stats four">
        <section className="admin-panel report-stat"><span>Parcels (last 7 days)</span><strong>{b.total.toLocaleString()}</strong></section>
        <section className="admin-panel report-stat"><span>Delivered</span><strong>{b.delivered.toLocaleString()}</strong></section>
        <section className="admin-panel report-stat"><span>In progress</span><strong>{b.inProgress.toLocaleString()}</strong></section>
        <section className="admin-panel report-stat"><span>Success rate</span><strong>{b.successRate === null ? "–" : `${b.successRate}%`}</strong></section>
      </div>
      <div className="report-grid">
        <section className="admin-panel report-chart"><h2>Parcels per day</h2><div className="bar-chart" role="img" aria-label="Daily parcels from the last seven days">
          {daily.length ? daily.map((row) => <div className="bar-column" key={row.date}><span className="bar-value">{row.total}</span><div className="bar" style={{ height: `${Math.max(12, (row.total / max) * 150)}px` }} /><span>{new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(`${row.date}T12:00:00Z`))}</span></div>) : <p className="admin-muted">No parcel activity in the last seven days.</p>}
        </div></section>
        <section className="admin-panel report-success">
          <h2>Where parcels are now</h2>
          <div className="report-breakdown" role="img" aria-label={`${b.delivered} delivered, ${b.inProgress} in progress, ${b.failed} failed or cancelled`}>
            <span className="seg-delivered" style={{ width: `${b.pct(b.delivered)}%` }} />
            <span className="seg-progress" style={{ width: `${b.pct(b.inProgress)}%` }} />
            <span className="seg-failed" style={{ width: `${b.pct(b.failed)}%` }} />
          </div>
          <div className="report-legend">
            <div><span><i style={{ background: "#18a058" }} />Delivered</span><b>{b.delivered}</b></div>
            <div><span><i style={{ background: "var(--orange)" }} />In progress</span><b>{b.inProgress}</b></div>
            <div><span><i style={{ background: "#d92d20" }} />Failed / cancelled</span><b>{b.failed}</b></div>
          </div>
          <p className="admin-muted" style={{ marginTop: 16 }}>Success rate counts finished parcels only (delivered vs failed or cancelled).</p>
        </section>
      </div>
    </>}
  </div>;
}
