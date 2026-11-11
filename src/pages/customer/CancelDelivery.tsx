import type { DeliveryState } from "../../types/delivery";
import type { FormEvent } from "react";
import type { FieldChange } from "../../components/Field";
import { Button, Card } from "../../components/ui";
import { deliveryError } from "../../api/delivery";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Field from "../../components/Field";
import { cancelDelivery, lookupDeliveryForCancellation } from "../../api/delivery";
import DeliveryIcon from "../../components/delivery/DeliveryIcon";
import DeliverySteps from "../../components/delivery/DeliverySteps";
import "../../components/delivery/delivery.css";
import "./CancelDelivery.css";

export default function CancelDelivery() {
  const [params] = useSearchParams();
  const [tracking, setTracking] = useState(() => params.get("tracking") || "");
  const [delivery, setDelivery] = useState<DeliveryState | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const form = useRef<HTMLFormElement | null>(null);
  const resultHeading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => { if (delivery) resultHeading.current?.focus(); }, [delivery]);
  useEffect(() => () => { generation.current += 1; abort.current?.abort(); }, []);

  function edit(event: FieldChange) {
    if (uncertain || inFlight.current) return;
    setTracking(event.target.value); setDelivery(null); setAccepted(false); setMessage(""); setBusy(false);
    generation.current += 1; abort.current?.abort();
  }

  async function lookup(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || uncertain) return;
    const reference = tracking.trim();
    if (!reference) { setMessage("Enter a tracking number."); form.current?.querySelector("input")?.focus(); return; }
    const version = ++generation.current;
    abort.current?.abort(); abort.current = new AbortController();
    setBusy(true); setDelivery(null); setAccepted(false); setMessage("");
    try {
      const found = await lookupDeliveryForCancellation(reference, abort.current.signal);
      if (version === generation.current) { setDelivery(found); setTracking(reference); }
    } catch (caught) {
      const error = deliveryError(caught);
      if (version === generation.current && error.name !== "AbortError") {
        setMessage(error.status === 404 ? "Delivery not found in your account." : error.message || "Delivery lookup is unavailable.");
      }
    } finally { if (version === generation.current) setBusy(false); }
  }

  async function cancel() {
    if (inFlight.current || !delivery || (!uncertain && !accepted)) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      const result = await cancelDelivery(delivery.trackingNumber);
      setDelivery(result); setUncertain(false); setAccepted(false);
    } catch (caught) {
      const error = deliveryError(caught);
      if (error.status === 0 || error.status >= 500 || error.status == null) {
        setUncertain(true);
        setMessage("The cancellation outcome is unknown. Keep this page open and retry the same cancellation.");
      } else {
        setUncertain(false); setAccepted(false); setDelivery(null);
        setMessage(error.status === 409 ? "This delivery can no longer be cancelled. It has reached pickup or a later state."
          : error.message || "Cancellation was refused. Check the delivery again.");
      }
    } finally { inFlight.current = false; setBusy(false); }
  }

  const cancellable = delivery && ["CREATED", "PENDING"].includes(delivery.status);
  const cancelled = delivery?.status === "CANCELLED";
  return (
    <div className="m2-delivery delivery-focused delivery-cancellation">
      <header className="delivery-page-intro">
        <p className="delivery-eyebrow">SwiftDrop / Manage a delivery</p>
        <h2>Plans change. We're here to help.</h2>
        <p>Find your delivery and check whether it can still be cancelled.</p>
      </header>
      <DeliverySteps labels={["Find delivery", "Review & confirm", "Result"]} current={cancelled || (delivery && !cancellable) ? 2 : delivery ? 1 : 0} label="Cancellation progress" />
    <Card aria-labelledby="cancel-heading">
      <div className="delivery-icon-tile"><DeliveryIcon name="search" /></div>
      <h2 id="cancel-heading">Cancel a delivery</h2>
      <p className="sub">You can cancel your own delivery before pickup. Cancellation does not promise a refund or fee waiver.</p>
      <form ref={form} onSubmit={lookup}>
        <Field label="Tracking number" name="trackingNumber" value={tracking} onChange={edit} placeholder="Enter your tracking number" aria-describedby={message ? "cancel-tracking-help cancel-feedback" : "cancel-tracking-help"} aria-invalid={!tracking.trim() && Boolean(message)} disabled={uncertain || (busy && Boolean(delivery))} />
        <p className="hint" id="cancel-tracking-help">Use the tracking number from your delivery confirmation.</p>
        <Button type="submit" variant="primary" block disabled={busy || uncertain}><DeliveryIcon name="search" />Find my delivery</Button>
      </form>
      {message && <p id="cancel-feedback" role="alert" className="notice error">{message}</p>}
      {delivery && <div className="delivery-cancel-result" aria-live="polite">
        <div className="delivery-result-header">
          <div className={`delivery-icon-tile${cancelled ? " is-success" : ""}`}><DeliveryIcon name={cancelled ? "check" : cancellable ? "parcel" : "close"} /></div>
          <div>
            <h3 ref={resultHeading} tabIndex={-1}>{cancelled ? "Cancellation complete" : cancellable ? "Review this delivery" : "Cancellation unavailable"}</h3>
            <p className={`delivery-status${cancelled ? " is-success" : cancellable ? "" : " is-warning"}`}>Status: {delivery.status}</p>
          </div>
        </div>
        <p className="delivery-cancel-reference">Tracking number: <strong>{delivery.trackingNumber}</strong></p>
        {cancelled ? <>
          <p role="status" className="delivery-cancel-success">Delivery cancelled. No further cancellation is needed.</p>
          <a className="btn" href="/customer/create-delivery">Create a new delivery <DeliveryIcon name="arrow" /></a>
        </>
          : cancellable ? <>
            <p className="sub">This delivery is still before pickup. Confirm below if you want to cancel it.</p>
            <label className="delivery-acceptance"><input type="checkbox" checked={accepted} disabled={busy || uncertain}
              onChange={(event) => setAccepted(event.target.checked)} /><span>I want to cancel this delivery.</span></label>
            <Button type="button" variant="danger" block onClick={cancel} disabled={busy || (!uncertain && !accepted)}>
              {busy ? "Cancelling..." : uncertain ? "Retry cancellation" : "Confirm cancellation"}
            </Button>
          </> : <p className="notice">This delivery cannot be cancelled because pickup has occurred or it is already completed.</p>}
      </div>}
      <p className="delivery-safety"><DeliveryIcon name="shield" />Finding a delivery does not cancel it. We check its current status again when you confirm.</p>
    </Card>
    </div>
  );
}
