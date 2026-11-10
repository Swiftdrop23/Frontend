# SwiftDrop Frontend: Team Guide

## Folder structure

```
src/
  api/          one file per backend module (auth.ts, users.ts, parcels.ts ...)
  components/   shared components (DashboardLayout, Field, Placeholder)
    ui/         shared UI kit: Button, Card, Table, StatusBadge, Modal, EmptyState
  config/       navigation.ts = sidebar items per role
  pages/
    auth/       login, register, forgot/reset password
    account/    profile, change password (shared by all roles)
    customer/   Customer pages
    merchant/   Merchant pages
    courier/    Courier pages
    dispatcher/ Dispatcher pages
    admin/      Admin pages
    examples/   reference pages (not routed)
  routes/       one routes file per role (customerRoutes.tsx ...)
  types.ts      shared types (Role, Parcel, ...)
```

## Page ownership (fill in your names, then pin this)

| Role | Page | Owner | Status |
|---|---|---|---|
| Customer | Create Delivery | | |
| Customer | Live Tracking | | |
| Customer | Delivery History | | |
| Merchant | Orders | | |
| Merchant | API Keys | | |
| Merchant | Webhooks | | |
| Merchant | Business Profile | | |
| Courier | My Deliveries | | |
| Dispatcher | Unassigned Parcels | | |
| Dispatcher | Courier Workloads | | |
| Admin | Users | | |
| Admin | Merchant Approvals | | |
| Admin | Zones & Pricing | | |
| Admin | Reports | | |
| All | Notifications | | |

## How to add your page (4 steps)

1. Create your component in your role's folder, e.g. `src/pages/customer/CreateDelivery.tsx` (start from `src/pages/examples/ParcelListExample.tsx`).
2. Open your role's routes file, e.g. `src/routes/customerRoutes.tsx`.
3. Import your component and replace the matching `<Placeholder />`:
   ```tsx
   import CreateDelivery from "../pages/customer/CreateDelivery";
   { path: "create-delivery", element: <CreateDelivery /> },
   ```
4. Run `npm run dev` and open the page from the sidebar.

Do **not** edit `App.tsx`. A page that is not in the sidebar (for example `orders/:id`) can be added to your routes file too.
New sidebar items go in `src/config/navigation.ts`. Tell the team leader before changing it.

## Use the shared UI kit

```tsx
import { Button, Card, Table, StatusBadge, Modal, EmptyState } from "../../components/ui";
```
Form inputs use `Field` from `src/components/Field.tsx`. Do not write your own buttons, tables or modals.

## API pattern (mock first, backend later)

Every file in `src/api/` works in two modes (see `parcels.ts`):
- `VITE_API_URL` not set: returns mock data, so you can build the UI before the backend exists.
- `VITE_API_URL=http://localhost:8080/api` (put it in `.env.local`, never commit it): calls the Spring Boot backend.

Add your types to `src/types.ts` (match the backend entity field names).

## Git rules

1. Never push to `main` directly. One branch per feature: `feature/<role>-<page>`, e.g. `feature/customer-create-delivery`.
2. Before you start, and every day: `git switch main`, `git pull`, then `git switch <your-branch>` and `git merge main`.
3. Commit small and often. Message format: `customer: add create delivery form`.
4. Open a Pull Request into `main`. Someone else reviews it before it is merged.
5. Run `npm run build` before opening the PR. It must pass.
6. Never commit `.env.local`, `node_modules` or passwords.
