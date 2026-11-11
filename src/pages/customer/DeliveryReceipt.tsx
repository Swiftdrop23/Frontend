import { Link, useParams } from "react-router-dom";
import { Button, Card, EmptyState, StatusBadge } from "../../components/ui";
import DetailList from "../../components/tracking/DetailList";
import { formatDate, formatFee, formatWeight } from "../../components/tracking/format";
import { useParcelDetails } from "./useParcelDetails";
import "../../components/tracking/tracking.css";

/** Route: /customer/delivery-history/:trackingNumber/receipt */
export default function DeliveryReceipt() {
  const { trackingNumber } = useParams();
  const { parcel, loading, error } = useParcelDetails(trackingNumber);
  const back = <Link to="/customer/delivery-history" className="btn inline no-print" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}>Back to history</Link>;

  if (loading) return <Card><p className="hint" role="status">Loading receipt...</p></Card>;
  if (!parcel) return <Card><EmptyState title="Receipt not found" message={error || "We could not find that parcel."} action={back} /></Card>;

  // Until the backend PDF endpoint exists, the browser's print dialog saves the receipt as a PDF.
  const downloadPdf = () => window.print();

  return (
    <Card className="receipt" title="SwiftDrop receipt" actions={<StatusBadge status={parcel.status} />}>
      <DetailList rows={[
        ["Tracking number", parcel.trackingNumber],
        ["Date", formatDate(parcel.createdAt)],
        ["From", parcel.from],
        ["To", parcel.to],
        ["Recipient", parcel.recipientName],
        ["Weight", formatWeight(parcel.weightKg)],
        ["Total paid", formatFee(parcel.feeAmount, parcel.feeCurrency)],
      ]} />
      <div className="actions-row no-print" style={{ marginTop: 24 }}>
        <Button variant="primary" onClick={downloadPdf}>Download PDF</Button>
        {back}
      </div>
    </Card>
  );
}
