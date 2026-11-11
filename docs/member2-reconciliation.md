# Member 2 frontend reconciliation

Current update: local API configuration and owner-protected confirmation lookup are now implemented and tested. See [confirmation recovery](confirmation-recovery.md); its current behavior supersedes older recovery/configuration limitations below.

The feature working tree incorporates team main b03b2c4's TypeScript structure,
account pages, role route modules and shared UI components while preserving the
delivery feature. This was a source reconciliation on the feature branch; no
main branch merge or push was performed.

Delivery screens now live in pages/customer/CreateDelivery.tsx,
pages/customer/CancelDelivery.tsx and pages/public/GetQuote.tsx. The delivery API
client is api/delivery.ts with explicit request/response types and runtime
validation of untrusted response bodies; shared delivery DTO types are in
types/delivery.ts. Decimal strings, explicit fee acceptance, price-change
reacceptance, expiry, owner-scoped cancellation, stale-response protection and
identical retries on uncertain outcomes are retained. No mock fee or customer
creation was added.

Customer routes belong to routes/customerRoutes.tsx. Public routes are listed in
routes/publicRoutes.tsx; App.tsx only renders that route list alongside the team's
existing auth and role route loops. The existing cancellation sidebar entry and
public quote link on the login screen were retained. Other role routes, account
screens, saved-address behavior and the merchant business-profile placeholder
remain as provided by the team.

Shared Field.tsx carries forward error IDs, aria-invalid, existing descriptions
and error descriptions, so keyboard focus on invalid delivery fields still works.
Delivery actions use the team's Button and Card components. Card accepts standard
root HTML attributes plus an optional section/aside root while retaining existing
title/actions/narrow behavior. CREATED is included in ParcelStatus and the shared
status badge with its own styling.

The configured createParcel helper retains server-backed legacy creation while
Member 2 persistence is disabled, and never fabricates a saved parcel. Legacy-mode
list/tracking return legacy rows only, excluding confirmed customers. Enabling
Member 2 persistence disables direct legacy creation and makes those reads
customer-owned; coordinate that separate API cutover. Member 2 customer creation
always uses issued-quote confirmation.

Use npm test, npm run lint, npm run typecheck and npm run build. The backend's
isolated PostgreSQL runner still targets pages/Delivery.local-http.test.jsx,
whose imports now load the migrated TypeScript screens/client. Test files remain
JavaScript; the team's strict TypeScript settings apply to production TS/TSX.

Real Member 1 authentication/profile adapters, Member 8 pricing and quote lifetime,
approved shared migrations and live broker/browser auth checks remain necessary.
No frontend VITE variable may contain database credentials. No shared Neon change
was made as part of this reconciliation. See Backend/docs/neon-migration-review.md
for database/API impact and the pending rollout decisions.

Legacy compatibility update: with delivery persistence disabled, the backend retains legacy PENDING creation and reads for legacy parcels only. Configured createParcel calls the server and honors its refusal when quote confirmation is enabled; it never simulates creation. Confirmed customer rows stay excluded from legacy-mode reads. The V4 cancellation guard is scoped to confirmed Member 2 parcels.

Shared Neon baseline 1 and V2-V4 are now deployed after verified backup/restore rehearsal. V4 protects confirmed parcels only. Current validation: 95 frontend tests, clean lint/typecheck/build, 230 backend tests, and read-only live Neon backend smoke checks. Actual customer booking still requires real auth/profile/pricing adapters and an approved quote lifetime. See Backend/docs/neon-deployment-report.md.
