import Placeholder from "../components/Placeholder";
import CourierApp from "../features/courier/CourierApp";
import CourierRouteMap from "../pages/courier/CourierRouteMap";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";

// Courier pages. Put your page components in src/pages/courier/ and replace the matching <Placeholder />.
// Extra pages that are not in the sidebar (e.g. "orders/:id") can be added to this list too.
export const courierRoutes: PageRoute[] = [
  { path: "deliveries", element: <CourierApp embedded /> },
  { path: "route-map", element: <CourierRouteMap /> },
  { path: "notifications", element: <Placeholder /> },
  ...accountRoutes("COURIER"),
];
