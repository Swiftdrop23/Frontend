import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import TrackParcel from "./public/TrackParcel";
import DeliveryHistory from "./customer/DeliveryHistory";
import DeliveryDetails from "./customer/DeliveryDetails";
import DeliveryReceipt from "./customer/DeliveryReceipt";

// These run against the mock data in src/api/tracking.ts (VITE_API_URL is empty in tests).

function showPublic(path = "/track") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/track" element={<TrackParcel />} />
        <Route path="/track/:trackingNumber" element={<TrackParcel />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

function showCustomer(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/customer/delivery-history" element={<DeliveryHistory />} />
        <Route path="/customer/delivery-history/:trackingNumber" element={<DeliveryDetails />} />
        <Route path="/customer/delivery-history/:trackingNumber/receipt" element={<DeliveryReceipt />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe("Public tracking page", () => {
  it("shows the status and timeline for a known tracking number, ignoring case", async () => {
    const user = showPublic();
    await user.type(screen.getByLabelText("Tracking number"), "sd-000123");
    await user.click(screen.getByRole("button", { name: "Track" }));

    expect(await screen.findByText("SD-000123")).toBeVisible();
    const timeline = screen.getByRole("list", { name: "Delivery timeline" });
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(5);
    expect(within(timeline).getByText("In Transit").closest("li")).toHaveAttribute("aria-current", "step");
    expect(within(timeline).getAllByText("pending")).toHaveLength(2);
    // Public page never shows personal details.
    expect(screen.queryByText("Nimal P.")).not.toBeInTheDocument();
    expect(screen.queryByText(/Colombo/)).not.toBeInTheDocument();
  });

  it("shows the not-found card for an unknown number", async () => {
    showPublic("/track/SD-999999");
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not find that parcel");
    expect(screen.getByRole("alert")).toHaveTextContent("Check the tracking number and try again.");
  });

  it("asks for a number when the box is empty", async () => {
    const user = showPublic();
    await user.click(screen.getByRole("button", { name: "Track" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a tracking number.");
  });
});

describe("Delivery history", () => {
  it("lists all deliveries and filters by status", async () => {
    const user = showCustomer("/customer/delivery-history");
    expect(await screen.findByText("SD-000123")).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(5); // header + 4

    await user.click(screen.getByRole("button", { name: "Delivered" }));
    expect(await screen.findByText("SD-000099")).toBeVisible();
    expect(screen.queryByText("SD-000123")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delivered" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Failed" }));
    expect(await screen.findByText("SD-000087")).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("opens the receipt from the list", async () => {
    const user = showCustomer("/customer/delivery-history");
    await user.click(await screen.findByRole("button", { name: "Receipt for SD-000099" }));
    expect(await screen.findByRole("heading", { name: "SwiftDrop receipt" })).toBeVisible();
    expect(screen.getByText("LKR 950.00")).toBeVisible();
    expect(screen.getByText("Kamala S.")).toBeVisible();
  });
});

describe("Delivery details", () => {
  it("shows details, full timeline and proof for a delivered parcel", async () => {
    showCustomer("/customer/delivery-history/SD-000099");
    expect(await screen.findByRole("heading", { name: "Details" })).toBeVisible();
    expect(screen.getByText("Galle")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Proof of delivery" })).toBeVisible();
    const timeline = screen.getByRole("list", { name: "Delivery timeline" });
    expect(within(timeline).queryByText("pending")).not.toBeInTheDocument();
  });

  it("shows a failed step for a failed parcel and no proof card", async () => {
    showCustomer("/customer/delivery-history/SD-000087");
    const timeline = await screen.findByRole("list", { name: "Delivery timeline" });
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(6);
    expect(within(timeline).getByText("Failed").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.queryByRole("heading", { name: "Proof of delivery" })).not.toBeInTheDocument();
  });

  it("shows not found for a parcel the customer does not own", async () => {
    showCustomer("/customer/delivery-history/SD-123456");
    expect(await screen.findByText("Delivery not found")).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to history" })).toHaveAttribute("href", "/customer/delivery-history");
  });
});
