import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { downloadReceiptPdf } from "../../api/tracking";
import { errMessage } from "../../utils/errors";
import { Button, Card, EmptyState, StatusBadge } from "../../components/ui";
import DetailList from "../../components/tracking/DetailList";
import { formatDate, formatFee, formatWeight } from "../../components/tracking/format";
import { useParcelDetails } from "./useParcelDetails";
import "../../components/tracking/tracking.css";

/** Route: /customer/delivery-history/:trackingNumber/receipt */
export default function DeliveryReceipt() {
  const { trackingNumber } = useParams();
  const { parcel, loading, error } = useParcelDetails(trackingNumber);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const back = <Link to="/customer/delivery-history" className="btn inline no-print" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}>Back to history</Link>;

  if (loading) return <Card><p className="hint" role="status">Loading receipt...</p></Card>;
  if (!parcel) return <Card><EmptyState title="Receipt not found" message={error || "We could not find that parcel."} action={back} /></Card>;

  const downloadPdf = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      // Mock mode has no backend PDF; the print dialog can still "Save as PDF".
      if (!(await downloadReceiptPdf(parcel.trackingNumber))) window.print();
    } catch (e) {
      setDownloadError(errMessage(e));
    } finally {
      setDownloading(false);
    }
  };

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
      {downloadError && <div className="notice error no-print" role="alert" style={{ marginTop: 16 }}>{downloadError}</div>}
      <div className="actions-row no-print" style={{ marginTop: 24 }}>
        <Button variant="primary" loading={downloading} onClick={downloadPdf}>Download PDF</Button>
        {back}
      </div>
    </Card>
  );
}
