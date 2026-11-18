import { request } from "./http";

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  pickedUp: boolean;
  outForDelivery: boolean;
  delivered: boolean;
  failed: boolean;
}

export interface ParcelNotification {
  id: number;
  trackingNumber: string;
  status: string;
  createdAt: string;
  read: boolean;
}

interface WebhookDelivery {
  id: string;
  merchant: string;
  trackingNumber: string | null;
  newStatus: string | null;
  result: "PENDING" | "RETRYING" | "SUCCESS" | "FAILED";
  createdAt: string;
  attemptCount: number;
}

interface WebhookAttempt {
  attempt: number;
  attemptedAt: string;
  httpStatus: number | null;
  error: string | null;
}

const notifications = "/customer/notifications";
const webhooks = "/merchant/webhooks";
const failed = "/admin/failed-webhooks";
const deliveryPath = (id: string) => `${webhooks}/deliveries/${encodeURIComponent(id)}`;

const time = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
});
export const formatTime = (value: string) => time.format(new Date(value));
export const formatStatus = (value: string) => value.toLowerCase().replaceAll("_", " ")
  .replace(/^./, (first) => first.toUpperCase());

const results = { PENDING: "Pending", RETRYING: "Retrying", SUCCESS: "Success", FAILED: "Failed (DLQ)" } as const;

function toDelivery(row: WebhookDelivery) {
  return {
    id: row.id, merchant: row.merchant, tracking: row.trackingNumber ?? "—",
    event: row.newStatus ? formatStatus(row.newStatus) : "Test event",
    eventName: row.trackingNumber ? "parcel.status.changed" : "webhook.test",
    result: results[row.result], time: formatTime(row.createdAt), attemptCount: row.attemptCount,
  };
}

export const notificationApi = {
  list: () => request<ParcelNotification[]>("GET", notifications),
  readAll: () => request<void>("POST", `${notifications}/read-all`),
  settings: () => request<NotificationPreferences>("GET", `${notifications}/settings`),
  saveSettings: (settings: NotificationPreferences) =>
    request<NotificationPreferences>("PUT", `${notifications}/settings`, settings),
  async merchant() {
    const [settings, rows] = await Promise.all([
      request<{ endpoint: string }>("GET", webhooks),
      request<WebhookDelivery[]>("GET", `${webhooks}/deliveries`),
    ]);
    return { endpoint: settings.endpoint, deliveries: rows.map(toDelivery) };
  },
  saveEndpoint: (endpoint: string) => request<{ endpoint: string }>("PUT", webhooks, { endpoint }),
  test: () => request<{ id: string }>("POST", `${webhooks}/test`),
  async details(id: string) {
    const data = await request<{
      delivery: WebhookDelivery;
      payload: Record<string, string>;
      attempts: WebhookAttempt[];
    }>("GET", deliveryPath(id));
    return {
      delivery: toDelivery(data.delivery), payload: data.payload,
      attempts: data.attempts.map((attempt) => ({
        time: formatTime(attempt.attemptedAt),
        response: attempt.httpStatus?.toString() ?? attempt.error ?? "—",
        success: attempt.error === null,
      })),
    };
  },
  retry: (id: string) => request<void>("POST", `${deliveryPath(id)}/retry`),
  async failed() {
    const rows = await request<{ delivery: WebhookDelivery; lastError: string }[]>("GET", failed);
    return rows.map(({ delivery, lastError }) => ({ ...toDelivery(delivery), lastError }));
  },
  retryFailed: (id: string) => request<void>("POST", `${failed}/${encodeURIComponent(id)}/retry`),
  discard: (id: string) => request<void>("DELETE", `${failed}/${encodeURIComponent(id)}`),
};
