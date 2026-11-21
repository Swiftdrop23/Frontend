// Pickup trips, live courier tracking, map pins and navigation (Member 10).
import { request } from "./http";

export interface Point {
  lat: number;
  lng: number;
}

export interface CourierProfile {
  name: string | null;
  phone: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
}

export interface CourierStop {
  deliveryId: number;
  version: number;
  trackingNumber: string;
  status: string;
  senderName: string | null;
  senderPhone: string | null;
  pickupAddress: string | null;
  pickup: Point | null;
  recipientName: string | null;
  recipientPhone: string | null;
  dropoffAddress: string | null;
  dropoff: Point | null;
  tripActive: boolean;
}

export interface CustomerLiveView {
  trackingNumber: string;
  live: boolean;
  status: string;
  message: string;
  pickupAddress: string | null;
  pickup: Point | null;
  tripStartedAt: string | null;
  courier: CourierProfile | null;
  position: { latitude: number; longitude: number; accuracyM: number | null; updatedAt: string } | null;
}

export interface ParcelPins {
  pickup: Point | null;
  dropoff: Point | null;
}

export interface RecipientAlertSettings {
  pickedUp: boolean;
  outForDelivery: boolean;
  delivered: boolean;
  /** Recipient's email for the status emails (Member 10). Only used when a box is ticked. */
  email?: string;
}

export interface RecipientAlertsView {
  settings: RecipientAlertSettings;
  recipientPhone: string | null;
  sent: { status: string; message: string; result: "SENT" | "LOGGED" | "FAILED"; createdAt: string }[];
}

export const NO_ALERTS: RecipientAlertSettings = { pickedUp: false, outForDelivery: false, delivered: false, email: "" };

export const VEHICLE_TYPES = ["Motorbike", "Three-wheeler", "Car", "Van", "Lorry", "Bicycle"] as const;

const parcel = (trackingNumber: string) => `/v1/customer/parcels/${encodeURIComponent(trackingNumber)}`;

export const liveMapApi = {
  // Customer
  customerView: (trackingNumber: string) => request<CustomerLiveView>("GET", `${parcel(trackingNumber)}/courier-location`),
  savePins: (trackingNumber: string, pins: ParcelPins) => request<void>("PUT", `${parcel(trackingNumber)}/pins`, pins),
  recipientAlerts: (trackingNumber: string) => request<RecipientAlertsView>("GET", `${parcel(trackingNumber)}/recipient-alerts`),
  saveRecipientAlerts: (trackingNumber: string, settings: RecipientAlertSettings) =>
    request<RecipientAlertsView>("PUT", `${parcel(trackingNumber)}/recipient-alerts`, settings),
  // Courier
  stops: () => request<CourierStop[]>("GET", "/v1/courier/map/stops"),
  startTrip: (deliveryId: number) => request<CourierStop>("POST", `/v1/courier/map/stops/${deliveryId}/start-trip`),
  endTrip: (deliveryId: number) => request<void>("POST", `/v1/courier/map/stops/${deliveryId}/end-trip`),
  shareLocation: (latitude: number, longitude: number, accuracy: number | null) =>
    request<void>("PUT", "/v1/courier/map/location", { latitude, longitude, accuracy }),
  stopSharing: () => request<void>("DELETE", "/v1/courier/map/location"),
  profile: () => request<CourierProfile>("GET", "/v1/courier/map/profile"),
  saveProfile: (profile: { phone: string; vehicleType: string; vehicleNumber: string }) =>
    request<CourierProfile>("PUT", "/v1/courier/map/profile", profile),
};

/** Saves the pins of a new delivery. Pins are optional, so a failure never blocks the booking. */
export async function savePinsQuietly(trackingNumber: string, pins: ParcelPins): Promise<void> {
  if (!pins.pickup && !pins.dropoff) return;
  try {
    await liveMapApi.savePins(trackingNumber, pins);
  } catch {
    /* the courier can still navigate by address */
  }
}

export const isEmail = (value: string | undefined): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? "").trim());

/** Saves the recipient email choices of a new delivery; only when a box is ticked and the email is valid. */
export async function saveAlertsQuietly(trackingNumber: string, settings: RecipientAlertSettings): Promise<void> {
  if (!settings.pickedUp && !settings.outForDelivery && !settings.delivered) return;
  if (!isEmail(settings.email)) return;
  try {
    await liveMapApi.saveRecipientAlerts(trackingNumber, settings);
  } catch {
    /* the sender can still change this later in Live Tracking */
  }
}

/**
 * Google Maps directions with the destination already filled in ("To"); the courier chooses the start.
 * The exact pin is used when the customer set one, otherwise the town part of the address.
 */
export function navigationUrl(address: string | null, pin?: Point | null): string {
  const destination = pin ? `${pin.lat},${pin.lng}` : `${townPart(address ?? "")}, Sri Lanka`;
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(destination)}`;
}

/** The last two comma-separated parts of an address, for example "Thalpotha, Polonnaruwa". */
export function townPart(address: string): string {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.slice(-2).join(", ") || address.trim();
}

/** tel: link for a Sri Lankan phone number. */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
