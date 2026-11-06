import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import "./GetQuote.css";

function validate(details) {
  const errors = {};
  for (const [name, label] of [["pickupCity", "Pickup city"], ["dropoffCity", "Drop-off city"]]) {
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
  const [errors, setErrors] = useState({});
  const [requested, setRequested] = useState(false);
  const form = useRef(null);
  const focusInvalid = useRef(false);

  useEffect(() => {
    if (focusInvalid.current) {
      form.current?.querySelector('[aria-invalid="true"]')?.focus();
      focusInvalid.current = false;
    }
  }, [errors]);

  function change(event) {
    const { name, value } = event.target;
    setDetails((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setRequested(false);
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = validate(details);
    setErrors(nextErrors);
    setRequested(false);
    if (Object.keys(nextErrors).length) {
      focusInvalid.current = true;
      return;
    }
    // Replace this unavailable state only once a public quote API is agreed.
    setRequested(true);
  }

  const field = (name) => ({ name, value: details[name], onChange: change, error: errors[name], required: true });

  return (
    <div className="quote-page">
      <AuthLayout title="Get a Quote" subtitle="Enter your route and parcel weight to request a delivery fee estimate. All fields are required.">
        <p className="quote-service-note">Fee estimates are currently unavailable while the quote service is being connected.</p>
        <form ref={form} onSubmit={submit} noValidate>
          {Object.values(errors).some(Boolean) && <p className="notice error" role="alert">Please correct the highlighted fields to request an estimate.</p>}
          <Field label="Pickup city" {...field("pickupCity")} autoComplete="section-pickup address-level2" placeholder="e.g. Colombo" />
          <Field label="Drop-off city" {...field("dropoffCity")} autoComplete="section-dropoff address-level2" placeholder="e.g. Kandy" />
          <Field label="Parcel weight (kg)" {...field("weight")} type="number" inputMode="decimal" min="0" step="any" aria-describedby="quote-weight-help" />
          <p id="quote-weight-help" className="hint">Enter the packed parcel's weight in kilograms, e.g. 0.75.</p>
          <button type="submit" className="btn primary">Request estimate</button>
        </form>
        <div role="status" aria-atomic="true">
          {requested && (
            <div className="quote-result">
              <h3>Estimate unavailable</h3>
              <p>The quote service is not connected yet. No delivery fee has been calculated and no delivery has been placed.</p>
            </div>
          )}
        </div>
        <div className="links">
          <Link to="/login">Log in to place a delivery</Link>
        </div>
        <p className="hint quote-login-note">After logging in, you can enter and review delivery details. Order submission is currently unavailable.</p>
      </AuthLayout>
    </div>
  );
}
