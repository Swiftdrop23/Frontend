import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV } from "../config/navigation";
import { clearSession, getUser, logout as signOutOnServer } from "../api/auth";
import type { Role } from "../types";

const EXTRA_TITLES: Record<string, string> = { "profile/change-password": "Change Password" };

export default function DashboardLayout({ role }: { role: Role }) {
  const user = getUser();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const cfg = NAV[role];

  const loginPath = role === "ADMIN" ? "/admin-login" : "/login";
  if (!user || user.role !== role) return <Navigate to={loginPath} replace />;

  const current = cfg.items.find(([, p]) => pathname.startsWith(`${cfg.base}/${p}`));
  const extra = Object.entries(EXTRA_TITLES).find(([p]) => pathname.endsWith("/" + p));
  const title = extra ? extra[1] : current ? current[0] : "Dashboard";
  const logout = () => {
    void signOutOnServer();
    clearSession();
    nav(loginPath, { replace: true });
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
        </main>
      </div>
    </div>
  );
}
