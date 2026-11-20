import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, EmptyState, StatusBadge } from "../../components/ui";
import Timeline from "../../components/tracking/Timeline";
import DetailList from "../../components/tracking/DetailList";
import { formatDateTime, formatFee, formatWeight } from "../../components/tracking/format";
import { useParcelDetails } from "./useParcelDetails";
import "../../components/tracking/tracking.css";

/** Route: /customer/delivery-history/:trackingNumber */
export default function DeliveryDetails() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const { parcel, loading, error } = useParcelDetails(trackingNumber);
  const back = <Link to="/customer/delivery-history" className="btn inline" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}>Back to history</Link>;

  if (loading) return <Card><p className="hint" role="status">Loading delivery...</p></Card>;
  if (!parcel) return <Card><EmptyState title="Delivery not found" message={error || "We could not find that parcel."} action={back} /></Card>;

  return (
    <>
      <h2 className="sr-only">Delivery {parcel.trackingNumber}</h2>
      <div className="tracking-grid">
        <Card title="Details">
          <DetailList rows={[
            ["Tracking no.", parcel.trackingNumber],
            ["Status", <StatusBadge key="status" status={parcel.status} />],
            ["From", parcel.from],
            ["To", parcel.to],
            ["Recipient", parcel.recipientName],
            ["Weight", formatWeight(parcel.weightKg)],
            ["Total", formatFee(parcel.feeAmount, parcel.feeCurrency)],
          ]} />
        </Card>
        <Card title="Timeline">
          <Timeline steps={parcel.timeline} />
        </Card>
      </div>

      {parcel.status === "DELIVERED" && (
        <Card title="Proof of delivery" style={{ marginBottom: 20 }}>
          {parcel.proof ? (
            <div className="proof">
              {parcel.proof.photoUrl
                ? <img className="proof-photo" src={parcel.proof.photoUrl} alt={`Proof of delivery for ${parcel.trackingNumber}`} />
                : <div className="proof-photo">No photo</div>}
              <DetailList rows={[["Received by", parcel.proof.receivedBy], ["Time", formatDateTime(parcel.proof.at)]]} />
            </div>
          ) : (
            <p className="hint" style={{ margin: 0 }}>Proof of delivery is not available yet.</p>
          )}
        </Card>
      )}

      <div className="actions-row">
        <Button variant="primary" onClick={() => navigate("receipt")}>Download receipt</Button>
        {back}
      </div>
    </>
  );
}
