# Member 7 — Courier workspace

The courier implementation lives in this directory (TypeScript only). It is registered
in `src/routes/courierRoutes.tsx` for the COURIER `deliveries` route, rendered as
`<CourierApp embedded />` inside the shared dashboard shell.

## Try it

From `Frontend` run `npm run dev`, log in as a courier (mock login: `courier@test.com`),
and open **My Deliveries** (`/courier/deliveries`).

A standalone preview is also available at
http://localhost:5173/src/features/courier/preview.html

## Demo mode vs API mode

Without `VITE_COURIER_API_URL`, demo mode is used: sample deliveries, details, maps
links, sequential status updates, delivery proof selection, failure reasons and a reset
button. Demo changes are stored under `swiftdrop.courier.demo.v1` in this browser.
Photos are previewed only; their bytes are never persisted. Dates and times use
Asia/Colombo. Demo mode does not authenticate a user and does not call the database.

To connect to the backend, copy `courier.env.example` into an ignored `Frontend/.env.local`:

```
VITE_COURIER_API_URL=http://localhost:8080/api/v1/courier/deliveries
VITE_COURIER_LOCAL_ACCESS=true
```

No fallback to mock data occurs when the real API fails. The client sends the
localStorage `token` as Bearer authorization; the shared `dev-token` is not real
authentication until Member 1's login is integrated.

## Checks

Run from `Frontend` (the main build and test run cover the courier module):

```
npm run build
npm test
```

## Status policy

PENDING → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED / FAILED.
Final statuses cannot change. Failed requires one of the known reasons; Other also
requires a note. Delivered requires a recipient name OR a photo. These rules are
enforced on both client (`statusRules.ts`) and server. Retrying failed deliveries
requires a future dispatcher policy; couriers cannot reopen them themselves.

See `Backend/courier/README.md` for SQL, API contracts and security notes.
