import type { DeliveryEstimate } from "../../types/delivery";
import type { FormEvent } from "react";
import type { FieldChange } from "../../components/Field";
import { Button } from "../../components/ui";
import { deliveryError } from "../../api/delivery";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import Field from "../../components/Field";
import "./GetQuote.css";
import { requestEstimate } from "../../api/delivery";
import DeliveryIcon from "../../components/delivery/DeliveryIcon";
import "../../components/delivery/delivery.css";

type Details = { pickupCity: string; dropoffCity: string; weight: string };

function validate(details: Details) {
  const errors: Partial<Record<keyof Details, string>> = {};
  for (const [name, label] of [["pickupCity", "Pickup city"], ["dropoffCity", "Drop-off city"]] as const) {
    if (!details[name].trim()) errors[name] = `${label} is required.`;
    else if (!/\p{L}/u.test(details[name])) errors[name] = "Enter a city name containing letters.";
  }
  if (!details.weight.trim()) errors.weight = "Parcel weight is required.";
  else if (!Number.isFinite(Number(details.weight)) || Number(details.weight) <= 0) {
    errors.weight = "Enter a weight greater than zero in kg.";
  }
  return errors;
}

export default function GetQuote() {
  const [details, setDetails] = useState({ pickupCity: "", dropoffCity: "", weight: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [requested, setRequested] = useState(false);
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => { generation.current += 1; abort.current?.abort(); }, []);
  const form = useRef<HTMLFormElement | null>(null);
  const focusInvalid = useRef(false);

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
    setRequested(false); setEstimate(null); setMessage(""); setBusy(false);
    generation.current += 1; abort.current?.abort();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(details);
    setErrors(nextErrors);
    setRequested(false);
    if (Object.keys(nextErrors).length) {
      focusInvalid.current = true;
      return;
    }
    const version = ++generation.current;
    abort.current?.abort(); abort.current = new AbortController();
    setBusy(true); setEstimate(null); setMessage("");
    try {
      const value = await requestEstimate(details, abort.current.signal);
      if (version === generation.current) setEstimate(value);
    } catch (caught) {
      const error = deliveryError(caught);
      if (version === generation.current && error.name !== "AbortError") setMessage(error.message);
    } finally {
      if (version === generation.current) { setRequested(true); setBusy(false); }
    }
  }

  const field = (name: keyof Details) => ({ name, value: details[name], onChange: change, error: errors[name], required: true });

  return (
    <div className="m2-delivery quote-page">
      <AuthLayout title="Get a Quote" subtitle="Enter your route and parcel weight to request a delivery fee estimate. All fields are required.">
        <p className="delivery-eyebrow quote-eyebrow"><DeliveryIcon name="route" />Plan your next delivery</p>
        {!estimate && <p className="quote-service-note"><DeliveryIcon name="shield" /><span>Fee estimates are currently unavailable until a configured service returns a price.</span></p>}
        <form ref={form} onSubmit={submit} noValidate>
          {Object.values(errors).some(Boolean) && <p className="notice error" role="alert">Please correct the highlighted fields to request an estimate.</p>}
          <div className="quote-route-fields">
          <Field label="Pickup city" {...field("pickupCity")} autoComplete="section-pickup address-level2" placeholder="e.g. Colombo" />
          <Field label="Drop-off city" {...field("dropoffCity")} autoComplete="section-dropoff address-level2" placeholder="e.g. Kandy" />
          </div>
          <Field label="Parcel weight (kg)" {...field("weight")} type="number" inputMode="decimal" min="0" step="any" aria-describedby="quote-weight-help" />
          <p id="quote-weight-help" className="hint">Enter the packed parcel's weight in kilograms, e.g. 0.75.</p>
          <Button type="submit" variant="primary" block disabled={busy}>{busy ? "Requesting estimate..." : "Request estimate"}<DeliveryIcon name="arrow" /></Button>
        </form>
        <div role="status" aria-atomic="true">
          {requested && (
            <div className={`quote-result${estimate ? " has-estimate" : ""}`}>
              <div className="quote-result-icon"><DeliveryIcon name={estimate ? "parcel" : "shield"} /></div>
              <h3>{estimate ? "Indicative estimate" : "Estimate unavailable"}</h3>
              {estimate ? <><p className="quote-price">{estimate.fee.currency} {estimate.fee.amount}</p><p>This estimate is not a delivery booking. Confirm a full delivery quote after login.</p></>
                : <><p>No delivery fee has been calculated and no delivery has been placed.</p>{message && <p>{message}</p>}</>}
            </div>
          )}
        </div>
        <div className="links">
          <Link to="/login">Log in to place a delivery</Link>
        </div>
        <p className="hint quote-login-note">After logging in, request and review a full delivery quote before confirming an order.</p>
      </AuthLayout>
    </div>
  );
}
