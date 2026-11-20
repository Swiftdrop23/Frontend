import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CourierLiveMap from "./CourierLiveMap";
import { candidateQueries } from "../../components/map/geo";
import { navigationUrl, telUrl } from "../../api/liveMap";

const customerView = vi.fn();
vi.mock("../../api/liveMap", async (original) => ({
  ...(await original<typeof import("../../api/liveMap")>()),
  liveMapApi: { customerView: (tn: string) => customerView(tn) },
}));
vi.mock("../../components/map/DeliveryMap", () => ({
  default: (props: { courier?: unknown }) => <div data-testid="map" data-courier={props.courier ? "yes" : "no"} />,
}));

describe("Pickup trip live tracking (Member 10)", () => {
  afterEach(cleanup);

  it("shows the courier, vehicle and live map once the courier started the pickup", async () => {
    customerView.mockResolvedValueOnce({
      trackingNumber: "SD-1", live: true, status: "PENDING", message: "Kamal Silva is on the way to pick up your parcel.",
      pickupAddress: "12 Galle Road, Colombo 03", pickup: { lat: 6.9, lng: 79.85 }, tripStartedAt: new Date().toISOString(),
      courier: { name: "Kamal Silva", phone: "0771234567", vehicleType: "Motorbike", vehicleNumber: "BAB-1234" },
      position: { latitude: 6.91, longitude: 79.86, accuracyM: 8, updatedAt: new Date().toISOString() },
    });
    render(<CourierLiveMap trackingNumber="SD-1" />);

    expect(await screen.findByText("Courier on the way")).toBeTruthy();
    expect(screen.getByText("BAB-1234")).toBeTruthy();
    expect(screen.getByText("Motorbike")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Call courier" }).getAttribute("href")).toBe("tel:0771234567");
    expect(screen.getByTestId("map").dataset.courier).toBe("yes");
  });

  it("shows no map or courier details before the pickup starts", async () => {
    customerView.mockResolvedValueOnce({
      trackingNumber: "SD-1", live: false, status: "PENDING",
      message: "A courier is assigned. You will get a notification and can track them live when they start coming to pick up your parcel.",
      pickupAddress: "a", pickup: null, tripStartedAt: null, courier: null, position: null,
    });
    render(<CourierLiveMap trackingNumber="SD-1" />);

    expect(await screen.findByText(/You will get a notification/)).toBeTruthy();
    expect(screen.queryByTestId("map")).toBeNull();
    expect(screen.queryByText("Call courier")).toBeNull();
  });

  it("builds navigation, phone and geocoding helpers", () => {
    expect(navigationUrl("No.68, Akkara 45, Thalpotha, Polonnaruwa")).toContain("destination=Thalpotha%2C%20Polonnaruwa%2C%20Sri%20Lanka");
    expect(navigationUrl("x", { lat: 7.94, lng: 81.0 })).toContain("destination=7.94%2C81");
    expect(telUrl("077 123 4567")).toBe("tel:0771234567");
    expect(candidateQueries("12 Galle Road, Colombo 03")).toEqual(["12 Galle Road, Colombo 03", "Colombo 03"]);
  });
});
