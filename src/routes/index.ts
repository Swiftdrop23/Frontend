import type { Role } from "../types";
import type { PageRoute } from "./pageRoute";
import { adminRoutes } from "./adminRoutes";
import { courierRoutes } from "./courierRoutes";
import { customerRoutes } from "./customerRoutes";
import { dispatcherRoutes } from "./dispatcherRoutes";
import { merchantRoutes } from "./merchantRoutes";

export type { PageRoute } from "./pageRoute";

export const ROUTES: Record<Role, PageRoute[]> = {
  CUSTOMER: customerRoutes,
  MERCHANT: merchantRoutes,
  COURIER: courierRoutes,
  DISPATCHER: dispatcherRoutes,
  ADMIN: adminRoutes,
};
