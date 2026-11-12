export type Zone = { id: string; name: string; areas: string[]; active: boolean };
export type PricingRule = { id: string; zoneId: string; size: "Small" | "Medium" | "Large"; baseFee: number; perKg: number };
export type DeliveryRow = { date: string; total: number; delivered: number; failed: number; status: "Delivered" | "Failed" };
export type ReportSummary = { total: number; delivered: number; failed: number; successRate: number; daily: DeliveryRow[] };

import { isMock, request, wait } from "../../api/http";

const ZONES_KEY = "swiftdrop.admin.zones.v1";
const RULES_KEY = "swiftdrop.admin.pricing.v1";

const initialZones: Zone[] = [
  { id: "colombo", name: "Colombo Metro", areas: ["Colombo", "Dehiwala", "Nugegoda"], active: true },
  { id: "kandy", name: "Kandy", areas: ["Kandy", "Peradeniya"], active: true },
  { id: "galle", name: "Galle", areas: ["Galle", "Hikkaduwa"], active: true },
];
const initialRules: PricingRule[] = [
  { id: "colombo-small", zoneId: "colombo", size: "Small", baseFee: 350, perKg: 50 },
  { id: "colombo-large", zoneId: "colombo", size: "Large", baseFee: 600, perKg: 80 },
  { id: "kandy-small", zoneId: "kandy", size: "Small", baseFee: 450, perKg: 60 },
  { id: "galle-small", zoneId: "galle", size: "Small", baseFee: 450, perKg: 60 },
];

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const mapZone = (row: { id: number | string; name: string; areas: string[]; active: boolean }): Zone => ({ ...row, id: String(row.id) });
const mapRule = (row: { id: number | string; zoneId: number | string; size: PricingRule["size"]; baseFee: number; perKg: number }): PricingRule => ({ ...row, id: String(row.id), zoneId: String(row.zoneId), baseFee: Number(row.baseFee), perKg: Number(row.perKg) });

export async function getZones(): Promise<Zone[]> {
  if (!isMock) return (await request<Array<{ id: number | string; name: string; areas: string[]; active: boolean }>>("GET", "/admin/zones")).map(mapZone);
  await wait(120);
  return read(ZONES_KEY, initialZones);
}
export async function getRules(): Promise<PricingRule[]> {
  if (!isMock) return (await request<Array<{ id: number | string; zoneId: number | string; size: PricingRule["size"]; baseFee: number; perKg: number }>>("GET", "/admin/pricing-rules")).map(mapRule);
  await wait(120);
  return read(RULES_KEY, initialRules);
}
export async function getRule(id: string): Promise<PricingRule | undefined> {
  return (await getRules()).find((rule) => rule.id === id);
}
export async function saveZone(zone: Zone): Promise<Zone> {
  if (!isMock) {
    const saved = await request<{ id: number | string; name: string; areas: string[]; active: boolean }>("POST", "/admin/zones", zone);
    return mapZone(saved);
  }
  await wait(120);
  const zones = read(ZONES_KEY, initialZones);
  const existing = zones.some((item) => item.id === zone.id);
  const saved = existing ? zones.map((item) => item.id === zone.id ? zone : item) : [...zones, zone];
  write(ZONES_KEY, saved);
  return zone;
}
export async function saveRule(rule: PricingRule, creating = false): Promise<PricingRule> {
  if (!isMock) {
    const saved = await request<{ id: number | string; zoneId: number | string; size: PricingRule["size"]; baseFee: number; perKg: number }>(
      creating ? "POST" : "PUT", creating ? "/admin/pricing-rules" : `/admin/pricing-rules/${rule.id}`, rule,
    );
    return mapRule(saved);
  }
  await wait(120);
  const rules = read(RULES_KEY, initialRules);
  const existing = rules.some((item) => item.id === rule.id);
  const saved = existing ? rules.map((item) => item.id === rule.id ? rule : item) : [...rules, rule];
  write(RULES_KEY, saved);
  return rule;
}

export async function getReportSummary(): Promise<ReportSummary> {
  if (!isMock) return request<ReportSummary>("GET", "/admin/reports/summary");
  await wait(120);
  const daily = sampleDeliveries.slice(-7);
  const total = daily.reduce((sum, row) => sum + row.total, 0);
  const delivered = daily.reduce((sum, row) => sum + row.delivered, 0);
  const failed = daily.reduce((sum, row) => sum + row.failed, 0);
  return { total, delivered, failed, successRate: total ? Math.round((delivered / total) * 10000) / 100 : 0, daily };
}

export async function getDeliveryReport(from: string, to: string, status: string): Promise<DeliveryRow[]> {
  if (!isMock) {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    query.set("status", status);
    return request<DeliveryRow[]>("GET", `/admin/reports?${query.toString()}`);
  }
  await wait(120);
  return sampleDeliveries.filter((row) => (!from || row.date >= from) && (!to || row.date <= to)
    && (status === "All" || row.status === status));
}

export const sampleDeliveries: DeliveryRow[] = [
  { date: "2026-10-25", total: 18, delivered: 17, failed: 1, status: "Delivered" },
  { date: "2026-10-26", total: 22, delivered: 21, failed: 1, status: "Delivered" },
  { date: "2026-10-27", total: 20, delivered: 18, failed: 2, status: "Delivered" },
  { date: "2026-10-28", total: 24, delivered: 23, failed: 1, status: "Delivered" },
  { date: "2026-10-29", total: 19, delivered: 18, failed: 1, status: "Failed" },
  { date: "2026-10-30", total: 15, delivered: 15, failed: 0, status: "Delivered" },
  { date: "2026-10-31", total: 10, delivered: 8, failed: 2, status: "Failed" },
];
