# Saved confirmation lookup and local API configuration

The local ignored .env.local now sets VITE_API_URL=/api. Vite forwards /api to
the backend on 127.0.0.1:8080. No database URL or credential belongs in frontend
variables. Both servers must run for interactive development. The backend's
current local.properties was verified separately against migrated Neon with a
read-only credential/permission probe; it was not overwritten.

The current team branches still do not provide real customer auth/profile or
approved pricing adapters. With the HTTP API configured, login calls the real
backend instead of producing the team's demo session. A database role or demo
token cannot authenticate a customer booking.

/customer/recover-delivery is available through the create-delivery screen.
Keep the quote reference shown during review. An uncertain confirmation links
to lookup in a new tab so the original frozen retry stays intact. The lookup
requires an explicit action, uses only the owner-protected GET receipt/status
endpoints, and never creates or retries a delivery. It stores no recipient
command or recovery record in localStorage/sessionStorage.

The stored receipt records the original creation/accepted fee; current delivery
status is fetched separately. A cancelled delivery is displayed as Cancelled,
not as the historical CREATED receipt state. If the current lookup fails, it
is labeled Not verified. Cancellation options appear only after verifying a
pre-pickup state. A missing/foreign receipt does not prove a prior submission
failed and never triggers a replacement booking. Edited/unmounted lookups discard
late responses. Automatic discovery of a lost quote or restoration of recipient
commands across refresh remains unfinished pending the real session contract.

Validation: 113 frontend tests, lint, strict TypeScript checking and production
build pass. The backend passes 230 tests; its existing real React HTTP case now
creates/cancels a local fixture delivery and recovers its original receipt with
the current cancelled state. New tables/data were not written in shared Neon.
Vitest overrides the API base before imports so tests do not capture .env.local.

For a real booking, Member 1 must supply real login/session validation plus
CustomerIdentityProvider and CustomerSenderProfile. Member 8 must supply approved
DeliveryPricingConfigurationProvider snapshots. The team must approve a positive
quote lifetime and coordinate enabling delivery persistence (the legacy API
cutover). See Backend/docs/member2-booking-readiness.md for the exact steps.
