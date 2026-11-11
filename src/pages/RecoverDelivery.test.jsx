import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecoverDelivery from "./customer/RecoverDelivery";
import { lookupDeliveryReceipt, lookupDeliveryForCancellation, confirmDelivery } from "../api/delivery";

vi.mock("../api/delivery", async original => ({ ...(await original()), lookupDeliveryReceipt: vi.fn(),
  lookupDeliveryForCancellation: vi.fn(), confirmDelivery: vi.fn() }));
const receipt = { deliveryId: "42", quoteId: "fixture-quote", trackingNumber: "SD-FIXTURE", status: "CREATED",
  fee: { amount: "2.88", currency: "USD" }, createdAt: "2026-11-09T12:00:00Z" };
beforeEach(() => {
  vi.resetAllMocks(); localStorage.clear(); sessionStorage.clear();
  lookupDeliveryReceipt.mockResolvedValue(receipt);
  lookupDeliveryForCancellation.mockResolvedValue({ trackingNumber: receipt.trackingNumber, status: "CANCELLED" });
});
function show(path = "/customer/recover-delivery?quote=fixture-quote") {
  render(<MemoryRouter initialEntries={[path]}><RecoverDelivery /></MemoryRouter>);
  return userEvent.setup();
}
async function find(user) { await user.click(screen.getByRole("button", { name: "Find saved confirmation" })); }

describe("Owned confirmation recovery", () => {
  it("requires an explicit reference and does not fetch merely from a query parameter", async () => {
    const user = show("/customer/recover-delivery");
    expect(lookupDeliveryReceipt).not.toHaveBeenCalled();
    await find(user);
    expect(screen.getByRole("status")).toHaveTextContent("Enter your quote reference");
    expect(lookupDeliveryReceipt).not.toHaveBeenCalled();
  });
  it("shows a server receipt and current CANCELLED state without interpreting CREATED as current", async () => {
    const user = show(); await find(user);
    expect(await screen.findByRole("heading", { name: "Saved delivery confirmation" })).toHaveFocus();
    expect(await screen.findByText("Cancelled")).toBeVisible();
    expect(screen.getByText("USD 2.88")).toBeVisible();
    expect(screen.queryByRole("link", { name: "View cancellation options" })).not.toBeInTheDocument();
    expect(confirmDelivery).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
  });
  it("offers cancellation options only after verifying a pre-pickup state", async () => {
    lookupDeliveryForCancellation.mockResolvedValue({ trackingNumber: receipt.trackingNumber, status: "PENDING" });
    const user = show(); await find(user);
    expect(await screen.findByRole("link", { name: "View cancellation options" }))
      .toHaveAttribute("href", "/customer/cancel-delivery?tracking=SD-FIXTURE");
  });
  it("retains a verified receipt but labels current status unverified when that lookup fails", async () => {
    lookupDeliveryForCancellation.mockRejectedValue({ status: 503 });
    const user = show(); await find(user);
    expect(await screen.findByText("Not verified")).toBeVisible();
    expect(await screen.findByRole("status")).toHaveTextContent("current delivery status could not be checked");
    expect(screen.getByText(receipt.trackingNumber)).toBeVisible();
    expect(screen.queryByRole("link", { name: "View cancellation options" })).not.toBeInTheDocument();
  });
  it("does not infer a failed booking or submit a replacement from an owned/missing 404", async () => {
    lookupDeliveryReceipt.mockRejectedValue({ status: 404 });
    const user = show(); await find(user);
    expect(await screen.findByRole("status")).toHaveTextContent("does not prove an earlier submission failed");
    expect(confirmDelivery).not.toHaveBeenCalled(); expect(lookupDeliveryForCancellation).not.toHaveBeenCalled();
  });
  it("discards a late receipt after the reference is edited", async () => {
    let resolve;
    lookupDeliveryReceipt.mockReturnValue(new Promise(done => { resolve = done; }));
    const user = show(); await find(user);
    const signal = lookupDeliveryReceipt.mock.calls[0][1];
    await user.type(screen.getByLabelText("Quote reference"), "-changed");
    expect(signal.aborted).toBe(true);
    await act(async () => { resolve(receipt); });
    expect(screen.queryByRole("heading", { name: "Saved delivery confirmation" })).not.toBeInTheDocument();
    expect(lookupDeliveryForCancellation).not.toHaveBeenCalled();
  });
  it("discards a late current status after the reference changes", async () => {
    let resolve;
    lookupDeliveryForCancellation.mockReturnValue(new Promise(done => { resolve = done; }));
    const user = show(); await find(user); await screen.findByText(receipt.trackingNumber);
    await user.type(screen.getByLabelText("Quote reference"), "-changed");
    await act(async () => { resolve({ trackingNumber: receipt.trackingNumber, status: "PENDING" }); });
    expect(screen.queryByRole("link", { name: "View cancellation options" })).not.toBeInTheDocument();
    expect(screen.queryByText(receipt.trackingNumber)).not.toBeInTheDocument();
  });
  it("leaves missing real authentication explicitly unavailable", async () => {
    lookupDeliveryReceipt.mockRejectedValue({ status: 503, message: "Customer authentication is not connected yet." });
    const user = show(); await find(user);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("unavailable"));
    expect(confirmDelivery).not.toHaveBeenCalled();
  });
});
