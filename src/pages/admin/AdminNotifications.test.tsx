import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../api/merchants", () => ({ listMerchantApplications: vi.fn().mockResolvedValue([{ id: "1" }, { id: "2" }]) }));
vi.mock("../../api/notifications", () => ({ notificationApi: { failed: vi.fn().mockResolvedValue([]) } }));
vi.mock("./adminData", () => ({ getReportSummary: vi.fn().mockRejectedValue(new Error("down")) }));

import AdminNotifications from "./AdminNotifications";

describe("Admin notifications", () => {
  it("shows what needs attention and links to the right page", async () => {
    render(<MemoryRouter><AdminNotifications /></MemoryRouter>);
    expect(await screen.findByText("1 thing needs your attention.")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("All merchant updates were delivered.")).toBeTruthy();
    expect(screen.getByText("Could not load this right now.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Review" }).getAttribute("href")).toBe("/admin/merchant-approvals");
  });
});
