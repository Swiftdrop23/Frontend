import Placeholder from "../components/Placeholder";
import ChangePassword from "../pages/account/ChangePassword";
import Orders from "../pages/merchant/Orders";
import OrderDetail from "../pages/merchant/OrderDetail";
import ApiKeys from "../pages/merchant/ApiKeys";
import type { PageRoute } from "./pageRoute";

// Merchant pages. "profile" is the Business Profile page (replace its Placeholder with the real page).
export const merchantRoutes: PageRoute[] = [
  { path: "orders", element: <Orders /> },
  { path: "orders/:id", element: <OrderDetail /> },
  { path: "api-keys", element: <ApiKeys /> },
  { path: "webhooks", element: <Placeholder /> },
  { path: "notifications", element: <Placeholder /> },
  { path: "profile", element: <Placeholder /> },
  { path: "profile/change-password", element: <ChangePassword /> },
];