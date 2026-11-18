import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CancelDelivery from "./customer/CancelDelivery";
import { lookupDeliveryForCancellation, cancelDelivery } from "../api/delivery";

vi.mock("../api/delivery", async (original) => ({ ...(await original()), lookupDeliveryForCancellation: vi.fn(), cancelDelivery: vi.fn() }));
const delivery = { trackingNumber: "fixture-tracking", status: "CREATED" };
beforeEach(() => {
  vi.resetAllMocks();
  lookupDeliveryForCancellation.mockResolvedValue(delivery);
  cancelDelivery.mockResolvedValue({ ...delivery, status: "CANCELLED" });
});
function show(path = "/customer/cancel-delivery") {
  render(<MemoryRouter initialEntries={[path]}><CancelDelivery /></MemoryRouter>);
  return userEvent.setup();
}
async function find(user) {
  await user.type(screen.getByLabelText("Tracking number"), delivery.trackingNumber);
  await user.click(screen.getByRole("button", { name: "Find my delivery" }));
  await screen.findByText("Status: CREATED");
}

describe("Cancel Delivery", () => {
  it("also permits explicit cancellation of an owned PENDING delivery", async () => {
    lookupDeliveryForCancellation.mockResolvedValue({ ...delivery, status: "PENDING" });
    const user = show("/customer/cancel-delivery?tracking=fixture-tracking");
    await user.click(screen.getByRole("button", { name: "Find my delivery" }));
    await screen.findByText("Status: PENDING");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Delivery cancelled");
  });

  it("requires a tracking reference and explicit review before cancelling", async () => {
    const user = show();
    await user.click(screen.getByRole("button", { name: "Find my delivery" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a tracking number");
    expect(screen.getByLabelText("Tracking number")).toHaveFocus();
    expect(screen.getByLabelText("Tracking number")).toBeInvalid();
    expect(screen.getByLabelText("Tracking number")).toHaveAccessibleDescription(expect.stringContaining("Enter a tracking number"));
    expect(lookupDeliveryForCancellation).not.toHaveBeenCalled();
    await find(user);
    expect(screen.getByRole("heading", { name: "Review this delivery" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Confirm cancellation" })).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Delivery cancelled");
    expect(cancelDelivery).toHaveBeenCalledExactlyOnceWith(delivery.trackingNumber);
    expect(screen.queryByRole("button", { name: "Confirm cancellation" })).not.toBeInTheDocument();
  });

  it.each(["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"])("does not offer cancellation for %s", async (status) => {
    lookupDeliveryForCancellation.mockResolvedValue({ ...delivery, status });
    const user = show("/customer/cancel-delivery?tracking=fixture-tracking");
    await user.click(screen.getByRole("button", { name: "Find my delivery" }));
    await screen.findByText(`Status: ${status}`);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(cancelDelivery).not.toHaveBeenCalled();
  });

  it("recognizes an already cancelled delivery without issuing another write", async () => {
    lookupDeliveryForCancellation.mockResolvedValue({ ...delivery, status: "CANCELLED" });
    const user = show("/customer/cancel-delivery?tracking=fixture-tracking");
    await user.click(screen.getByRole("button", { name: "Find my delivery" }));
    expect(await screen.findByRole("status")).toHaveTextContent("No further cancellation is needed");
    expect(cancelDelivery).not.toHaveBeenCalled();
  });

  it("handles a pickup occurring after lookup without claiming cancellation", async () => {
    cancelDelivery.mockRejectedValue({ status: 409, code: "DELIVERY_NOT_CANCELLABLE" });
    const user = show(); await find(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("can no longer be cancelled");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("freezes an uncertain cancellation and retries only its original tracking reference", async () => {
    cancelDelivery.mockRejectedValueOnce({ status: 0 });
    const user = show(); await find(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("outcome is unknown");
    expect(screen.getByLabelText("Tracking number")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Find my delivery" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Retry cancellation" }));
    await screen.findByRole("status");
    expect(cancelDelivery.mock.calls).toEqual([[delivery.trackingNumber], [delivery.trackingNumber]]);
  });

  it.each([401, 403, 404, 503])("never treats lookup refusal %s as ownership or success", async (status) => {
    lookupDeliveryForCancellation.mockRejectedValue({ status, message: "Lookup unavailable." });
    const user = show("/customer/cancel-delivery?tracking=fixture-tracking");
    await user.click(screen.getByRole("button", { name: "Find my delivery" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(cancelDelivery).not.toHaveBeenCalled();
  });

  it("ignores a late lookup after the tracking reference changes", async () => {
    let resolve;
    lookupDeliveryForCancellation.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const user = show("/customer/cancel-delivery?tracking=fixture-tracking");
    await user.click(screen.getByRole("button", { name: "Find my delivery" }));
    await user.type(screen.getByLabelText("Tracking number"), "-changed");
    await act(async () => resolve(delivery));
    expect(screen.queryByText("Status: CREATED")).not.toBeInTheDocument();
  });

  it("prevents double submission while cancellation is pending", async () => {
    let resolve;
    cancelDelivery.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const user = show(); await find(user);
    await user.click(screen.getByRole("checkbox"));
    await user.dblClick(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(cancelDelivery).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Tracking number")).toBeDisabled();
    await act(async () => resolve({ ...delivery, status: "CANCELLED" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Delivery cancelled");
  });
});
