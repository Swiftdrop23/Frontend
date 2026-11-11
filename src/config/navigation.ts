import type { Role } from "../types";

export type NavItem = [label: string, path: string];

export interface NavConfig {
  base: string;
  items: NavItem[];
}

const common: NavItem[] = [["Notifications", "notifications"], ["Profile", "profile"]];

export const NAV: Record<Role, NavConfig> = {
  CUSTOMER: { base: "/customer", items: [["Create Delivery", "create-delivery"], ["Live Tracking", "live-tracking"], ["Delivery History", "delivery-history"], ["Cancel Delivery", "cancel-delivery"], ...common] },
  MERCHANT: { base: "/merchant", items: [["Orders", "orders"], ["API Keys", "api-keys"], ["Webhooks", "webhooks"], ...common] },
  COURIER: { base: "/courier", items: [["My Deliveries", "deliveries"], ...common] },
  DISPATCHER: { base: "/dispatcher", items: [["Unassigned Parcels", "unassigned-parcels"], ["Courier Workloads", "courier-workloads"], ...common] },
  ADMIN: {
    base: "/admin",
    items: [["Unassigned Parcels", "unassigned-parcels"], ["Courier Workloads", "courier-workloads"], ["Users", "users"], ["Merchant Approvals", "merchant-approvals"], ["Zones & Pricing", "zones-pricing"], ["Reports", "reports"], ...common],
  },
};

export function homePath(role: string): string {
  const c = (NAV as Record<string, NavConfig | undefined>)[role];
  return c ? `${c.base}/${c.items[0][1]}` : "/login";
}
