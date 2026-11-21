import { describe, expect, it } from "vitest";
import { rowStats } from "./DeliveryReport";

describe("Delivery report", () => {
  it("does not count parcels on their way as failures", () => {
    expect(rowStats({ date: "2026-11-21", total: 10, delivered: 0, failed: 0, status: "Delivered" })).toEqual({ inProgress: 10, rate: "–" });
    expect(rowStats({ date: "2026-11-20", total: 9, delivered: 2, failed: 1, status: "Delivered" })).toEqual({ inProgress: 6, rate: "67%" });
  });
});
