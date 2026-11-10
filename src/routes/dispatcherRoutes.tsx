import Placeholder from "../components/Placeholder";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";

// Dispatcher pages. Put your page components in src/pages/dispatcher/ and replace the matching <Placeholder />.
// Extra pages that are not in the sidebar (e.g. "orders/:id") can be added to this list too.
export const dispatcherRoutes: PageRoute[] = [
  { path: "unassigned-parcels", element: <Placeholder /> },
  { path: "courier-workloads", element: <Placeholder /> },
  { path: "notifications", element: <Placeholder /> },
  ...accountRoutes("DISPATCHER"),
];
