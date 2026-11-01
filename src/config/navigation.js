// [label, path] per role. Courier and Dispatcher menus are not in the Member designs yet.
const common = [["Notifications", "notifications"], ["Profile", "profile"]];

export const NAV = {
  CUSTOMER: { base: "/customer", items: [["Create Delivery", "create-delivery"], ["Live Tracking", "live-tracking"], ["Delivery History", "delivery-history"], ...common] },
  MERCHANT: { base: "/merchant", items: [["Orders", "orders"], ["API Keys", "api-keys"], ["Webhooks", "webhooks"], ...common] },
  COURIER: { base: "/courier", items: [["My Deliveries", "deliveries"], ...common] },
  DISPATCHER: { base: "/dispatcher", items: [["Unassigned Parcels", "unassigned-parcels"], ["Courier Workloads", "courier-workloads"], ...common] },
  ADMIN: {
    base: "/admin",
    items: [["Unassigned Parcels", "unassigned-parcels"], ["Courier Workloads", "courier-workloads"], ["Users", "users"], ["Merchant Approvals", "merchant-approvals"], ["Zones & Pricing", "zones-pricing"], ["Reports", "reports"], ...common],
  },
};

export function homePath(role) {
  const c = NAV[role];
  return c ? `${c.base}/${c.items[0][1]}` : "/login";
}