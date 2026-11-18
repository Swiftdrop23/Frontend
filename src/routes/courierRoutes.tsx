import Placeholder from "../components/Placeholder";
import CourierApp from "../features/courier/CourierApp";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";

// Courier pages. Put your page components in src/pages/courier/ and replace the matching <Placeholder />.
// Extra pages that are not in the sidebar (e.g. "orders/:id") can be added to this list too.
export const courierRoutes: PageRoute[] = [
  // Member 7's courier workspace (src/features/courier), moved here from the old App.jsx during the dev merge.
  { path: "deliveries", element: <CourierApp embedded /> },
  { path: "notifications", element: <Placeholder /> },
  ...accountRoutes("COURIER"),
];
