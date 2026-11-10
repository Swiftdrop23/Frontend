import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./components/DashboardLayout";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import { NAV, homePath } from "./config/navigation";
import type { NavConfig } from "./config/navigation";
import { getUser } from "./api/auth";
import type { Role } from "./types";

// Temporary content. Each member replaces <Placeholder /> below with their own page.
function Placeholder() {
  const { pathname } = useLocation();
  return (
    <div className="card">
      <p className="hint" style={{ margin: 0 }}>Page content for <code>{pathname}</code> goes here.</p>
    </div>
  );
}

function Start() {
  const user = getUser();
  return <Navigate to={user ? homePath(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {(Object.entries(NAV) as [Role, NavConfig][]).map(([role, cfg]) => (
        <Route key={role} path={cfg.base} element={<DashboardLayout role={role} />}>
          <Route index element={<Navigate to={cfg.items[0][1]} replace />} />
          {cfg.items.map(([, path]) =>
            // Merchants keep a placeholder here: their Business Profile page belongs to Member 4.
            path === "profile" && role !== "MERCHANT" ? (
              <Route key={path} path={path} element={<Profile role={role} />} />
            ) : (
              <Route key={path} path={path} element={<Placeholder />} />
            )
          )}
          <Route path="profile/change-password" element={<ChangePassword />} />
        </Route>
      ))}

      <Route path="*" element={<Start />} />
    </Routes>
  );
}
