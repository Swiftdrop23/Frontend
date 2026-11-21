import type { Role } from "../types";

export type NavItem = [label: string, path: string];

export interface NavConfig {
  base: string;
  items: NavItem[];
}

const common: NavItem[] = [["Profile", "profile"]];

export const NAV: Record<Role, NavConfig> = {
  CUSTOMER: { base: "/customer", items: [["Create Delivery", "create-delivery"], ["Live Tracking", "live-tracking"], ["Delivery History", "delivery-history"], ["Cancel Delivery", "cancel-delivery"], ...common] },
  MERCHANT: { base: "/merchant", items: [["Orders", "orders"], ["API Keys", "api-keys"], ["Webhooks", "webhooks"], ...common] },
  COURIER: { base: "/courier", items: [["My Deliveries", "deliveries"], ["Pickups & Drops", "route-map"], ...common] },
  DISPATCHER: { base: "/dispatcher", items: [["Unassigned Parcels", "unassigned-parcels"], ["Courier Workloads", "courier-workloads"], ...common] },
  ADMIN: {
    base: "/admin",
    items: [["Zones & Pricing", "zones-pricing"], ["Reports", "reports"], ["Users", "users"], ["Merchant Approvals", "merchant-approvals"], ["Failed Webhooks", "failed-webhooks"], ...common],
  },
};

export function homePath(role: string): string {
  const c = (NAV as Record<string, NavConfig | undefined>)[role];
  return c ? `${c.base}/${c.items[0][1]}` : "/login";
}
