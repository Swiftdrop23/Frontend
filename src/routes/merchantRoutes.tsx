import Placeholder from "../components/Placeholder";
import Webhooks from "../pages/notifications/Webhooks";
import WebhookDelivery from "../pages/notifications/WebhookDelivery";
import ChangePassword from "../pages/account/ChangePassword";
import type { PageRoute } from "./pageRoute";

// Merchant pages. Put your page components in src/pages/merchant/ and replace the matching <Placeholder />.
// "profile" is the Business Profile page (replace its Placeholder with the real page).
export const merchantRoutes: PageRoute[] = [
  { path: "orders", element: <Placeholder /> },
  { path: "api-keys", element: <Placeholder /> },
  { path: "webhooks", element: <Webhooks /> },
  { path: "webhooks/:deliveryId", element: <WebhookDelivery /> },
  { path: "notifications", element: <Placeholder /> },
  { path: "profile", element: <Placeholder /> },
  { path: "profile/change-password", element: <ChangePassword /> },
];
