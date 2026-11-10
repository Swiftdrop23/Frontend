import Profile from "../pages/account/Profile";
import ChangePassword from "../pages/account/ChangePassword";
import type { Role } from "../types";
import type { PageRoute } from "./pageRoute";

// Profile + Change password, shared by every role (except where a role overrides "profile").
export const accountRoutes = (role: Role): PageRoute[] => [
  { path: "profile", element: <Profile role={role} /> },
  { path: "profile/change-password", element: <ChangePassword /> },
];
