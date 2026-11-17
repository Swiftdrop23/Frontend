import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, StatusBadge, Table } from "../../components/ui";
import type { Column } from "../../components/ui";
import { listMerchantOrders } from "../../api/merchant";
import type { MerchantOrder } from "../../api/merchant";
import "./merchant.css";

const columns: Column<MerchantOrder>[] = [
  { header: "Order", render: (o) => `#${o.id}` },
  { header: "Tracking no.", render: (o) => o.trackingNumber },
  { header: "Recipient", render: (o) => o.recipientName },
  { header: "Status", render: (o) => <StatusBadge status={o.status} /> },
];

export default function Orders() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listMerchantOrders()
      .then(setOrders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const count = (...s: string[]) => orders.filter((o) => s.includes(o.status)).length;

  if (loading) return <p className="hint">Loading orders...</p>;
  if (error) return <div className="notice error">{error}</div>;

  return (
    <>
      <div className="stats">
        <div className="stat"><span>Total orders</span><strong>{orders.length}</strong></div>
        <div className="stat"><span>In transit</span><strong>{count("PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY")}</strong></div>
        <div className="stat"><span>Delivered</span><strong>{count("DELIVERED")}</strong></div>
        <div className="stat"><span>Cancelled</span><strong>{count("CANCELLED")}</strong></div>
      </div>
      <Card title="Recent orders">
        <div
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            const tr = (e.target as HTMLElement).closest("tbody tr");
            if (!tr) return;
            const idx = Array.from(tr.parentElement!.children).indexOf(tr);
            nav(`/merchant/orders/${orders[idx].id}`);
          }}
        >
          <Table columns={columns} rows={orders} rowKey={(o) => o.id} emptyMessage="No orders yet. Create one with the API." />
        </div>
      </Card>
    </>
  );
}