import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, StatusBadge, Table } from "../../components/ui";
import type { Column } from "../../components/ui";
import { getHistory } from "../../api/tracking";
import { errMessage } from "../../utils/errors";
import { formatDate, formatFee } from "../../components/tracking/format";
import type { HistoryFilter, HistoryItem } from "../../types/tracking";
import "../../components/tracking/tracking.css";

const FILTERS: [HistoryFilter, string][] = [["all", "All"], ["delivered", "Delivered"], ["in_progress", "In progress"], ["failed", "Failed"]];
const PAGE_SIZE = 20;

export default function DeliveryHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<HistoryItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getHistory(filter, page, PAGE_SIZE)
      .then((result) => {
        if (!active) return;
        setRows(result.items);
        setHasMore(result.hasMore);
      })
      .catch((e) => active && setError(errMessage(e)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [filter, page]);

  const columns: Column<HistoryItem>[] = [
    { header: "Tracking no.", render: (r) => <Link className="tracking-link" to={encodeURIComponent(r.trackingNumber)}>{r.trackingNumber}</Link> },
    { header: "Date", render: (r) => formatDate(r.createdAt) },
    { header: "Route", render: (r) => `${r.from} to ${r.to}` },
    { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { header: "Fee", render: (r) => formatFee(r.feeAmount, r.feeCurrency) },
    {
      header: "Receipt",
      render: (r) => (
        <Button className="small" aria-label={`Receipt for ${r.trackingNumber}`}
          onClick={() => navigate(`${encodeURIComponent(r.trackingNumber)}/receipt`)}>
          Receipt
        </Button>
      ),
    },
  ];

  const choose = (next: HistoryFilter) => { setFilter(next); setPage(0); };

  return (
    <>
      <div className="filter-chips" role="group" aria-label="Filter deliveries">
        {FILTERS.map(([value, label]) => (
          <button key={value} type="button" className="chip" aria-pressed={filter === value} onClick={() => choose(value)}>
            {label}
          </button>
        ))}
      </div>
      <Card>
        {error && <div className="notice error" role="alert">{error}</div>}
        {loading ? (
          <p className="hint" role="status">Loading deliveries...</p>
        ) : (
          !error && <Table columns={columns} rows={rows} rowKey={(r) => r.trackingNumber}
            emptyMessage={filter === "all" ? "You have no deliveries yet." : "No deliveries match this filter."} />
        )}
        {(page > 0 || hasMore) && !loading && (
          <div className="actions-row" style={{ marginTop: 16 }}>
            <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </>
  );
}
