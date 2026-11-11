import type { DeliveryQuote, DeliveryReceipt, ConfirmationAttempt } from "../../types/delivery";
import type { FormEvent } from "react";
import type { FieldChange } from "../../components/Field";
import { Button, Card } from "../../components/ui";
import { deliveryError } from "../../api/delivery";
import { useEffect, useRef, useState } from "react";
import Field from "../../components/Field";
import { isPhone } from "../../utils/validate";
import "./CreateDelivery.css";
import { requestDeliveryQuote, confirmDelivery, fieldErrors } from "../../api/delivery";
import DeliveryIcon from "../../components/delivery/DeliveryIcon";
import DeliverySteps from "../../components/delivery/DeliverySteps";
import "../../components/delivery/delivery.css";

const initialDetails = {
  pickupAddress: "", dropoffAddress: "", weight: "", length: "", width: "", height: "",
  recipientName: "", recipientPhone: "",
};
type Details = typeof initialDetails;
const dimensions: [keyof Details, string][] = [["length", "Length"], ["width", "Width"], ["height", "Height"]];

function validate(details: Details) {
  const errors: Partial<Record<keyof Details, string>> = {};
  for (const [name, label] of [["pickupAddress", "Pickup address"], ["dropoffAddress", "Drop-off address"], ["recipientName", "Recipient name"]] as const) {
    if (!details[name].trim()) errors[name] = `${label} is required.`;
  }
  for (const [name, label, unit] of [["weight", "Weight", "kg"], ...dimensions.map(([name, label]) => [name, label, "cm"])] as [keyof Details, string, string][]) {
    if (!details[name].trim() || !Number.isFinite(Number(details[name])) || Number(details[name]) <= 0) {
      errors[name] = `Enter a ${label.toLowerCase()} greater than zero in ${unit}.`;
    }
  }
  if (!isPhone(details.recipientPhone)) errors.recipientPhone = "Enter a 10-digit phone number starting with 0, e.g. 0771234567. Spaces are allowed.";
  return errors;
}

export default function CreateDelivery() {
  const [details, setDetails] = useState(initialDetails);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [step, setStep] = useState("details");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [receipt, setReceipt] = useState<DeliveryReceipt | null>(null);
  const [now, setNow] = useState(Date.now());
  const generation = useRef(0);
  const quoteAbort = useRef<AbortController | null>(null);
  const frozenAttempt = useRef<ConfirmationAttempt | null>(null);
  const confirmationInFlight = useRef(false);
  const receiptHeading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => { if (receipt) receiptHeading.current?.focus(); }, [receipt]);
  useEffect(() => () => { generation.current += 1; quoteAbort.current?.abort(); }, []);
  useEffect(() => {
    if (!quote) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [quote]);
  const expired = Boolean(quote && Date.parse(quote.expiresAt) <= now);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const form = useRef<HTMLFormElement | null>(null);
  const focusInvalid = useRef(false);
  const previousStep = useRef(step);

  useEffect(() => {
    if (previousStep.current !== step) heading.current?.focus();
    previousStep.current = step;
  }, [step]);

  useEffect(() => {
    if (focusInvalid.current) {
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      focusInvalid.current = false;
    }
  }, [errors]);

  function change(event: FieldChange) {
    const { name, value } = event.target;
    setDetails((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    generation.current += 1;
    quoteAbort.current?.abort();
    setQuote(null); setAccepted(false); setNotice("");
  }

  function review(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(details);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusInvalid.current = true;
      return;
    }
    setStep("review");
    loadQuote();
  }

  async function loadQuote() {
    if (uncertain || confirmationInFlight.current) return;
    const version = ++generation.current;
    quoteAbort.current?.abort();
    quoteAbort.current = new AbortController();
    setQuoting(true); setQuote(null); setAccepted(false); setNotice("");
    try {
      const value = await requestDeliveryQuote(details, quoteAbort.current.signal);
      if (version === generation.current) { setQuote(value); setNow(Date.now()); }
    } catch (caught) {
      const error = deliveryError(caught);
      if (version !== generation.current || error.name === "AbortError") return;
      setNotice(error.message);
      const next = fieldErrors(error.fields);
      if (Object.keys(next).length) { setErrors(next); setStep("details"); focusInvalid.current = true; }
    } finally {
      if (version === generation.current) setQuoting(false);
    }
  }

  function editDetails() {
    if (uncertain || confirming) return;
    generation.current += 1; quoteAbort.current?.abort();
    setQuote(null); setAccepted(false); setQuoting(false); setNotice(""); setStep("details");
  }

  async function placeDelivery() {
    if (confirmationInFlight.current || (!uncertain && (!quote || expired || !accepted))) return;
    let attempt = frozenAttempt.current;
    if (!attempt) {
      if (!quote) return;
      attempt = {
        quoteId: quote.quoteId,
        recipient: { name: details.recipientName.trim(), phone: details.recipientPhone.trim() },
        fee: quote.fee,
      };
    }
    frozenAttempt.current = attempt;
    confirmationInFlight.current = true;
    setConfirming(true); setNotice("");
    try {
      const result = await confirmDelivery(attempt.quoteId, attempt.recipient, attempt.fee);
      setReceipt(result); setUncertain(false);
    } catch (caught) {
      const error = deliveryError(caught);
      if (error.code === "QUOTE_PRICE_CHANGED" && error.revisedQuote) {
        setQuote(error.revisedQuote); setNow(Date.now()); setAccepted(false);
        setNotice("The delivery fee changed. Review the revised fee and accept it before confirming again.");
        frozenAttempt.current = null; setUncertain(false);
      } else if (error.status === 0 || error.status >= 500 || error.status == null) {
        setUncertain(true);
        setNotice("The delivery outcome is not yet verified. Retry the same confirmation; do not start a new delivery.");
      } else {
        setNotice(error.message);
        setQuote(null); setAccepted(false); frozenAttempt.current = null; setUncertain(false);
        const next = fieldErrors(error.fields);
        if (Object.keys(next).length) { setErrors(next); setStep("details"); focusInvalid.current = true; }
      }
    } finally {
      confirmationInFlight.current = false; setConfirming(false);
    }
  }

  const field = (name: keyof Details) => ({ name, value: details[name], onChange: change, error: errors[name], required: true });
  const reviewing = step === "review";

  if (receipt) return (
    <div className="m2-delivery delivery-focused delivery-success">
    <Card aria-labelledby="delivery-complete">
      <div className="delivery-icon-tile is-success"><DeliveryIcon name="check" /></div>
      <p className="delivery-eyebrow">Booking confirmation</p>
      <h2 id="delivery-complete" ref={receiptHeading} tabIndex={-1}>Delivery confirmed</h2>
      <p className="sub" role="status">Your delivery has been saved.</p>
      <dl className="delivery-tracking">
        <dt>Tracking number</dt><dd>{receipt.trackingNumber}</dd>
      </dl>
      <dl className="delivery-summary">
        <div><dt>Status</dt><dd><span className="delivery-status is-success">{receipt.status}</span></dd></div>
        <div><dt>Accepted fee</dt><dd>{receipt.fee.currency} {receipt.fee.amount}</dd></div>
      </dl>
      <p className="hint">Keep your tracking number for reference. This receipt records the creation of your delivery.</p>
      <div className="delivery-actions">
        <a className="btn primary" href="/customer/create-delivery">Create another delivery <DeliveryIcon name="arrow" /></a>
        <a className="btn" href={`/customer/cancel-delivery?tracking=${encodeURIComponent(receipt.trackingNumber)}`}>Cancel this delivery</a>
      </div>
      <p className="delivery-safety"><DeliveryIcon name="shield" />Cancellation is available before pickup and does not promise a refund or fee waiver.</p>
    </Card>
    </div>
  );

  return (
    <div className="m2-delivery delivery-request">
      <header className="delivery-page-intro">
        <p className="delivery-eyebrow">SwiftDrop / Send a parcel</p>
        <h2>{reviewing ? "One last look, then you're ready." : "Your next delivery starts here."}</h2>
        <p>{reviewing ? "Review your route, recipient and fee before confirming." : "A few details. A clear price. A delivery ready to go."}</p>
      </header>
      <div className="delivery-flow-header">
        <DeliverySteps labels={["Delivery details", "Review & confirm"]} current={reviewing ? 1 : 0} label="Delivery request progress" />
        <p className="hint"><a href="/customer/recover-delivery" target="_blank" rel="noopener noreferrer">Check a previous confirmation</a></p>
      </div>
      <div className="delivery-grid">
        <Card aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" ref={heading} tabIndex={-1}>{reviewing ? "Review your delivery details" : "Where are you sending your parcel?"}</h2>
          <p className="sub">{reviewing ? "Check the details below. You can return to edit them before leaving this page." : "Enter the addresses, parcel size, and recipient details. All fields are required."}</p>

          {reviewing ? (
            <>
              <dl className="delivery-summary">
                <div className="delivery-route-row"><dt><DeliveryIcon name="route" /> Pickup address</dt><dd>{details.pickupAddress.trim()}</dd></div>
                <div className="delivery-route-row"><dt><DeliveryIcon name="route" /> Drop-off address</dt><dd>{details.dropoffAddress.trim()}</dd></div>
                <div><dt>Parcel weight</dt><dd>{details.weight} kg</dd></div>
                <div><dt>Parcel size (length × width × height)</dt><dd>{details.length} × {details.width} × {details.height} cm</dd></div>
                <div><dt>Recipient name</dt><dd>{details.recipientName.trim()}</dd></div>
                <div><dt>Recipient phone</dt><dd>{details.recipientPhone.trim()}</dd></div>
              </dl>
              <p className="hint">These details are held only on this page. Leaving or refreshing clears them.</p>
              <Button type="button" block disabled={confirming || uncertain} onClick={editDetails}>Back to edit details</Button>
            </>
          ) : (
            <form ref={form} onSubmit={review} noValidate>
              {Object.values(errors).some(Boolean) && <p className="notice error" role="alert">Please correct the highlighted fields before reviewing your delivery.</p>}
              <fieldset>
                <legend><span className="delivery-section-heading"><DeliveryIcon name="route" />Addresses</span></legend>
                <Field label="Pickup address" {...field("pickupAddress")} placeholder="House or building, street, city, postal code" autoComplete="off" />
                <Field label="Drop-off address" {...field("dropoffAddress")} placeholder="House or building, street, city, postal code" autoComplete="off" />
              </fieldset>
              <fieldset>
                <legend><span className="delivery-section-heading"><DeliveryIcon name="parcel" />Parcel details</span></legend>
                <Field label="Parcel weight (kg)" type="number" step="any" min="0" {...field("weight")} />
                <p id="delivery-size-help" className="hint">Measure the outside of the packed parcel in centimetres.</p>
                <div className="delivery-dimensions">
                  {dimensions.map(([name, label]) => <Field key={name} label={`${label} (cm)`} type="number" step="any" min="0" aria-describedby="delivery-size-help" {...field(name)} />)}
                </div>
              </fieldset>
              <fieldset>
                <legend><span className="delivery-section-heading"><DeliveryIcon name="person" />Recipient</span></legend>
                <div className="delivery-two-fields">
                <Field label="Recipient name" autoComplete="section-recipient name" {...field("recipientName")} />
                <Field label="Recipient phone" type="tel" inputMode="tel" autoComplete="section-recipient tel-national" aria-describedby="delivery-phone-help" {...field("recipientPhone")} />
                </div>
                <p id="delivery-phone-help" className="hint">Use a local 10-digit number starting with 0, e.g. 0771234567.</p>
              </fieldset>
              <Button type="submit" variant="primary" block>Review delivery details <DeliveryIcon name="arrow" /></Button>
              <p className="hint delivery-form-note">Reviewing does not place an order. Details are cleared if you leave or refresh this page.</p>
            </form>
          )}
        </Card>

        <Card as="aside" className="delivery-estimate" aria-labelledby="delivery-estimate-heading">
          <div className="delivery-icon-tile"><DeliveryIcon name="parcel" /></div>
          <p className="delivery-eyebrow">Your delivery summary</p>
          <h2 id="delivery-estimate-heading">Delivery fee</h2>
          {quote ? (
            <>
              <p className="delivery-price">{quote.fee.currency} {quote.fee.amount}</p>
              <p className="hint">Quote expires: {new Date(quote.expiresAt).toLocaleString()}</p>
              <p className="hint">Quote reference: <code>{quote.quoteId}</code>. Keep this reference to check a saved confirmation.</p>
              {expired && !uncertain && <p role="status">Quote expired. Request a new fee before confirming.</p>}
              <label className="delivery-acceptance">
                <input type="checkbox" checked={accepted} disabled={expired || confirming || uncertain}
                  onChange={(event) => setAccepted(event.target.checked)} /><span>I accept the displayed delivery fee.</span>
              </label>
            </>
          ) : (
            <>
              <p className="delivery-unavailable">Estimate unavailable</p>
              <p className="sub">{quoting ? "Requesting the current fee..." : "No price is available. Request a current delivery quote before confirming."}</p>
            </>
          )}
          {notice && <p className="notice" role="status">{notice}</p>}
          {uncertain && frozenAttempt.current && <p><a
            href={`/customer/recover-delivery?quote=${encodeURIComponent(frozenAttempt.current.quoteId)}`}
            target="_blank" rel="noopener noreferrer">Check saved confirmation in a new tab</a></p>}
          <hr />
          <h3>{quote || uncertain ? "Confirm delivery" : "Order submission unavailable"}</h3>
          <p id="delivery-submit-help" className="sub">{uncertain
            ? "Keep this page open. The same quote and recipient details will be used for retry."
            : "Reviewing does not place an order. Confirm only after accepting a current server-calculated fee. No order has been placed."}</p>
          {reviewing && !uncertain && <Button type="button" block disabled={quoting || confirming} onClick={loadQuote}>Request new fee</Button>}
          <Button type="button" variant="primary" block
            disabled={confirming || quoting || (!uncertain && (!reviewing || !quote || expired || !accepted))}
            onClick={placeDelivery} aria-describedby="delivery-submit-help">
            {confirming ? "Confirming delivery..." : uncertain ? "Retry confirmation"
              : quote ? "Confirm delivery" : "Place delivery request (unavailable)"}
          </Button>
          <p className="delivery-safety"><DeliveryIcon name="shield" />You stay in control. A delivery is placed only after you accept a current fee and confirm.</p>
        </Card>
      </div>
    </div>
  );
}
