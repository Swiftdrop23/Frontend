import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, StatusBadge, Table } from "../../components/ui";
import type { Column } from "../../components/ui";
import { listMerchantOrders } from "../../api/merchant";
import { bookMerchantOrder, isBooked, shownStatus } from "../../api/merchantBooking";
import type { BookableOrder } from "../../api/merchantBooking";
import "./merchant.css";
import "./merchantOrders.css";

export default function Orders() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<BookableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () =>
    listMerchantOrders()
      .then((rows) => setOrders(rows as BookableOrder[]))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { void load(); }, []);

  const book = async (event: MouseEvent, order: BookableOrder) => {
    event.stopPropagation();
    setBooking(order.id);
    setNotice(null);
    try {
      await bookMerchantOrder(order.id);
      setNotice({ ok: true, text: `Delivery booked for ${order.trackingNumber}. A dispatcher will assign a courier.` });
      await load();
    } catch (e) {
      setNotice({ ok: false, text: (e as Error).message });
    } finally {
      setBooking(null);
    }
  };

  const columns: Column<BookableOrder>[] = [
    { header: "Order", render: (o) => `#${o.id}` },
    { header: "Tracking no.", render: (o) => o.trackingNumber },
    { header: "Recipient", render: (o) => o.recipientName },
    { header: "Status", render: (o) => (isBooked(o) ? <StatusBadge status={shownStatus(o)} /> : <span className="mo-new">New order</span>) },
    {
      header: "Delivery",
      render: (o) => (isBooked(o)
        ? <span className="mo-muted">Booked</span>
        : <button type="button" className="mo-book" disabled={booking === o.id} onClick={(e) => void book(e, o)}>
            {booking === o.id ? "Booking…" : "Book delivery"}
          </button>),
    },
  ];

  const toBook = orders.filter((o) => !isBooked(o)).length;
  const count = (...s: string[]) => orders.filter((o) => s.includes(shownStatus(o))).length;

  if (loading) return <p className="hint">Loading orders...</p>;
  if (error) return <div className="notice error">{error}</div>;

  return (
    <>
      <div className="stats">
        <div className="stat"><span>New orders to book</span><strong>{toBook}</strong></div>
        <div className="stat"><span>In transit</span><strong>{count("PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY")}</strong></div>
        <div className="stat"><span>Delivered</span><strong>{count("DELIVERED")}</strong></div>
        <div className="stat"><span>Cancelled</span><strong>{count("CANCELLED")}</strong></div>
      </div>
      {toBook > 0 && (
        <p className="mo-banner" role="status">
          You have {toBook} new {toBook === 1 ? "order" : "orders"} from your shop. Pack the item, then choose Book delivery so a SwiftDrop courier collects it.
        </p>
      )}
      {notice && <div className={`notice ${notice.ok ? "ok" : "error"}`} role="status">{notice.text}</div>}
      <Card title="Recent orders">
        <div
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            const tr = (e.target as HTMLElement).closest("tbody tr");
            if (!tr) return;
            const idx = Array.from(tr.parentElement!.children).indexOf(tr);
            if (orders[idx]) nav(`/merchant/orders/${orders[idx].id}`);
          }}
        >
          <Table columns={columns} rows={orders} rowKey={(o) => o.id} emptyMessage="No orders yet. Orders from your shop appear here." />
        </div>
      </Card>
    </>
  );
}
