import { useEffect, useRef, useState } from "react";
import Field from "../components/Field";
import { isPhone } from "../utils/validate";
import "./CreateDelivery.css";

const initialDetails = {
  pickupAddress: "", dropoffAddress: "", weight: "", length: "", width: "", height: "",
  recipientName: "", recipientPhone: "",
};
const dimensions = [["length", "Length"], ["width", "Width"], ["height", "Height"]];

function validate(details) {
  const errors = {};
  for (const [name, label] of [["pickupAddress", "Pickup address"], ["dropoffAddress", "Drop-off address"], ["recipientName", "Recipient name"]]) {
    if (!details[name].trim()) errors[name] = `${label} is required.`;
  }
  for (const [name, label, unit] of [["weight", "Weight", "kg"], ...dimensions.map(([name, label]) => [name, label, "cm"])]) {
    if (!details[name].trim() || !Number.isFinite(Number(details[name])) || Number(details[name]) <= 0) {
      errors[name] = `Enter a ${label.toLowerCase()} greater than zero in ${unit}.`;
    }
  }
  if (!isPhone(details.recipientPhone)) errors.recipientPhone = "Enter a 10-digit phone number starting with 0, e.g. 0771234567. Spaces are allowed.";
  return errors;
}

export default function CreateDelivery() {
  const [details, setDetails] = useState(initialDetails);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("details");
  const heading = useRef(null);
  const form = useRef(null);
  const focusInvalid = useRef(false);
  const previousStep = useRef(step);

  useEffect(() => {
    if (previousStep.current !== step) heading.current?.focus();
    previousStep.current = step;
  }, [step]);

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
  }

  function review(event) {
    event.preventDefault();
    const nextErrors = validate(details);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusInvalid.current = true;
      return;
    }
    setStep("review");
  }

  const field = (name) => ({ name, value: details[name], onChange: change, error: errors[name], required: true });
  const reviewing = step === "review";

  return (
    <div className="delivery-request">
      <ol className="delivery-steps" aria-label="Delivery request progress">
        <li aria-current={!reviewing ? "step" : undefined}>1. Delivery details</li>
        <li aria-current={reviewing ? "step" : undefined}>2. Review details</li>
      </ol>
      <div className="delivery-grid">
        <section className="card" aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" ref={heading} tabIndex={-1}>{reviewing ? "Review your delivery details" : "Where are you sending your parcel?"}</h2>
          <p className="sub">{reviewing ? "Check the details below. You can return to edit them before leaving this page." : "Enter the addresses, parcel size, and recipient details. All fields are required."}</p>

          {reviewing ? (
            <>
              <dl className="delivery-summary">
                <div><dt>Pickup address</dt><dd>{details.pickupAddress.trim()}</dd></div>
                <div><dt>Drop-off address</dt><dd>{details.dropoffAddress.trim()}</dd></div>
                <div><dt>Parcel weight</dt><dd>{details.weight} kg</dd></div>
                <div><dt>Parcel size (length × width × height)</dt><dd>{details.length} × {details.width} × {details.height} cm</dd></div>
                <div><dt>Recipient name</dt><dd>{details.recipientName.trim()}</dd></div>
                <div><dt>Recipient phone</dt><dd>{details.recipientPhone.trim()}</dd></div>
              </dl>
              <p className="hint">These details are held only on this page. Leaving or refreshing clears them.</p>
              <button type="button" className="btn" onClick={() => setStep("details")}>Back to edit details</button>
            </>
          ) : (
            <form ref={form} onSubmit={review} noValidate>
              {Object.values(errors).some(Boolean) && <p className="notice error" role="alert">Please correct the highlighted fields before reviewing your delivery.</p>}
              <fieldset>
                <legend>Addresses</legend>
                <Field label="Pickup address" {...field("pickupAddress")} placeholder="House or building, street, city, postal code" autoComplete="off" />
                <Field label="Drop-off address" {...field("dropoffAddress")} placeholder="House or building, street, city, postal code" autoComplete="off" />
              </fieldset>
              <fieldset>
                <legend>Parcel details</legend>
                <Field label="Parcel weight (kg)" type="number" step="any" min="0" {...field("weight")} />
                <p id="delivery-size-help" className="hint">Measure the outside of the packed parcel in centimetres.</p>
                <div className="delivery-dimensions">
                  {dimensions.map(([name, label]) => <Field key={name} label={`${label} (cm)`} type="number" step="any" min="0" aria-describedby="delivery-size-help" {...field(name)} />)}
                </div>
              </fieldset>
              <fieldset>
                <legend>Recipient</legend>
                <Field label="Recipient name" autoComplete="section-recipient name" {...field("recipientName")} />
                <Field label="Recipient phone" type="tel" inputMode="tel" autoComplete="section-recipient tel-national" aria-describedby="delivery-phone-help" {...field("recipientPhone")} />
                <p id="delivery-phone-help" className="hint">Use a local 10-digit number starting with 0, e.g. 0771234567.</p>
              </fieldset>
              <button type="submit" className="btn primary">Review delivery details</button>
              <p className="hint delivery-form-note">Reviewing does not place an order. Details are cleared if you leave or refresh this page.</p>
            </form>
          )}
        </section>

        <aside className="card delivery-estimate" aria-labelledby="delivery-estimate-heading">
          <h2 id="delivery-estimate-heading">Delivery fee</h2>
          <p className="delivery-unavailable">Estimate unavailable</p>
          <p className="sub">A delivery fee cannot be calculated yet. Fee estimation is not connected, so no price is available.</p>
          <hr />
          <h3>Order submission unavailable</h3>
          <p id="delivery-submit-help" className="sub">You can enter and review your details. Placing a delivery request will be available once the delivery service is connected. No order has been placed.</p>
          <button type="button" className="btn primary" disabled aria-describedby="delivery-submit-help">Place delivery request (unavailable)</button>
        </aside>
      </div>
    </div>
  );
}
