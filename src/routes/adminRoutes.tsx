import Placeholder from "../components/Placeholder";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";

// Admin pages. Put your page components in src/pages/admin/ and replace the matching <Placeholder />.
// Extra pages that are not in the sidebar (e.g. "orders/:id") can be added to this list too.
export const adminRoutes: PageRoute[] = [
  { path: "unassigned-parcels", element: <Placeholder /> },
  { path: "courier-workloads", element: <Placeholder /> },
  { path: "users", element: <Placeholder /> },
  { path: "merchant-approvals", element: <Placeholder /> },
  { path: "zones-pricing", element: <Placeholder /> },
  { path: "reports", element: <Placeholder /> },
  { path: "notifications", element: <Placeholder /> },
  ...accountRoutes("ADMIN"),
];
