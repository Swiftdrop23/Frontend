# Member 7 — Courier workspace

The courier implementation lives in this directory. App.jsx registers it only
for the existing COURIER deliveries route. Shared login, navigation, package.json
and other members' page implementations are unchanged.

## Preview now

From `Frontend` run `npm run dev`, then open:

http://localhost:5173/src/features/courier/preview.html

This workstation now uses the live Neon API through the ignored Frontend/.env.local.
Start the backend with `courier/run-local.ps1 -LocalDevelopmentAccess` and use
the localhost URL above. The live list is empty until Member 6 supplies actual
assignments for member7-local. No demo rows were inserted into the database.
The page labels the fixed local development identity; team JWT login remains
pending. Real uploads and status changes use the database API.

Without VITE_COURIER_API_URL, demo mode is used. It includes sample deliveries,
details, maps links, sequential updates, delivery proof selection, failure
reasons, and a reset button. Demo changes are stored under
`swiftdrop.courier.demo.v1` in this browser. Photos are previewed only; their
bytes are never persisted. Dates and times use Asia/Colombo. Demo mode does not
authenticate a user and does not call the group database.

## Checks

Run from `Frontend`:

```powershell
node src/features/courier/statusRules.test.js
npm exec vite build -- --config src/features/courier/vite.config.js
```

The separate build goes to `dist/courier`; it does not replace the main app build.

## Connect after the team integration is ready

Set `VITE_COURIER_API_URL=http://localhost:8080/api/v1/courier/deliveries` in an
ignored `.env.local` and restart Vite. No fallback to mock data occurs when a
real API fails. The client sends the existing localStorage `token` as Bearer
authorization. The current shared `dev-token` is not real authentication.

The shared courier route now renders `<CourierApp embedded />` inside the
existing dashboard shell. After courier demo login, select My Deliveries or
open http://localhost:5173/courier/deliveries. Embedded mode hides the standalone
sidebar/header and keeps active/completed tabs within My Deliveries.
Notifications and Profile remain their owners' placeholders. The separate
preview entry still works independently.

## Agreed module policy (proposed for team review)

PENDING → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED / FAILED.
Final statuses cannot change. Failed requires one of the known reasons; Other
also requires a note. Delivered requires recipient name OR a photo. These
policies are enforced on both client and server. Retrying failed deliveries
requires a future dispatcher policy; couriers cannot reopen them themselves.

See `Backend/courier/README.md` for SQL, API contracts, security and integration
dependencies. Tracking, shared parcel status synchronization and durable broker
publication are not wired until their owning members integrate the module.
