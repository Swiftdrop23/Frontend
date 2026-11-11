import { useEffect, useState } from "react";
import { Card, StatusBadge, Table } from "../../components/ui";
import type { Column } from "../../components/ui";
import { listParcels } from "../../api/parcels";
import { errMessage } from "../../utils/errors";
import type { Parcel } from "../../types";

// REFERENCE PAGE (not routed). Copy this pattern for your own pages:
// load data from src/api/*, handle errors, render with the shared UI components.
const columns: Column<Parcel>[] = [
  { header: "Tracking #", render: (p) => p.trackingNumber },
  { header: "Receiver", render: (p) => p.receiverName },
  { header: "Address", render: (p) => p.receiverAddress },
  { header: "Status", render: (p) => <StatusBadge status={p.status} /> },
];

export default function ParcelListExample() {
  const [rows, setRows] = useState<Parcel[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listParcels()
      .then(setRows)
      .catch((e) => setError(errMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Parcels">
      {error && <div className="notice error" role="alert">{error}</div>}
      {loading ? <p className="hint">Loading...</p> : <Table columns={columns} rows={rows} rowKey={(p) => p.id} />}
    </Card>
  );
}
