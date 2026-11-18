import Placeholder from "../components/Placeholder";
import Notifications from "../pages/notifications/Notifications";
import NotificationSettings from "../pages/notifications/NotificationSettings";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";

// Customer pages. Put your page components in src/pages/customer/ and replace the matching <Placeholder />.
// Extra pages that are not in the sidebar (e.g. "orders/:id") can be added to this list too.
export const customerRoutes: PageRoute[] = [
  { path: "create-delivery", element: <Placeholder /> },
  { path: "live-tracking", element: <Placeholder /> },
  { path: "delivery-history", element: <Placeholder /> },
  { path: "notifications", element: <Notifications /> },
  { path: "notifications/settings", element: <NotificationSettings /> },
  ...accountRoutes("CUSTOMER"),
];
