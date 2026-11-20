import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeClaims, expiresSoon, freshToken } from "./session";

const b64url = (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (claims: Record<string, unknown>) =>
  `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}.signature`;

afterEach(() => { localStorage.clear(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Member 1 session helpers", () => {
  it("reads the claims of a JWT, including the merchant id", () => {
    expect(decodeClaims(jwt({ sub: "merchant-5", role: "MERCHANT", mid: 5 }))).toMatchObject({ role: "MERCHANT", mid: 5 });
  });

  it("returns null for tokens that are not JWTs", () => {
    expect(decodeClaims("dev-token")).toBeNull();
    expect(decodeClaims("a.b.c")).toBeNull();
    expect(decodeClaims(null)).toBeNull();
  });

  it("knows when a token is about to expire", () => {
    const now = Date.parse("2026-11-20T10:00:00Z");
    expect(expiresSoon(jwt({ exp: now / 1000 + 30 }), 60, now)).toBe(true);
    expect(expiresSoon(jwt({ exp: now / 1000 + 600 }), 60, now)).toBe(false);
    expect(expiresSoon("dev-token", 60, now)).toBe(false);
  });

  it("keeps a token that is still valid without calling the server", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const token = jwt({ exp: Date.now() / 1000 + 600 });
    localStorage.setItem("token", token);

    await expect(freshToken()).resolves.toBe(token);
    expect(fetch).not.toHaveBeenCalled();
  });
});
