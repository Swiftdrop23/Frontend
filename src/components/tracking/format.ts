// Display helpers shared by the tracking, history and receipt pages.

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "---";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "---" : date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export function formatFee(amount: number | string | null | undefined, currency: string | null | undefined): string {
  const code = currency || "LKR";
  if (amount === null || amount === undefined || amount === "") return `${code} ---`;
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${code} ---`;
  return `${code} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatWeight(kg: number | string | null | undefined): string {
  if (kg === null || kg === undefined || kg === "") return "---";
  const value = Number(kg);
  return Number.isFinite(value) ? `${value} kg` : "---";
}
