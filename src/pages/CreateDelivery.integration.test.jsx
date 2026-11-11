import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateDelivery from "./customer/CreateDelivery";
import { requestDeliveryQuote, confirmDelivery } from "../api/delivery";

vi.mock("../api/delivery", async (original) => ({ ...(await original()), requestDeliveryQuote: vi.fn(), confirmDelivery: vi.fn() }));
const fee = { amount: "2.88", currency: "USD" }; // Test fixtures only.
const quote = { quoteId: "fixture-quote", fee, expiresAt: "2099-01-01T00:00:00Z" };
const receipt = { deliveryId: "42", quoteId: quote.quoteId, trackingNumber: "fixture-tracking", status: "CREATED", fee, createdAt: "2026-11-09T12:00:00Z" };
const recipient = { name: "Test Recipient", phone: "077 123 4567" };

async function fill(user) {
  for (const [label, value] of [[/^Pickup address/, "Test pickup"], [/^Drop-off address/, "Test drop-off"],
    [/^Parcel weight/, "0.75"], [/^Length/, "25.5"], [/^Width/, "15"], [/^Height/, "10"],
    [/^Recipient name/, recipient.name], [/^Recipient phone/, recipient.phone]]) {
    await user.type(screen.getByLabelText(label), value);
  }
}
async function review(user) {
  await user.click(screen.getByRole("button", { name: "Review delivery details" }));
  await screen.findByText("USD 2.88");
}
beforeEach(() => {
  vi.resetAllMocks();
  requestDeliveryQuote.mockResolvedValue(quote);
  confirmDelivery.mockResolvedValue(receipt);
});

describe("Connected delivery flow", () => {
  it("requires explicit fee acceptance and shows only a server-confirmed tracking receipt", async () => {
    const user = userEvent.setup(); render(<CreateDelivery />); await fill(user); await review(user);
    const button = screen.getByRole("button", { name: "Confirm delivery" });
    expect(button).toBeDisabled(); expect(confirmDelivery).not.toHaveBeenCalled();
    await user.click(screen.getByRole("checkbox", { name: /I accept/ }));
    await user.click(button);
    expect(await screen.findByRole("heading", { name: "Delivery confirmed" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Delivery confirmed" })).toHaveFocus();
    expect(screen.getByText("fixture-tracking")).toBeVisible();
    expect(confirmDelivery).toHaveBeenCalledExactlyOnceWith(quote.quoteId, recipient, fee);
  });

  it("requires renewed acceptance after a changed price and uses the new quote reference", async () => {
    const revisedQuote = { ...quote, quoteId: "revised-quote", fee: { ...fee, amount: "3.88" } };
    confirmDelivery.mockRejectedValueOnce({ status: 409, code: "QUOTE_PRICE_CHANGED", revisedQuote });
    confirmDelivery.mockResolvedValueOnce({ ...receipt, quoteId: revisedQuote.quoteId, fee: revisedQuote.fee });
    const user = userEvent.setup(); render(<CreateDelivery />); await fill(user); await review(user);
    await user.click(screen.getByRole("checkbox", { name: /I accept/ }));
    await user.click(screen.getByRole("button", { name: "Confirm delivery" }));
    expect(await screen.findByText("USD 3.88")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /I accept/ })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Confirm delivery" })).toBeDisabled();
    expect(confirmDelivery).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("checkbox", { name: /I accept/ }));
    await user.click(screen.getByRole("button", { name: "Confirm delivery" }));
    await screen.findByRole("heading", { name: "Delivery confirmed" });
    expect(confirmDelivery).toHaveBeenLastCalledWith(revisedQuote.quoteId, recipient, revisedQuote.fee);
  });

  it.each([0, undefined])("keeps an uncertain creation frozen for status %s and retries the identical request", async (status) => {
    confirmDelivery.mockRejectedValueOnce({ status, message: "Fixture network failure" });
    const user = userEvent.setup(); render(<CreateDelivery />); await fill(user); await review(user);
    await user.click(screen.getByRole("checkbox", { name: /I accept/ }));
    await user.click(screen.getByRole("button", { name: "Confirm delivery" }));
    const retry = await screen.findByRole("button", { name: "Retry confirmation" });
    expect(screen.getByRole("button", { name: "Back to edit details" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Request new fee" })).not.toBeInTheDocument();
    await user.click(retry);
    await screen.findByRole("heading", { name: "Delivery confirmed" });
    expect(confirmDelivery.mock.calls[0]).toEqual(confirmDelivery.mock.calls[1]);
  });

  it("ignores a late quote response after the user returns to edit", async () => {
    let resolve; requestDeliveryQuote.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const user = userEvent.setup(); render(<CreateDelivery />); await fill(user);
    await user.click(screen.getByRole("button", { name: "Review delivery details" }));
    await user.click(screen.getByRole("button", { name: "Back to edit details" }));
    resolve(quote);
    await waitFor(() => expect(screen.queryByText("USD 2.88")).not.toBeInTheDocument());
    expect(screen.queryByRole("checkbox", { name: /I accept/ })).not.toBeInTheDocument();
  });

  it("does not submit an expired quote", async () => {
    requestDeliveryQuote.mockResolvedValue({ ...quote, expiresAt: "2000-01-01T00:00:00Z" });
    const user = userEvent.setup(); render(<CreateDelivery />); await fill(user); await review(user);
    expect(screen.getByText(/Quote expired/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm delivery" })).toBeDisabled();
    expect(confirmDelivery).not.toHaveBeenCalled();
  });

  it("does not send a second confirmation while the first is pending", async () => {
    let resolve; confirmDelivery.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const user = userEvent.setup(); render(<CreateDelivery />); await fill(user); await review(user);
    await user.click(screen.getByRole("checkbox", { name: /I accept/ }));
    await user.dblClick(screen.getByRole("button", { name: "Confirm delivery" }));
    expect(confirmDelivery).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Confirming delivery..." })).toBeDisabled();
    resolve(receipt);
    await screen.findByRole("heading", { name: "Delivery confirmed" });
  });

  it("maps server validation errors to the original fields without discarding entries", async () => {
    requestDeliveryQuote.mockRejectedValue({ status: 422, message: "Check the fields", fields: [
      { field: "parcel.weightKg", message: "Fixture weight validation" },
    ] });
    const user = userEvent.setup(); render(<CreateDelivery />); await fill(user);
    await user.click(screen.getByRole("button", { name: "Review delivery details" }));
    expect(await screen.findByText("Fixture weight validation")).toBeVisible();
    expect(screen.getByLabelText(/^Parcel weight/)).toHaveValue(0.75);
    expect(screen.getByLabelText(/^Parcel weight/)).toHaveFocus();
    expect(confirmDelivery).not.toHaveBeenCalled();
  });
});
