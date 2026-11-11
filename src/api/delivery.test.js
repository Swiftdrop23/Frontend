import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { confirmDelivery, requestDeliveryQuote, requestEstimate, lookupDeliveryForCancellation, lookupDeliveryReceipt, cancelDelivery, fieldErrors } from "./delivery";

const details = { pickupAddress: " Test pickup ", dropoffAddress: "Test drop-off", weight: "0.75", length: "25.5", width: "15", height: "10" };
const fee = { amount: "2.88", currency: "USD" }; // Test fixture only.
const quote = { quoteId: "fixture-quote", fee, expiresAt: "2099-01-01T00:00:00Z" };
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });

const saved = { deliveryId: "42", quoteId: "fixture/ref", trackingNumber: "SD-FIXTURE", status: "CREATED",
  fee, createdAt: "2026-11-09T12:00:00Z" };

describe("Owned saved receipt lookup", () => {
  it("uses an authenticated GET and encodes only the quote reference", async () => {
    localStorage.setItem("token", "test-only-token");
    const fetch = vi.fn().mockResolvedValue(response(saved)); vi.stubGlobal("fetch", fetch);
    await expect(lookupDeliveryReceipt(" fixture/ref ")).resolves.toEqual(saved);
    expect(fetch).toHaveBeenCalledWith("/api/v1/customer/deliveries/by-quote/fixture%2Fref",
      expect.objectContaining({ method: "GET", credentials: "include", body: undefined,
        headers: expect.objectContaining({ Authorization: "Bearer test-only-token" }) }));
  });
  it("refuses an empty reference without a request", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(lookupDeliveryReceipt(" ")).rejects.toMatchObject({ status: 422 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([{ quoteId: "other" }, { deliveryId: 42 }, { status: "DELIVERED" }, { trackingNumber: "" },
    { fee: { amount: "NaN", currency: "USD" } }, { createdAt: "invalid" }])("rejects an invalid historical receipt: %j", async patch => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ ...saved, ...patch })));
    await expect(lookupDeliveryReceipt(saved.quoteId)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("keeps a missing or foreign receipt as 404 and never tries a new booking", async () => {
    const fetch = vi.fn().mockResolvedValue(response({ code: "DELIVERY_NOT_FOUND" }, 404)); vi.stubGlobal("fetch", fetch);
    await expect(lookupDeliveryReceipt(saved.quoteId)).rejects.toMatchObject({ status: 404 });
    expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0][1].method).toBe("GET");
  });
});

beforeEach(() => { vi.stubEnv("VITE_API_URL", "/api"); localStorage.clear(); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Delivery API client", () => {
  it("ignores malformed validation entries without crashing or injecting unknown form fields", () => {
    expect(fieldErrors([null, {}, { field: "__proto__", message: "Unknown" }, { field: "pickupAddress", message: {} },
      { field: ["pickupAddress"], message: "Wrong type" }, { field: "parcel.weightKg", message: "Check weight" }]))
      .toEqual({ weight: "Check weight" });
  });

  it("sends decimal strings and bearer credentials without a customer ID or client-calculated price", async () => {
    localStorage.setItem("token", "test-only-token");
    const fetch = vi.fn().mockResolvedValue(response(quote, 201)); vi.stubGlobal("fetch", fetch);
    await requestDeliveryQuote(details);
    const [path, options] = fetch.mock.calls[0];
    expect(path).toBe("/api/v1/customer/delivery-quotes");
    expect(options.credentials).toBe("include");
    expect(options.headers.Authorization).toBe("Bearer test-only-token");
    expect(JSON.parse(options.body)).toEqual({ pickupAddress: "Test pickup", dropoffAddress: "Test drop-off",
      parcel: { weightKg: "0.75", dimensionsCm: { length: "25.5", width: "15", height: "10" } } });
  });

  it("never supplies a fallback price or mock success without an API configuration", async () => {
    vi.stubEnv("VITE_API_URL", ""); const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(requestDeliveryQuote(details)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("confirms only a reference and recipient, and accepts numeric scale differences in the receipt", async () => {
    const recipient = { name: "Test recipient", phone: "Test phone" };
    const fetch = vi.fn().mockResolvedValue(response({ deliveryId: "42", quoteId: quote.quoteId, trackingNumber: "fixture-tracking",
      status: "CREATED", fee: { ...fee, amount: "2.8800" }, createdAt: "2026-11-09T12:00:00Z" }, 201));
    vi.stubGlobal("fetch", fetch);
    await confirmDelivery(quote.quoteId, recipient, fee);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ quoteId: quote.quoteId, recipient });
  });

  it("rejects an incomplete or incorrectly priced creation response rather than claiming success", async () => {
    const fetch = vi.fn().mockResolvedValue(response({ deliveryId: "42", quoteId: quote.quoteId, trackingNumber: "fixture-tracking",
      status: "CREATED", fee: { ...fee, amount: "3.00" }, createdAt: "2026-11-09T12:00:00Z" }, 201));
    vi.stubGlobal("fetch", fetch);
    await expect(confirmDelivery(quote.quoteId, { name: "Recipient", phone: "Phone" }, fee))
      .rejects.toMatchObject({ status: 0, code: "INVALID_RESPONSE" });
  });

  it("carries a validated replacement quote for explicit renewed review", async () => {
    const replacement = { ...quote, quoteId: "replacement", fee: { ...fee, amount: "3.88" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ code: "QUOTE_PRICE_CHANGED", revisedQuote: replacement }, 409)));
    await expect(confirmDelivery(quote.quoteId, { name: "Recipient", phone: "Phone" }, fee))
      .rejects.toMatchObject({ code: "QUOTE_PRICE_CHANGED", revisedQuote: replacement });
  });

  it("requests public indicative estimates without inventing dimensions or using a local mock role", async () => {
    localStorage.setItem("token", "test-only-token");
    const fetch = vi.fn().mockResolvedValue(response({ fee, indicative: true })); vi.stubGlobal("fetch", fetch);
    await requestEstimate({ pickupCity: " Test pickup ", dropoffCity: "Test drop-off", weight: "0.75" });
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/delivery-estimates");
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ pickupCity: "Test pickup", dropoffCity: "Test drop-off", weightKg: "0.75" });
  });
});

describe("strict server response contracts", () => {
  it.each([
    { deliveryId: {} }, { deliveryId: 42 }, { deliveryId: "-1" }, { deliveryId: "0" },
    { trackingNumber: {} }, { trackingNumber: " " }, { createdAt: 2026 }, { createdAt: "invalid" },
  ])("rejects malformed creation fields: %j", async (override) => {
    const receipt = { deliveryId: "42", quoteId: quote.quoteId, trackingNumber: "fixture-tracking",
      status: "CREATED", fee, createdAt: "2026-11-09T12:00:00Z", ...override };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(receipt, 201)));
    await expect(confirmDelivery(quote.quoteId, { name: "Recipient", phone: "Phone" }, fee))
      .rejects.toMatchObject({ status: 0, code: "INVALID_RESPONSE" });
  });

  it.each([2026, null, "invalid"])("rejects a non-date quote expiry: %j", async (expiresAt) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ ...quote, expiresAt }, 201)));
    await expect(requestDeliveryQuote(details)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});

describe("owned delivery cancellation API", () => {
  it("looks up the exact tracking reference using the authenticated owned parcel route", async () => {
    localStorage.setItem("token", "test-only-token");
    const fetch = vi.fn().mockResolvedValue(response({ trackingNumber: "test/ref", status: "CREATED", receiverName: "Test" }));
    vi.stubGlobal("fetch", fetch);
    await expect(lookupDeliveryForCancellation("test/ref")).resolves.toEqual({ trackingNumber: "test/ref", status: "CREATED" });
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/customer/deliveries/track/test%2Fref");
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: "GET", credentials: "include", headers: { Authorization: "Bearer test-only-token" } });
    expect(fetch.mock.calls[0][1].body).toBeUndefined();
  });

  it("sends only the tracking reference, never a customer ID or client-selected status", async () => {
    const fetch = vi.fn().mockResolvedValue(response({ trackingNumber: "fixture-tracking", status: "CANCELLED" }));
    vi.stubGlobal("fetch", fetch);
    await expect(cancelDelivery("fixture-tracking")).resolves.toMatchObject({ status: "CANCELLED" });
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/customer/deliveries/cancel");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ trackingNumber: "fixture-tracking" });
  });

  it.each([{ trackingNumber: "other", status: "CANCELLED" }, { trackingNumber: "fixture-tracking", status: "CREATED" }, null])(
    "rejects an unverified cancellation response: %j", async (data) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(data)));
      await expect(cancelDelivery("fixture-tracking")).rejects.toMatchObject({ status: 0, code: "INVALID_RESPONSE" });
    });

  it("preserves the server's post-pickup refusal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ code: "DELIVERY_NOT_CANCELLABLE", message: "Pickup has occurred." }, 409)));
    await expect(cancelDelivery("fixture-tracking")).rejects.toMatchObject({ status: 409, code: "DELIVERY_NOT_CANCELLABLE" });
  });
});
