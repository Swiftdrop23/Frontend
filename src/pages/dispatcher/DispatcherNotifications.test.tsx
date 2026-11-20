import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DispatcherNotifications from "./DispatcherNotifications";

vi.mock("../../api/dispatcher", () => ({
  getUnassignedParcels: vi.fn(async () => [{
    id: 41, trackingNumber: "SD-4B851D21", senderName: "A", receiverName: "B", receiverAddress: "Colombo",
    routeSummary: "Colombo → Colombo", weightLabel: "1 kg", zoneLabel: "Colombo", status: "CREATED",
    createdAt: "2026-11-20T10:00:00Z",
  }]),
  getAllDispatcherParcels: vi.fn(async () => [{
    id: 7, trackingNumber: "SD-FAILED01", senderName: "A", receiverName: "B", receiverAddress: "Kandy",
    routeSummary: "Colombo → Kandy", status: "FAILED", assignedCourierId: 1, assignedCourierName: "Demo Courier",
    createdAt: "2026-11-19T10:00:00Z",
  }]),
}));

describe("Dispatcher notifications (Member 10)", () => {
  it("lists parcels waiting for a courier and failed deliveries", async () => {
    render(<MemoryRouter><DispatcherNotifications /></MemoryRouter>);
    const waiting = await screen.findByText("New parcel waiting for a courier");
    expect(waiting.closest("a")?.getAttribute("href")).toBe("/dispatcher/unassigned-parcels/41/assign");
    expect(screen.getByText("Delivery failed")).toBeTruthy();
    expect(screen.getByText(/SD-FAILED01 · Kandy · Demo Courier/)).toBeTruthy();
  });
});
