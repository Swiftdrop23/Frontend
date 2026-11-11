import type { ParcelStatus } from "../types";
import type { Fee, DeliveryQuote, DeliveryReceipt, DeliveryEstimate, DeliveryState,
  DeliveryFields, EstimateFields, Recipient, DeliveryFieldErrors } from "../types/delivery";

export class DeliveryError extends Error {
  constructor(public status: number, public code: string, message: string,
    public fields: unknown = [], public revisedQuote: DeliveryQuote | null = null) {
    super(message);
    this.name = "DeliveryError";
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Normalize unknown failures without trusting unvalidated API payloads. */
export function deliveryError(value: unknown): DeliveryError {
  if (value instanceof DeliveryError) return value;
  const error = new DeliveryError(record(value) && typeof value.status === "number" ? value.status : 0,
    record(value) && typeof value.code === "string" ? value.code : "NETWORK_ERROR",
    value instanceof Error ? value.message : "The delivery service is unavailable.",
    record(value) ? value.fields : []);
  if (value instanceof Error) error.name = value.name;
  if (record(value) && validQuote(value.revisedQuote)) error.revisedQuote = value.revisedQuote;
  return error;
}

function invalidResponse(): DeliveryError {
  return new DeliveryError(0, "INVALID_RESPONSE", "The delivery service returned an incomplete response. Retry the same request.");
}

export function validFee(fee: unknown): fee is Fee {
  return record(fee) && typeof fee.amount === "string" && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(fee.amount)
    && typeof fee.currency === "string" && /^[A-Z]{3}$/.test(fee.currency);
}

function validQuote(quote: unknown): quote is DeliveryQuote {
  return record(quote) && typeof quote.quoteId === "string" && Boolean(quote.quoteId.trim())
    && validFee(quote.fee) && validDate(quote.expiresAt)
    && (quote.pricingVersion === undefined || typeof quote.pricingVersion === "string");
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Date.parse(value));
}

function sameFee(first: unknown, second: unknown): boolean {
  if (!validFee(first) || !validFee(second) || first.currency !== second.currency) return false;
  const canonical = (amount: string) => {
    const [integer, fraction = ""] = amount.split(".");
    return `${integer}.${fraction.replace(/0+$/, "")}`;
  };
  return canonical(first.amount) === canonical(second.amount);
}

interface RequestOptions { signal?: AbortSignal; authenticated?: boolean; method?: "GET" | "POST" }

async function request(path: string, body: unknown, { signal, authenticated = true, method = "POST" }: RequestOptions = {}): Promise<unknown> {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (!base) throw new DeliveryError(503, "SERVICE_UNAVAILABLE", "The delivery service is not configured.");
  const token = localStorage.getItem("token");
  let response: Response;
  try {
    response = await fetch(`${base}/v1/${path}`, {
      method, credentials: "include", signal,
      headers: { "Content-Type": "application/json", ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}) },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new DeliveryError(0, "NETWORK_ERROR", "Cannot verify the delivery service response. Check your connection and retry.");
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const payload = record(data) ? data : {};
    throw new DeliveryError(response.status,
      typeof payload.code === "string" ? payload.code : "SERVICE_ERROR",
      typeof payload.message === "string" ? payload.message : "The delivery service is unavailable.",
      payload.fieldErrors ?? [], validQuote(payload.revisedQuote) ? payload.revisedQuote : null);
  }
  return data;
}

export function quotePayload(details: DeliveryFields) {
  return {
    pickupAddress: details.pickupAddress.trim(), dropoffAddress: details.dropoffAddress.trim(),
    parcel: { weightKg: details.weight.trim(), dimensionsCm: {
      length: details.length.trim(), width: details.width.trim(), height: details.height.trim(),
    } },
  };
}

export async function requestDeliveryQuote(details: DeliveryFields, signal?: AbortSignal): Promise<DeliveryQuote> {
  const quote = await request("customer/delivery-quotes", quotePayload(details), { signal });
  if (!validQuote(quote)) throw invalidResponse();
  return quote;
}

function receiptResponse(receipt: unknown, quoteId: string): DeliveryReceipt {
  if (!record(receipt) || receipt.quoteId !== quoteId || typeof receipt.deliveryId !== "string" || !/^[1-9]\d*$/.test(receipt.deliveryId)
      || typeof receipt.trackingNumber !== "string" || !receipt.trackingNumber.trim() || receipt.status !== "CREATED"
      || !validFee(receipt.fee) || !validDate(receipt.createdAt)) throw invalidResponse();
  return { quoteId, deliveryId: receipt.deliveryId, trackingNumber: receipt.trackingNumber,
    status: "CREATED", fee: receipt.fee, createdAt: receipt.createdAt };
}

export async function confirmDelivery(quoteId: string, recipient: Recipient, reviewedFee: Fee): Promise<DeliveryReceipt> {
  const receipt = receiptResponse(await request("customer/deliveries", { quoteId, recipient }), quoteId);
  if (!sameFee(receipt.fee, reviewedFee)) throw invalidResponse();
  return receipt;
}

/** Read the authenticated owner's original receipt; this never creates or retries a delivery. */
export async function lookupDeliveryReceipt(quoteId: string, signal?: AbortSignal): Promise<DeliveryReceipt> {
  const reference = quoteId.trim();
  if (!reference) throw new DeliveryError(422, "VALIDATION_FAILED", "Enter your quote reference.");
  return receiptResponse(await request(`customer/deliveries/by-quote/${encodeURIComponent(reference)}`, undefined,
    { signal, method: "GET" }), reference);
}

export async function requestEstimate(details: EstimateFields, signal?: AbortSignal): Promise<DeliveryEstimate> {
  const result = await request("delivery-estimates", {
    pickupCity: details.pickupCity.trim(), dropoffCity: details.dropoffCity.trim(), weightKg: details.weight.trim(),
  }, { signal, authenticated: false });
  if (!record(result) || result.indicative !== true || !validFee(result.fee)) throw invalidResponse();
  return { indicative: true, fee: result.fee };
}

const statuses: readonly ParcelStatus[] = ["CREATED", "PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
function validStatus(value: unknown): value is ParcelStatus {
  return typeof value === "string" && statuses.some(status => status === value);
}

export async function lookupDeliveryForCancellation(trackingNumber: string, signal?: AbortSignal): Promise<DeliveryState> {
  const delivery = await request(`customer/deliveries/track/${encodeURIComponent(trackingNumber)}`, undefined, { signal, method: "GET" });
  if (!record(delivery) || delivery.trackingNumber !== trackingNumber || !validStatus(delivery.status)) throw invalidResponse();
  return { trackingNumber, status: delivery.status };
}

export async function cancelDelivery(trackingNumber: string): Promise<DeliveryState> {
  const result = await request("customer/deliveries/cancel", { trackingNumber });
  if (!record(result) || result.trackingNumber !== trackingNumber || result.status !== "CANCELLED") throw invalidResponse();
  return { trackingNumber, status: "CANCELLED" };
}

export function fieldErrors(fields: unknown = []): DeliveryFieldErrors {
  const names: Record<string, keyof DeliveryFieldErrors> = {
    pickupAddress: "pickupAddress", dropoffAddress: "dropoffAddress", "parcel.weightKg": "weight",
    "parcel.dimensionsCm.length": "length", "parcel.dimensionsCm.width": "width", "parcel.dimensionsCm.height": "height",
    "recipient.name": "recipientName", "recipient.phone": "recipientPhone",
  };
  const errors: DeliveryFieldErrors = {};
  for (const field of Array.isArray(fields) ? fields : []) {
    if (record(field) && typeof field.field === "string" && Object.hasOwn(names, field.field) && typeof field.message === "string") {
      errors[names[field.field]] = field.message;
    }
  }
  return errors;
}
