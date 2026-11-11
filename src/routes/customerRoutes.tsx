import CreateDelivery from "../pages/customer/CreateDelivery";
import CancelDelivery from "../pages/customer/CancelDelivery";
import RecoverDelivery from "../pages/customer/RecoverDelivery";
import Placeholder from "../components/Placeholder";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";

// Customer pages. Put your page components in src/pages/customer/ and replace the matching <Placeholder />.
// Extra pages that are not in the sidebar (e.g. "orders/:id") can be added to this list too.
export const customerRoutes: PageRoute[] = [
  { path: "create-delivery", element: <CreateDelivery /> },
  { path: "cancel-delivery", element: <CancelDelivery /> },
  { path: "recover-delivery", element: <RecoverDelivery /> },
  { path: "live-tracking", element: <Placeholder /> },
  { path: "delivery-history", element: <Placeholder /> },
  { path: "notifications", element: <Placeholder /> },
  ...accountRoutes("CUSTOMER"),
];
