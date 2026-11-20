import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV } from "../config/navigation";
import { getUser, logout as signOut } from "../api/auth";
import type { Role } from "../types";
import AssistantWidget from "./assistant/AssistantWidget";

const EXTRA_TITLES: Record<string, string> = {
  "profile/change-password": "Change Password",
  "zones-pricing/add-zone": "Add Zone",
  "zones-pricing/add-rule": "Add Pricing Rule",
  "notifications/settings": "Notification Settings",
};

export default function DashboardLayout({ role }: { role: Role }) {
  const user = getUser();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const cfg = NAV[role];

  if (!user || user.role !== role) return <Navigate to="/login" replace />;

  const current = cfg.items.find(([, p]) => pathname.startsWith(`${cfg.base}/${p}`));
  const extra = Object.entries(EXTRA_TITLES).find(([p]) => pathname.endsWith("/" + p) || pathname.includes("/" + p + "/"));
  const webhookDelivery = role === "MERCHANT" && pathname.startsWith(`${cfg.base}/webhooks/`);
  const title = extra ? extra[1]
    : pathname.match(/\/zones-pricing\/edit-rule\//) ? "Edit Pricing Rule"
    : pathname.endsWith("/reports/delivery-report") ? "Delivery Report"
    : webhookDelivery ? "Webhook Delivery"
    : current ? current[0] : "Dashboard";
  const logout = () => {
    void signOut();
    nav("/login", { replace: true });
  };

  return (
    <div className="dash">
      <aside className="side">
        <div className="side-brand">SwiftDrop</div>
        <nav aria-label="Main">
          {cfg.items.map(([label, path]) => (
            <NavLink key={path} to={`${cfg.base}/${path}`} className={({ isActive }) => "side-link" + (isActive ? " active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="dash-main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-user">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span>{user.name}</span>
            <button type="button" className="btn-outline" onClick={logout}>Logout</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main><AssistantWidget role={role} />
      </div>
    </div>
  );
}
