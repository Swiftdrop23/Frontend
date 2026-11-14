import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import DashboardLayout from "./components/DashboardLayout";
import Placeholder from "./components/Placeholder";
import { NAV, homePath } from "./config/navigation";
import type { NavConfig } from "./config/navigation";
import { ROUTES } from "./routes";
import { publicRoutes } from "./routes/publicRoutes";
import { authRoutes } from "./routes/authRoutes";
import { getUser } from "./api/auth";
import type { Role } from "./types";

function Start() {
  const user = getUser();
  return <Navigate to={user ? homePath(user.role) : "/login"} replace />;
}

// Do not put page routes here. Each role has its own file in src/routes/ (customerRoutes.tsx, courierRoutes.tsx, ...).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      {authRoutes.map((route) => <Route key={route.path} path={route.path} element={route.element} />)}
      {publicRoutes.map((route) => <Route key={route.path} path={route.path} element={route.element} />)}
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {(Object.entries(NAV) as [Role, NavConfig][]).map(([role, cfg]) => {
        const defined = ROUTES[role];
        // Sidebar items that have no route yet still open a placeholder instead of a blank page.
        const missing = cfg.items.filter(([, path]) => !defined.some((r) => r.path === path));
        return (
          <Route key={role} path={cfg.base} element={<DashboardLayout role={role} />}>
            <Route index element={<Navigate to={cfg.items[0][1]} replace />} />
            {defined.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
            {missing.map(([, path]) => (
              <Route key={path} path={path} element={<Placeholder />} />
            ))}
          </Route>
        );
      })}

      <Route path="*" element={<Start />} />
    </Routes>
  );
}
