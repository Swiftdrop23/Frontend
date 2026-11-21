import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("./adminData", () => ({
  getReportSummary: vi.fn().mockResolvedValue({ total: 19, delivered: 2, failed: 0, successRate: 11, daily: [{ date: "2026-11-21", total: 10, delivered: 2, failed: 0, status: "Delivered" }] }),
}));

import Reports, { breakdown } from "./Reports";

describe("Admin reports", () => {
  it("counts parcels still on their way as in progress, not failed", () => {
    const b = breakdown({ total: 19, delivered: 2, failed: 0, successRate: 11, daily: [] });
    expect(b.inProgress).toBe(17);
    expect(b.successRate).toBe(100);
    expect(breakdown({ total: 3, delivered: 0, failed: 0, successRate: 0, daily: [] }).successRate).toBeNull();
  });

  it("shows delivered, in progress and failed separately", async () => {
    render(<MemoryRouter><Reports /></MemoryRouter>);
    expect(await screen.findByText("Where parcels are now")).toBeTruthy();
    expect(screen.getAllByText("In progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("17").length).toBe(2);
    expect(screen.queryByText(/89%/)).toBeNull();
  });
});
