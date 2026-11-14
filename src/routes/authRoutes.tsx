import RoleSelect from "../pages/auth/RoleSelect";
import RoleLogin from "../pages/auth/RoleLogin";
import type { PageRoute } from "./pageRoute";

// Absolute paths (like publicRoutes.tsx). The admin sign-in is intentionally not linked from the main login page.
export const authRoutes: PageRoute[] = [
  { path: "/login", element: <RoleSelect /> },
  { path: "/login/:roleSlug", element: <RoleLogin /> },
  { path: "/admin-login", element: <RoleLogin admin /> },
];
