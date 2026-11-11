import CreateDelivery from "../pages/customer/CreateDelivery";
import CancelDelivery from "../pages/customer/CancelDelivery";
import RecoverDelivery from "../pages/customer/RecoverDelivery";
import LiveTracking from "../pages/customer/LiveTracking";
import DeliveryHistory from "../pages/customer/DeliveryHistory";
import DeliveryDetails from "../pages/customer/DeliveryDetails";
import DeliveryReceipt from "../pages/customer/DeliveryReceipt";
import Placeholder from "../components/Placeholder";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";

// Customer pages. Put your page components in src/pages/customer/ and replace the matching <Placeholder />.
// Extra pages that are not in the sidebar (e.g. "orders/:id") can be added to this list too.
export const customerRoutes: PageRoute[] = [
  { path: "create-delivery", element: <CreateDelivery /> },
  { path: "cancel-delivery", element: <CancelDelivery /> },
  { path: "recover-delivery", element: <RecoverDelivery /> },
  { path: "live-tracking", element: <LiveTracking /> },
  { path: "delivery-history", element: <DeliveryHistory /> },
  { path: "delivery-history/:trackingNumber", element: <DeliveryDetails /> },
  { path: "delivery-history/:trackingNumber/receipt", element: <DeliveryReceipt /> },
  { path: "notifications", element: <Placeholder /> },
  ...accountRoutes("CUSTOMER"),
];
