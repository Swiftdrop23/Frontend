import { useEffect, useState } from "react";
import { getDeliveryReport, type DeliveryRow } from "./adminData";
import "./admin.css";

export default function DeliveryReport() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("All");
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true); setError("");
    getDeliveryReport(from, to, status).then(setRows)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load the delivery report."))
      .finally(() => setLoading(false));
  }, [from, to, status]);

  function exportCsv() {
    const values = [["Date", "Total", "Delivered", "Failed / cancelled", "Success rate"], ...rows.map((row) => [row.date, row.total, row.delivered, row.failed, `${row.total ? Math.round((row.delivered / row.total) * 100) : 0}%`])];
    const csv = values.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "swiftdrop-delivery-report.csv";
    document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <div className="admin-page">
    <div className="report-filters">
      <label className="admin-field"><span>From</span><input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
      <label className="admin-field"><span>To</span><input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
      <label className="admin-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>Delivered</option><option>Failed</option></select></label>
      <button type="button" className="admin-button" onClick={exportCsv} disabled={!rows.length || loading}>Export CSV</button>
    </div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {loading && <p className="admin-muted" role="status">Loading report data…</p>}
    <section className="admin-panel report-table-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Total</th><th>Delivered</th><th>Failed / cancelled</th><th>Success rate</th></tr></thead><tbody>
      {!loading && rows.map((row) => <tr key={row.date}><td>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${row.date}T12:00:00Z`))}</td><td>{row.total}</td><td>{row.delivered}</td><td>{row.failed}</td><td>{row.total ? `${Math.round((row.delivered / row.total) * 100)}%` : "0%"}</td></tr>)}
      {!loading && !rows.length && <tr><td className="admin-empty" colSpan={5}>No report rows match these filters.</td></tr>}
    </tbody></table></div></section>
    <p className="admin-sample">Failed counts include cancelled parcels because the current status model has no separate Failed status.</p>
  </div>;
}
