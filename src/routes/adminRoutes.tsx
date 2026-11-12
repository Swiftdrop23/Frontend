import Placeholder from "../components/Placeholder";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";
import ZonesPricing from "../pages/admin/ZonesPricing";
import ZoneForm from "../pages/admin/ZoneForm";
import PricingRuleForm from "../pages/admin/PricingRuleForm";
import Reports from "../pages/admin/Reports";
import DeliveryReport from "../pages/admin/DeliveryReport";

// Admin pages. Put your page components in src/pages/admin/ and replace the matching <Placeholder />.
// Extra pages that are not in the sidebar (e.g. "orders/:id") can be added to this list too.
export const adminRoutes: PageRoute[] = [
  { path: "unassigned-parcels", element: <Placeholder /> },
  { path: "courier-workloads", element: <Placeholder /> },
  { path: "users", element: <Placeholder /> },
  { path: "merchant-approvals", element: <Placeholder /> },
  { path: "zones-pricing", element: <ZonesPricing /> },
  { path: "zones-pricing/add-zone", element: <ZoneForm /> },
  { path: "zones-pricing/add-rule/:zoneId?", element: <PricingRuleForm /> },
  { path: "zones-pricing/edit-rule/:ruleId", element: <PricingRuleForm /> },
  { path: "reports", element: <Reports /> },
  { path: "reports/delivery-report", element: <DeliveryReport /> },
  { path: "notifications", element: <Placeholder /> },
  ...accountRoutes("ADMIN"),
];
