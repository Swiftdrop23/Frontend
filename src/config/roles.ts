import type { Role } from "../types";

// Roles that appear on the main login page. ADMIN is deliberately not here:
// the admin signs in at the separate, unlinked /admin-login page.
export type LoginRole = Exclude<Role, "ADMIN">;

export interface RoleLoginInfo {
  role: LoginRole;
  slug: string; // used in the URL: /login/<slug>
  label: string;
  icon: string;
  blurb: string;
  canRegister: boolean; // customers and merchants can self-register; staff accounts are created by an admin
  google: boolean; // Google sign-in is for customers only
}

export const LOGIN_ROLES: RoleLoginInfo[] = [
  { role: "CUSTOMER", slug: "customer", label: "Customer", icon: "📦", blurb: "Send and track your parcels", canRegister: true, google: true },
  { role: "MERCHANT", slug: "merchant", label: "Merchant", icon: "🏪", blurb: "Manage shop orders, API keys and webhooks", canRegister: true, google: false },
  { role: "COURIER", slug: "courier", label: "Courier", icon: "🛵", blurb: "View and update your deliveries", canRegister: false, google: false },
  { role: "DISPATCHER", slug: "dispatcher", label: "Dispatcher", icon: "🧭", blurb: "Assign parcels and monitor couriers", canRegister: false, google: false },
];

export const findLoginRole = (slug?: string): RoleLoginInfo | undefined =>
  LOGIN_ROLES.find((r) => r.slug === slug);
