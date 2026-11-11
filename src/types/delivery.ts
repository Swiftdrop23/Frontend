import type { ParcelStatus } from "../types";
export interface Fee { amount: string; currency: string }
export interface DeliveryQuote { quoteId: string; fee: Fee; expiresAt: string; pricingVersion?: string }
export interface Recipient { name: string; phone: string }
export interface ConfirmationAttempt { quoteId: string; recipient: Recipient; fee: Fee }
export interface DeliveryReceipt { deliveryId: string; quoteId: string; trackingNumber: string; status: "CREATED"; fee: Fee; createdAt: string }
export interface DeliveryEstimate { fee: Fee; indicative: true }
export interface DeliveryState { trackingNumber: string; status: ParcelStatus }
export interface DeliveryFields { pickupAddress: string; dropoffAddress: string; weight: string; length: string; width: string; height: string }
export interface EstimateFields { pickupCity: string; dropoffCity: string; weight: string }
export interface ValidationField { field: string; message: string }
export type DeliveryFieldErrors = Partial<Record<keyof DeliveryFields | "recipientName" | "recipientPhone", string>>;
