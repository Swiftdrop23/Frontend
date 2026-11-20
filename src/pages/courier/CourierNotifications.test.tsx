import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CourierNotifications from "./CourierNotifications";

const stop = (over: object) => ({
  deliveryId: 1, version: 0, trackingNumber: "SD-1", status: "PENDING", senderName: "Nimal", senderPhone: null,
  pickupAddress: "12 Main Street, Kandy", pickup: null, recipientName: "Kamala", recipientPhone: null,
  dropoffAddress: "45 Lake Road, Galle", dropoff: null, tripActive: false, ...over,
});

vi.mock("../../api/liveMap", () => ({
  liveMapApi: {
    stops: vi.fn(async () => [
      stop({ deliveryId: 2, trackingNumber: "SD-2", status: "PICKED_UP" }),
      stop({ deliveryId: 1, trackingNumber: "SD-1" }),
    ]),
  },
}));

describe("Courier notifications (Member 10)", () => {
  it("shows new pickups first, then parcels to deliver", async () => {
    render(<MemoryRouter><CourierNotifications /></MemoryRouter>);
    const pickup = await screen.findByText("New pickup assigned to you");
    expect(pickup.closest("a")?.getAttribute("href")).toBe("/courier/route-map");
    const titles = screen.getAllByRole("listitem").map((li) => li.querySelector("strong")?.textContent);
    expect(titles).toEqual(["New pickup assigned to you", "Ready to deliver"]);
  });
});
