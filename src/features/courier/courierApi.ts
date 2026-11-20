import { freshToken } from '../../api/session';
import { isComplete, validateUpdate } from './statusRules';
import type { Delivery, StatusUpdate } from './types';

export const API_URL: string | undefined = import.meta.env.VITE_COURIER_API_URL?.replace(/\/$/, '');
export const demoMode = !API_URL;
export const localAccess = !demoMode && import.meta.env.VITE_COURIER_LOCAL_ACCESS === 'true';

const KEY = 'swiftdrop.courier.demo.v1';

const colomboDate = (value: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);

export const today = (): string => colomboDate(new Date());

type SeedRow = [id: number, receiverName: string, receiverAddress: string, status: string, instructions: string, weightKg: number];

function seed(): Delivery[] {
  const rows: SeedRow[] = [
    [130, 'Nimal Perera', 'No. 12, Temple Road, Kandy', 'PICKED_UP', 'Leave with reception', 1.5],
    [131, 'Kamala Silva', 'No. 8, Beach Road, Galle', 'OUT_FOR_DELIVERY', 'Call when you arrive at the gate', 2],
    [132, 'Ruwan Fernando', 'No. 24, Main Street, Colombo', 'PENDING', 'Handle with care', 0.8],
    [133, 'Ayesha Hassan', 'No. 6, Lake Road, Kandy', 'IN_TRANSIT', 'Apartment 2B', 3],
    [128, 'Saman Perera', 'No. 5, Station Road, Galle', 'DELIVERED', '', 1],
    [127, 'Malini De Silva', 'No. 17, Park Road, Colombo', 'FAILED', 'No one at the address', 2],
  ];
  return rows.map(([id, receiverName, receiverAddress, status, instructions, weightKg]) => ({
    id,
    trackingNumber: `SD-000${id}`,
    receiverName,
    receiverAddress,
    receiverPhone: '',
    status,
    instructions,
    weightKg,
    scheduledDate: today(),
    completedAt: isComplete(status) ? new Date().toISOString() : null,
    recipientName: status === 'DELIVERED' ? 'Saman P.' : '',
    failureReason: status === 'FAILED' ? 'Recipient not available' : '',
    note: '',
    version: 0,
  }));
}

function write(value: Delivery[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    throw new Error('Demo storage is full or unavailable. Remove large photos or reset the demo.');
  }
}

function read(): Delivery[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (Array.isArray(value)) return value as Delivery[];
  } catch {
    /* recover invalid demo storage */
  }
  const value = seed();
  write(value);
  return value;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await freshToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the courier server. Try again.');
  }
  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(error.message || `Request failed (${res.status}).`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

export async function getDeliveries(date: string): Promise<Delivery[]> {
  if (!demoMode) return request<Delivery[]>(`?date=${encodeURIComponent(date)}`);
  return read().filter((d) => d.scheduledDate === date || (d.completedAt != null && colomboDate(new Date(d.completedAt)) === date));
}

export async function uploadProof(id: number, file: File): Promise<{ id: string; name?: string }> {
  if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Choose a JPEG or PNG image up to 5 MB.');
  if (demoMode) {
    // Preview only: no image bytes are persisted to localStorage.
    return { id: `demo-${id}-${Date.now()}`, name: file.name };
  }
  const body = new FormData();
  body.append('file', file);
  return request<{ id: string; name?: string }>(`/${id}/proof`, { method: 'POST', body });
}

export async function updateStatus(id: number, update: StatusUpdate): Promise<Delivery> {
  if (!demoMode) {
    return request<Delivery>(`/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) });
  }
  const all = read();
  const current = all.find((d) => d.id === id);
  if (!current) throw new Error('Delivery not found.');
  validateUpdate(current, update);
  const next: Delivery = { ...current, ...update, version: current.version + 1, completedAt: isComplete(update.status) ? new Date().toISOString() : null };
  write(all.map((d) => (d.id === id ? next : d)));
  return next;
}

export function resetDemo(): void {
  write(seed());
}
