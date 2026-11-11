# Member 2: Delivery Request & Fee handover

Implemented in the team's TypeScript/role-route structure: public estimates,
customer delivery details/review, server quote/fee acceptance, price-change
reacceptance, expiry, confirmation/receipt, identical uncertain retries, owned
pre-pickup cancellation and saved-confirmation lookup. Shared delivery components
and the latest screen styling are retained; account/other-role pages remain intact.
No production identity, tariff or successful delivery is fabricated.

## Run and check

Use Node/npm and start the sibling Backend API on port 8080. Create ignored
`.env.local` from `.env.example` with `VITE_API_URL=/api`; put no database secrets
in frontend variables. Vite proxies /api to 127.0.0.1:8080.

```powershell
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run dev
```

Vitest clears the API base before module imports. Unit/component tests mock their
HTTP dependencies; two guarded local-HTTP cases run only from the backend's
isolated PostgreSQL runner (`scripts/test-delivery-postgres.ps1`) and never inherit
a live/shared target. That runner uses actual React components/client requests
for quote -> confirm -> cancel -> recover the receipt/current status, with test
identity/pricing fixtures. Browser cookie/CORS/CSRF behavior still needs live checks.

Customer routes are in src/routes/customerRoutes.tsx; public quote routing is in
src/routes/publicRoutes.tsx. Delivery screens live in pages/customer and
pages/public; the typed client is src/api/delivery.ts. Confirmation recovery uses
only owner-protected GETs, distinguishes the historical receipt from current
fulfillment state, and never creates a replacement booking from a missing result.
Retain the quote reference; automatic discovery/restoration of an unknown request
after refresh remains unfinished pending the real session contract.

## Backend/Neon status

Shared Neon was explicitly baselined at 1 and migrated through V2-V4 after a
verified backup restore/rehearsal. Existing parcel data was preserved. The normal
backend settings were verified against that database; credentials/config/backups
remain local and are not part of this repository. Read Backend's
docs/MEMBER2_HANDOVER.md for runtime settings and migration/recovery details.

While backend delivery persistence is off, configured legacy parcel creation and
legacy-only list/tracking remain compatible. Confirmed customer rows are excluded
from legacy-mode reads. Enabling persistence switches to quote-confirmation
creation and owned reads; direct legacy POST returns 410. Coordinate that cutover
with staff/public consumers. CREATED is supported in the shared status type/badge.

## Exactly what remains for a real booking

1. Member 1: real backend login/token/session validation, CUSTOMER role enforcement,
   stable customer ID, CustomerIdentityProvider and CustomerSenderProfile. Agree
   bearer/cookie and CSRF transport. With /api configured, login calls the real
   backend; a demo localStorage user/token does not authenticate a booking.
2. Member 8: approved DeliveryPricingConfigurationProvider snapshots with zones,
   coverage/weights, rates, currency, rounding and revision policy.
3. Team: approve a positive quote lifetime, set SWIFTDROP_QUOTE_VALIDITY and
   coordinate enabling SWIFTDROP_DELIVERY_PERSISTENCE_ENABLED on the intended API.
   Do not enable it or invent fees just to bypass unavailable integrations.
4. Real browser end-to-end testing with an approved customer/route: login, quote,
   review/accept, confirm, retrieve receipt/current status, and cancel before pickup;
   also check ownership, repricing, expiry and uncertain retries.
5. Verify broker/outbox consumers before enabling publishing; a saved booking
   does not establish notification/dispatch delivery. Cancellation financial/event/
   audit policy and cross-refresh retry storage still require team agreement.

See [API integration](delivery-integration.md) and
[confirmation recovery](confirmation-recovery.md). Historical proposal documents
are retained; this handover describes the implemented contract.
