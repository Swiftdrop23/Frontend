export type Zone = { id: string; name: string; areas: string[]; active: boolean };
export type PricingRule = { id: string; zoneId: string; size: "Small" | "Medium" | "Large"; baseFee: number; perKg: number };
export type DeliveryRow = { date: string; total: number; delivered: number; failed: number; status: "Delivered" | "Failed" };
export type ReportSummary = { total: number; delivered: number; failed: number; successRate: number; daily: DeliveryRow[] };

import { request } from "../../api/http";

const mapZone = (row: { id: number | string; name: string; areas: string[]; active: boolean }): Zone => ({ ...row, id: String(row.id) });
const mapRule = (row: { id: number | string; zoneId: number | string; size: PricingRule["size"]; baseFee: number; perKg: number }): PricingRule => ({ ...row, id: String(row.id), zoneId: String(row.zoneId), baseFee: Number(row.baseFee), perKg: Number(row.perKg) });

export async function getZones(): Promise<Zone[]> {
  return (await request<Array<{ id: number | string; name: string; areas: string[]; active: boolean }>>("GET", "/admin/zones")).map(mapZone);
}
export async function getRules(): Promise<PricingRule[]> {
  return (await request<Array<{ id: number | string; zoneId: number | string; size: PricingRule["size"]; baseFee: number; perKg: number }>>("GET", "/admin/pricing-rules")).map(mapRule);
}
export async function getRule(id: string): Promise<PricingRule | undefined> {
  return (await getRules()).find((rule) => rule.id === id);
}
export async function saveZone(zone: Zone): Promise<Zone> {
  const saved = await request<{ id: number | string; name: string; areas: string[]; active: boolean }>("POST", "/admin/zones", zone);
  return mapZone(saved);
}
export async function saveRule(rule: PricingRule, creating = false): Promise<PricingRule> {
  const saved = await request<{ id: number | string; zoneId: number | string; size: PricingRule["size"]; baseFee: number; perKg: number }>(
    creating ? "POST" : "PUT", creating ? "/admin/pricing-rules" : `/admin/pricing-rules/${rule.id}`, rule,
  );
  return mapRule(saved);
}

export async function getReportSummary(): Promise<ReportSummary> {
  return request<ReportSummary>("GET", "/admin/reports/summary");
}

export async function getDeliveryReport(from: string, to: string, status: string): Promise<DeliveryRow[]> {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  query.set("status", status);
  return request<DeliveryRow[]>("GET", `/admin/reports?${query.toString()}`);
}
