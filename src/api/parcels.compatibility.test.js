import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => { vi.resetModules(); localStorage.clear(); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Configured legacy parcel compatibility", () => {
  it("retains the configured legacy request and server receipt without inventing delivery pricing", async () => {
    vi.stubEnv("VITE_API_URL", "/api");
    const data = { senderName: "Fixture sender", receiverName: "Fixture recipient", receiverAddress: "Fixture address" };
    const receipt = { ...data, id: 42, trackingNumber: "SD-FIXTURE", status: "PENDING" };
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => receipt });
    vi.stubGlobal("fetch", fetch);
    const { createParcel } = await import("./parcels");
    await expect(createParcel(data)).resolves.toEqual(receipt);
    expect(fetch).toHaveBeenCalledWith("/api/parcels", expect.objectContaining({ method: "POST", body: JSON.stringify(data) }));
  });

  it("honors the server refusing legacy creation once quote confirmation is enabled", async () => {
    vi.stubEnv("VITE_API_URL", "/api");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 410,
      json: async () => ({ message: "Use authenticated delivery quote confirmation." }) }));
    const { createParcel } = await import("./parcels");
    await expect(createParcel({ senderName: "Fixture sender", receiverName: "Fixture recipient", receiverAddress: "Fixture address" }))
      .rejects.toThrow("Use authenticated delivery quote confirmation.");
  });
});
