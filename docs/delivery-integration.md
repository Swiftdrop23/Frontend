# Delivery UI integration

Current update: local API configuration and owner-protected confirmation lookup are now implemented and tested. See [confirmation recovery](confirmation-recovery.md); its current behavior supersedes older recovery/configuration limitations below.

Deployment update: shared Neon is migrated and verified. Legacy APIs remain available for legacy records while Member 2 persistence is disabled; the cancellation guard applies only to confirmed Member 2 parcels. This supersedes older unconditional legacy-route retirement statements below. See Backend/docs/neon-deployment-report.md.

The customer delivery screen and public estimate screen now call `src/api/delivery.ts`.
The existing API-contract drafts remain historical proposals; the backend's
`docs/delivery-integration.md` describes the current implemented contract.

Set `VITE_API_URL` to the API base path using `.env.example` as a local template.
Vite development proxies `/api` to the local backend. Never put database settings
or server credentials in frontend variables. Production hosting needs its own
API base/reverse proxy. An absent base returns unavailable, not a mock price.

- Customer quote: `POST /v1/customer/delivery-quotes`, with addresses and kg/cm
  decimal strings. Review displays the server fee and requires explicit acceptance.
- Confirmation: `POST /v1/customer/deliveries`, with quote reference and recipient
  name/phone only. There is no client customer ID, fee, tracking, or status.
- Price changes return a stored replacement quote. Acceptance is cleared and the
  customer must review and confirm again. Editing invalidates old quotes and late
  responses cannot restore them.
- Unknown confirmation outcomes freeze the original request and permit only an
  identical retry. Success requires a valid server receipt and the reviewed fee;
  it is never inferred from a click, timeout, local role, or malformed response.
- Public estimates use `POST /v1/delivery-estimates` with cities and weight only.
  They are indicative and cannot be confirmed as delivery bookings.

The client forwards an existing bearer token when present and includes cookie
credentials; Member 1 must supply real server authentication/role checks and agree
transport/CSRF policy. The existing demo login module is not server authentication.
Until Member 1 and Member 8 supply their real adapters, the backend deliberately
returns unavailable. No production mappings, fees, currencies or mock identities
were added by this integration.

`npm test` isolates API settings and mocks responses. Existing validation,
keyboard navigation and role-route tests are retained. New tests cover the API
payload/decimal contract and connected quote/confirmation flows. `npm run build`
builds local static assets; no publishing or hosting changes are performed.

Cancellation is available at `/customer/cancel-delivery` from the customer menu
and the delivery-success screen. `GET /v1/customer/deliveries/track/{trackingNumber}` displays the current
status before explicit confirmation. `POST /v1/customer/deliveries/cancel` sends
only `{trackingNumber}`; the server authenticates ownership and rechecks pickup
state atomically. CREATED/PENDING are provisionally cancellable; CANCELLED is
terminal and repeat requests return the same status. Late lookup results are
discarded. Uncertain cancellation responses freeze the reference and permit only
an identical retry; that retry state does not survive refresh. Missing auth/API
configuration remains unavailable. No local session proves ownership.

The new customer lookup returns only tracking number and current status. Member 2
does not call the shared `/api/parcels` routes, so parcel owners can agree their
staff/public contracts separately. Existing parcel creation/list/tracking changes
are still breaking changes requiring coordination; they were not restored to
unauthenticated access. Creation receipts describe the original creation state;
the owned status lookup shows current state, including CANCELLED.

Cancellation preserves accepted fees/history and makes no refund/waiver promise.
There is no agreed cancellation notification event yet; the existing creation
event remains a record of creation. See backend `docs/delivery-cancellation.md`
for migration and status-writer coordination before rollout.

Recipient normalization currently trims outer whitespace only. The UI keeps its
existing local-phone validation; final phone policy still needs agreement.
Cross-refresh recovery of an uncertain request is not implemented: keep the page
open for an identical retry. The backend also provides an owned receipt endpoint,
which a future authenticated recovery screen can use. Real browser/server and
real authentication/broker integration remain unverified; tests use fixtures.

The backend's opt-in isolated PostgreSQL suite now launches a loopback-only Spring
test HTTP server and runs `Delivery.local-http.test.jsx` against it. This exercises
the real React DOM components and delivery API client without request mocks:
quote/review/confirmation, a persisted receipt, current-state lookup and
cancellation, plus explicit refusal when authentication/pricing are unavailable.
The backend independently verifies the resulting parcel/confirmation/outbox rows.
All identities, sender profiles and prices for the successful case remain test
fixtures; they are not enabled in production and do not prove real authentication.

These HTTP cases require `SWIFTDROP_LOCAL_HTTP_TEST=true`, a numeric loopback port
and a named scenario supplied by the backend test runner. Ordinary `npm test`
skips them and cannot inherit a shared API target. Node/npm and sibling frontend
dependencies are required when running the expanded backend database suite.
Real-browser CORS/cookie/CSRF behavior still needs Member 1's real transport policy.

The delivery screens and API client have now been reconciled with the team TypeScript structure. See [reconciliation notes](member2-reconciliation.md).

Legacy compatibility update: with delivery persistence disabled, the backend retains legacy PENDING creation and reads for legacy parcels only. Configured createParcel calls the server and honors its refusal when quote confirmation is enabled; it never simulates creation. Confirmed customer rows stay excluded from legacy-mode reads. The V4 cancellation guard is scoped to confirmed Member 2 parcels.
