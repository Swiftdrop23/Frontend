# SwiftDrop — Frontend

React single-page app for **SwiftDrop, a Parcel Delivery & Courier Management System** (Enterprise Application Development group assignment, 10 members).

- Frontend repository: <https://github.com/Swiftdrop23/Frontend>
- Backend repository: <https://github.com/Swiftdrop23/Backend>

| | |
|---|---|
| Language | TypeScript only (`.ts` / `.tsx`, no `.js` / `.jsx`) |
| Framework | React 19 + React Router |
| Build | Vite 8 |
| Tests | Vitest + Testing Library |
| Maps | Leaflet (OpenStreetMap) |
| CI | GitHub Actions — `npm run build` and the full test suite on every push and pull request |

## Portals

One app, five sidebars. The role in the signed-in user's token decides which one is shown.

| Portal | Pages |
|---|---|
| Customer | Create Delivery, Live Tracking, Delivery History, Cancel Delivery, Profile |
| Courier | My Deliveries, Pickups & Drops, Profile (with vehicle) |
| Dispatcher | Unassigned Parcels, Courier Workloads, Profile |
| Merchant | Orders, API Keys, Webhooks, Profile |
| Admin | Zones & Pricing, Reports, Users, Merchant Approvals, Failed Webhooks, Profile |

Public pages, no login needed: `/login`, `/register`, `/track/:trackingNumber`, `/quote` and `/demo-shop`.

Every portal has a notifications bell in the top bar and the SwiftDrop AI assistant in the corner.

## Prerequisites

- Node.js 20 or newer
- The backend running on <http://localhost:8080> (see the backend README)

## Configuration

Create `.env.local` in the project root (git-ignored):

```ini
VITE_API_URL=/api
VITE_COURIER_API_URL=/api/v1/courier/deliveries

# Demo Mart shop: a SwiftDrop merchant API key (SwiftDrop -> API Keys -> Create new key)
VITE_DEMO_SHOP_CLIENT_ID=<client id>
VITE_DEMO_SHOP_CLIENT_SECRET=<client secret>
```

Without `VITE_API_URL` the app runs on mock data, which is how the unit tests run. Restart the dev server after changing `.env.local`.

**Never commit `.env.local` or any API key.**

## Run

```powershell
npm install
npm run dev
```

Open <http://localhost:5173>. Keep this port: the backend only accepts browser requests from it.

## Build and test

```powershell
npm run build                 # TypeScript check + production build
npx vitest run --maxWorkers=2 # unit tests (rename .env.local away first, so mock mode is used)
```

## Demo accounts

Password for all of them: `SwiftDrop@2026`

| Role | Email |
|---|---|
| Customer | `customer@swiftdrop.test` |
| Courier | `courier@swiftdrop.test` |
| Dispatcher | `dispatcher@swiftdrop.test` |
| Admin | `admin@swiftdrop.test` |
| Merchant ("Demo Mart") | `merchant@swiftdrop.test` |

## Demo Mart — the merchant integration demo

`/demo-shop` is a pretend online shop. It is **not** part of SwiftDrop; it stands in for a real shop's own website and talks to SwiftDrop only through the merchant API key in `.env.local`.

1. A shopper buys an item and gives their name, email, mobile number and address.
2. The shop creates the order through the SwiftDrop merchant API. It appears in the merchant's **Orders** as a new order.
3. The merchant packs it and presses **Book delivery**. A parcel is created in the shop's name and the dispatcher is notified.
4. The dispatcher assigns a courier; the courier picks it up and delivers it.
5. The shopper gets an email at every step, with the full delivery progress and a tracking link.

## Project layout

```
src/
  api/          one file per backend area (http.ts has the shared request helper)
  components/   shared UI: Button, Card, Table, Modal, StatusBadge, Field, maps
  config/       navigation (the sidebar of each role)
  pages/        one folder per role, plus auth/, account/, public/, notifications/
  routes/       one route file per role
  styles/       polish.css, the app-wide visual layer
```

Shared rules for the team:

- TypeScript only. No `.js` or `.jsx` files.
- Use the shared components in `src/components/ui` instead of new one-off styles.
- Only edit your own role's folder, route file and api file.
- Every page must work on mock data, so it can be demonstrated without the backend.

## Git workflow

- Work on a feature branch created from **`integration`**, then open a pull request into **`integration`**.
- CI must be green before merging.
- `main` is the final, submitted version and is updated from `integration` by the team lead.
- Merge pull requests with **Create a merge commit**, so every member's commits stay in the history.

## Team

| Member | Name | Area |
|---|---|---|
| 1 | Ranadheera D.O. | Auth, users and security |
| 2 | Methmini S.W.P. | Delivery requests, quotes and confirmation |
| 3 | Piyasooriya S.P.T. | Tracking, status history and receipts |
| 4 | Abeywardhana L.K.I.N. | Merchant registration and approval |
| 5 | Herath H.M.I.U. | Merchant dashboard, orders and API keys |
| 6 | Wickramasinghe W.A.S.W. | Admin zones, pricing and reports |
| 7 | Shanali A.L.A.A. | Courier deliveries and proof of delivery |
| 8 | Jagoda G.C.G. | Dispatcher assignment and workloads |
| 9 | Naranpanawa H.M.R.R. | Notifications, webhooks and events |
| 10 | Dilshari P.D.M. | Platform, DevOps, UI system, integration and the AI assistant |

## Use of AI tools

AI assistants were used during development for code review, boilerplate, test scaffolding and documentation. Every suggestion was read, adapted and tested by the team before being committed, and all design decisions, page structure and business rules are the team's own.
