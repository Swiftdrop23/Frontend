import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReportSummary, type ReportSummary } from "./adminData";
import "./admin.css";

export default function Reports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getReportSummary().then(setSummary)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load reports."));
  }, []);
  const daily = summary?.daily ?? [];
  const max = Math.max(1, ...daily.map((row) => row.total));
  return <div className="admin-page">
    <div className="admin-page-actions"><p className="admin-note">Weekly delivery performance</p><Link className="admin-button" to="/admin/reports/delivery-report">View delivery report</Link></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {!summary && !error && <p className="admin-muted" role="status">Loading report data…</p>}
    {summary && <>
      <div className="report-stats">
        <section className="admin-panel report-stat"><span>Parcels (last 7 days)</span><strong>{summary.total.toLocaleString()}</strong></section>
        <section className="admin-panel report-stat"><span>Success rate</span><strong>{Math.round(summary.successRate)}%</strong></section>
        <section className="admin-panel report-stat"><span>Failed / cancelled</span><strong>{summary.failed}</strong></section>
      </div>
      <div className="report-grid">
        <section className="admin-panel report-chart"><h2>Parcels per day</h2><div className="bar-chart" role="img" aria-label="Daily parcels from the last seven days">
          {daily.length ? daily.map((row) => <div className="bar-column" key={row.date}><span className="bar-value">{row.total}</span><div className="bar" style={{ height: `${Math.max(12, (row.total / max) * 150)}px` }} /><span>{new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(`${row.date}T12:00:00Z`))}</span></div>) : <p className="admin-muted">No parcel activity in the last seven days.</p>}
        </div></section>
        <section className="admin-panel report-success"><h2>Success vs failure</h2><div className="success-track" role="img" aria-label={`${summary.delivered} delivered and ${summary.failed} cancelled, ${Math.round(summary.successRate)} percent success`}><span style={{ width: `${Math.min(100, summary.successRate)}%` }} /></div><div className="success-labels"><span className="success-pill">Delivered {Math.round(summary.successRate)}%</span><span className="failed-pill">Failed / cancelled {Math.max(0, 100 - Math.round(summary.successRate))}%</span></div></section>
      </div>
      <p className="admin-sample">Report data from parcels in the shared database. Failed counts include cancelled parcels because the current status model has no separate Failed status.</p>
    </>}
  </div>;
}
