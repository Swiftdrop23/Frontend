# Customer Delivery Request & Fee — proposed API contract

**Status: draft for team agreement; no backend implementation verified.**
All endpoint paths, schemas, HTTP/error codes, and rules below are proposals.
Examples containing `<...>` are templates, not executable payloads. No rates,
fees, currency, tracking format, quote lifetime, or service limits are confirmed.

## Existing frontend and design inputs

The current `/customer/create-delivery` page collects addresses, weight,
dimensions, and recipient details, then supports review and editing. Fees and
submission explicitly remain unavailable. The Vitest suite covers
validation, keyboard review, retained edits, and these unavailable states.
This draft does not authorize changing that implementation or its tests.

The supplied team report specifies Java 17/Spring Boot, PostgreSQL, zone/weight
pricing strategies, and creation of a parcel with a unique tracking number and
initial `CREATED` status after confirmation. A transactional outbox is proposed
in that report; authentication, pricing/zones, and events have separate owners.
These are design inputs, not evidence of deployed capabilities.

## 1. Proposed endpoints and examples

Both endpoints would accept JSON and require an authenticated customer.
Authentication transport and the API base path remain to be agreed.

### Proposed `POST /api/v1/customer/delivery-quotes`

Validate the request, resolve the delivery zone on the server, and calculate a
fee using the applicable zone/weight strategy. A quote does **not** create a
parcel, allocate a tracking number, or emit a parcel-created event.

Proposed request (illustrative addresses and measurements only):

```json
{
  "pickupAddress": "12 Example Road, Colombo 07",
  "dropoffAddress": "34 Sample Road, Kandy",
  "parcel": {
    "weightKg": "0.75",
    "dimensionsCm": { "length": "25.5", "width": "15", "height": "10" }
  }
}
```

Proposed `201 Created` response template:

```json
{
  "quoteId": "<opaque server-generated quote ID>",
  "fee": { "amount": "<server-calculated decimal amount>", "currency": "<agreed currency code>" },
  "zone": { "id": "<resolved zone ID>", "name": "<display name>" },
  "pricingVersion": "<server pricing revision>",
  "expiresAt": "<UTC timestamp>"
}
```

Decimal strings are proposed for quantities and money, with server-side decimal
arithmetic. Precision, rounding, currency, taxes, and optional fee breakdown need
agreement. **No numeric price example or final rate is specified here.**

The server would retain an immutable quote snapshot: authenticated owner,
canonical addresses/parcel, resolved zone, strategy/pricing revision, fee, and
expiry. Recipient details are not needed for the proposed zone/weight quote.

### Proposed `POST /api/v1/customer/deliveries`

Require `Idempotency-Key: <client-generated random request key>`.
The server would use the quote snapshot for addresses and parcel measurements;
the client would not supply a customer ID, final fee, tracking number, or status.

Proposed request template:

```json
{
  "quoteId": "<quote accepted on the review screen>",
  "recipient": { "name": "Test Recipient", "phone": "0771234567" }
}
```

Proposed `201 Created` response template, returned only after database commit:

```json
{
  "deliveryId": "<server-generated parcel/delivery ID>",
  "quoteId": "<accepted quote ID>",
  "trackingNumber": "<unique server-generated tracking number>",
  "status": "CREATED",
  "fee": { "amount": "<confirmed decimal amount>", "currency": "<agreed currency code>" },
  "createdAt": "<UTC timestamp>"
}
```

Proposed naming treats one delivery request as one parcel. Confirm whether the
backend calls this resource a delivery or parcel and whether both IDs are needed.
Payment authorization/collection is outside this draft and is not implied by
`CREATED`. A follow-up retrieval endpoint/receipt for reload and timeout recovery
needs agreement; no such endpoint is asserted to exist.

### Proposed error envelope and cases

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Check the highlighted fields.",
  "fieldErrors": [
    { "field": "parcel.weightKg", "code": "MUST_BE_POSITIVE", "message": "Enter a weight greater than zero in kg." }
  ],
  "requestId": "<diagnostic correlation ID>"
}
```

| Proposed HTTP/code | Meaning and frontend action |
| --- | --- |
| `400 MALFORMED_REQUEST` | Invalid JSON/types or missing required idempotency header. |
| `422 VALIDATION_FAILED` | Required/invalid fields or agreed parcel limits; map field paths to controls. |
| `422 ADDRESS_ZONE_UNRESOLVED` / `OUTSIDE_SERVICE_AREA` | Request address clarification or explain unsupported coverage; never guess a zone. |
| `401 UNAUTHENTICATED` / `403 FORBIDDEN` | Reauthenticate or explain role restriction. |
| `404 QUOTE_NOT_FOUND` | Missing or inaccessible quote; do not disclose another customer's data. |
| `409 QUOTE_EXPIRED` / `QUOTE_STALE` | No parcel created; obtain and explicitly accept a fresh quote. |
| `409 IDEMPOTENCY_CONFLICT` / `QUOTE_ALREADY_USED` | Same key with changed payload, or quote already consumed; recover the owned result where permitted. |
| `503 PRICING_UNAVAILABLE` / `SERVICE_UNAVAILABLE` | Show unavailable/retry state; no fallback price or fabricated success. |
| `500 INTERNAL_ERROR` or connection timeout | Outcome may be unknown for creation; retry the same key/payload or retrieve its result. |

## 2. Form mapping and validation

| Current form field | Proposed API field | Current frontend behavior / open decision |
| --- | --- | --- |
| `pickupAddress` | quote `pickupAddress` | Nonblank after trimming; currently one free-text string. |
| `dropoffAddress` | quote `dropoffAddress` | Same; structured address, postal code, coordinates, or zone selection may be required. |
| `weight` | quote `parcel.weightKg` | Finite, strictly positive; decimals accepted. Confirm precision, limits, and billable-weight rules. |
| `length`, `width`, `height` | quote `parcel.dimensionsCm.*` | Each finite and strictly positive; decimals accepted. Proposed explicit units preserve current inputs. |
| `recipientName` | creation `recipient.name` | Nonblank after trimming. |
| `recipientPhone` | creation `recipient.phone` | Current helper strips whitespace and requires `0` plus nine digits. Propose sending whitespace-free text; confirm local format versus international normalization. |

Normalize at the eventual API boundary without changing the current form in this
draft. The backend must repeat validation, including finite positive quantities,
required text, and agreed length/precision/size limits; client validation is only
for usability. Error paths should map nested dimensions and recipient fields
back to their existing frontend names; non-field errors need a page-level notice.

**Parcel size is unresolved:** propose sending dimensions rather than inventing
small/medium/large categories. The reported strategy uses zone and weight; it does
not establish volumetric weight, size surcharges, dimension thresholds, or a size
enum. Pricing/backend owners must decide whether dimensions affect eligibility,
pricing, storage only, or need replacement by an agreed size representation.
Free-text addresses also cannot be assumed sufficient to resolve a zone.

## 3. Quote invalidation and confirmation

- Proposed frontend rule: changing pickup/drop-off address, weight, or any
  dimension clears the accepted quote/fee and disables confirmation until a new
  quote is displayed and accepted. Ignore older quote responses arriving after
  edits or a newer request. Display expiry using server timestamps.
- Recipient-only edits would retain the quote, assuming recipients do not affect
  pricing. Revalidate them before submission; change this rule if owners disagree.
- Proposed server rule: at creation, check customer ownership, expiry, unused
  quote, serviceability, and current zone/strategy/pricing revision; recompute the
  fee from the trusted snapshot. Compare amount/currency and relevant revisions.
  An expired or changed quote returns a conflict with **no parcel creation**;
  the customer must see and accept a replacement. Never silently increase a fee.
- Make rechecking and creation consistent under concurrent pricing updates, using
  an agreed transactional/versioning approach. Whether quotes instead guarantee
  a locked price until expiry is a pricing/product decision, not assumed here.

## 4. Ownership, authentication, retries, and events

- **Member 2/frontend:** collect/review details, map errors, invalidate quotes,
  retain a stable submission key across retries, and show success only from a
  verified creation response. Current local-storage mock roles/tokens are not
  server authentication; the existing auth client does not attach bearer tokens.
- **Backend/auth owners:** authenticate requests, derive customer identity from
  the principal, enforce quote/parcel ownership and customer permissions, and
  agree bearer-token versus cookie handling (including CORS/CSRF where relevant).
  Do not trust a submitted customer ID, zone, fee, or role.
- **Duplicate submissions — proposed:** disable the UI during submission and
  persist idempotency results server-side, scoped by customer and operation.
  Same key and same canonical payload returns the original creation result;
  a different payload conflicts. Enforce one parcel per quote with a database
  constraint as well, so a second key cannot create a duplicate. Concurrent
  attempts must resolve atomically. Agree in-progress response, key retention,
  and recovery after refresh/timeouts; a network error does not prove failure.
- **Backend/events owners — proposed outbox:** commit parcel (`CREATED`), unique
  tracking number, consumed quote, idempotency result, and initial status-event
  outbox row in one PostgreSQL transaction. Rollback leaves none of those writes.
  Publish after commit through an outbox worker; broker failure must not erase a
  committed parcel or cause creation retries to duplicate it.
- Assume at-least-once publication: stable event ID, parcel ID, schema version,
  timestamp, and per-parcel sequence/version; retry safely and deduplicate at
  consumers. Avoid unnecessary addresses/phone data in events or logs. Agree
  event name/schema, ordering, retries/dead-letter handling, and retention with
  the events owner. Do not publish directly from the browser or promise exactly
  once delivery. A creation receipt does not imply downstream notification or
  tracking consumers have processed the event.

## 5. Decisions needed before integration

1. **Backend + auth:** resource/path names, response/error conventions, identity
   model/transport, field limits, decimal encoding, idempotency and retrieval.
2. **Zones/pricing + backend:** address-to-zone resolution, cross-zone rules,
   strategy inputs/versioning, size representation and billable weight, currency,
   rates/taxes/rounding, expiry duration, and locked versus rechecked quotes.
3. **Events + backend:** transactional boundary, tracking uniqueness/format,
   `CREATED` event contract, outbox ownership, deduplication and recovery policy.
4. **Product/team:** local versus international phone rules, unsupported-address
   UX, payment scope, review/confirmation wording, and final customer receipt.

Until these are agreed and integrated, retain the existing unavailable fee and
submission UI. This document supplies proposals only, not an integration claim.
