import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import Field from "../../components/Field";
import { Button, Card, StatusBadge } from "../../components/ui";
import { deliveryError, lookupDeliveryReceipt, lookupDeliveryForCancellation } from "../../api/delivery";
import type { DeliveryReceipt, DeliveryState } from "../../types/delivery";

/** Owner-protected receipt lookup only: no stored recipient details and no POST/rebooking. */
export default function RecoverDelivery() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(() => params.get("quote") || "");
  const [receipt, setReceipt] = useState<DeliveryReceipt | null>(null);
  const [current, setCurrent] = useState<DeliveryState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => () => { generation.current += 1; abort.current?.abort(); }, []);
  useEffect(() => { if (receipt) heading.current?.focus(); }, [receipt]);

  function edit(value: string) {
    generation.current += 1; abort.current?.abort();
    setReference(value); setReceipt(null); setCurrent(null); setMessage(""); setBusy(false);
  }

  async function lookup(event: FormEvent) {
    event.preventDefault();
    const quoteId = reference.trim();
    if (!quoteId) { setMessage("Enter your quote reference."); return; }
    const version = ++generation.current;
    abort.current?.abort(); abort.current = new AbortController();
    const signal = abort.current.signal;
    setReceipt(null); setCurrent(null); setMessage(""); setBusy(true);
    try {
      const found = await lookupDeliveryReceipt(quoteId, signal);
      if (version !== generation.current) return;
      setReceipt(found);
      try {
        const state = await lookupDeliveryForCancellation(found.trackingNumber, signal);
        if (version === generation.current) setCurrent(state);
      } catch (caught) {
        const error = deliveryError(caught);
        if (version === generation.current && error.name !== "AbortError") {
          setMessage("Your saved confirmation was found, but the current delivery status could not be checked. Check again before taking further action.");
        }
      }
    } catch (caught) {
      const error = deliveryError(caught);
      if (version === generation.current && error.name !== "AbortError") {
        setMessage(error.status === 404
          ? "No saved confirmation was found for this quote in your account. This does not prove an earlier submission failed. Check again, or keep the original page open and retry its identical confirmation."
          : error.message);
      }
    } finally { if (version === generation.current) setBusy(false); }
  }

  return <Card aria-labelledby="recovery-heading">
    <h2 id="recovery-heading">Check a previous confirmation</h2>
    <p>Use the quote reference from your review screen and the same customer account. This checks a saved confirmation; it never places or retries a delivery.</p>
    <form onSubmit={lookup} noValidate>
      <Field label="Quote reference" name="quoteId" value={reference} autoComplete="off"
        onChange={event => edit(event.target.value)} />
      <Button type="submit" variant="primary" disabled={busy}>{busy ? "Checking confirmation..." : "Find saved confirmation"}</Button>
    </form>
    {message && <p role="status" className="notice">{message}</p>}
    {receipt && <section aria-labelledby="saved-confirmation-heading">
      <h3 id="saved-confirmation-heading" ref={heading} tabIndex={-1}>Saved delivery confirmation</h3>
      <dl>
        <dt>Quote reference</dt><dd>{receipt.quoteId}</dd>
        <dt>Tracking number</dt><dd>{receipt.trackingNumber}</dd>
        <dt>Accepted fee</dt><dd>{receipt.fee.currency} {receipt.fee.amount}</dd>
        <dt>Confirmed at</dt><dd>{new Date(receipt.createdAt).toLocaleString()}</dd>
        <dt>Current delivery status</dt><dd>{current ? <StatusBadge status={current.status} /> : "Not verified"}</dd>
      </dl>
      <p>The original receipt records creation. The current status is checked separately and may have changed since confirmation.</p>
      {current && ["CREATED", "PENDING"].includes(current.status) && <a
        href={`/customer/cancel-delivery?tracking=${encodeURIComponent(receipt.trackingNumber)}`}>View cancellation options</a>}
    </section>}
  </Card>;
}
