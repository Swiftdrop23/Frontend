import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV } from "../config/navigation";
import { getUser, logout as signOut } from "../api/auth";
import type { Role } from "../types";
import AssistantWidget from "./assistant/AssistantWidget";

const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Customer", MERCHANT: "Merchant", COURIER: "Courier", DISPATCHER: "Dispatcher", ADMIN: "Admin",
};

const EXTRA_TITLES: Record<string, string> = {
  "profile/change-password": "Change Password",
  "zones-pricing/add-zone": "Add Zone",
  "zones-pricing/add-rule": "Add Pricing Rule",
  "notifications/settings": "Notification Settings",
  "notifications": "Notifications",
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
        <span className="side-role">{ROLE_LABEL[role]} portal</span>
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
            <NavLink to={`${cfg.base}/notifications`} className={({ isActive }) => "topbar-bell" + (isActive ? " active" : "")}
              aria-label="Notifications" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </NavLink>
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
