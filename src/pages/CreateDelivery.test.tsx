import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreateDelivery from "./customer/CreateDelivery";

const validDetails = [
  [/^Pickup address/i, "12 Flower Road, Colombo 07"],
  [/^Drop-off address/i, "34 Temple Road, Kandy"],
  [/^Parcel weight/i, "0.75"],
  [/^Length \(cm\)/i, "25.5"],
  [/^Width \(cm\)/i, "15"],
  [/^Height \(cm\)/i, "10"],
  [/^Recipient name/i, "Test Recipient"],
  [/^Recipient phone/i, "077 123 4567"],
];

async function fillDetails(user) {
  for (const [label, value] of validDetails) {
    await user.type(screen.getByLabelText(label), value);
  }
}

async function review(user) {
  await user.click(screen.getByRole("button", { name: "Review delivery details" }));
}

function expectFieldError(label, message) {
  const input = screen.getByLabelText(label);
  expect(input).toBeInvalid();
  expect(input).toHaveAccessibleDescription(expect.stringContaining(message));
  expect(screen.getByText(message)).toBeVisible();
}

afterEach(() => vi.unstubAllGlobals());

describe("Customer delivery request", () => {
  it("explains every missing field and focuses the first error", async () => {
    const user = userEvent.setup();
    render(<CreateDelivery />);

    await review(user);

    expect(screen.getByRole("alert")).toHaveTextContent("Please correct the highlighted fields");
    for (const [label, message] of [
      [/^Pickup address/i, "Pickup address is required."],
      [/^Drop-off address/i, "Drop-off address is required."],
      [/^Parcel weight/i, "Enter a weight greater than zero in kg."],
      [/^Length \(cm\)/i, "Enter a length greater than zero in cm."],
      [/^Width \(cm\)/i, "Enter a width greater than zero in cm."],
      [/^Height \(cm\)/i, "Enter a height greater than zero in cm."],
      [/^Recipient name/i, "Recipient name is required."],
      [/^Recipient phone/i, "Enter a 10-digit phone number starting with 0, e.g. 0771234567. Spaces are allowed."],
    ]) expectFieldError(label, message);
    expect(screen.getByLabelText(/^Pickup address/i)).toHaveFocus();
    expect(screen.queryByRole("heading", { name: "Review your delivery details" })).not.toBeInTheDocument();
  });

  it("rejects whitespace-only addresses and names", async () => {
    const user = userEvent.setup();
    render(<CreateDelivery />);
    await fillDetails(user);
    for (const label of [/^Pickup address/i, /^Drop-off address/i, /^Recipient name/i]) {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), "   ");
    }

    await review(user);

    expectFieldError(/^Pickup address/i, "Pickup address is required.");
    expectFieldError(/^Drop-off address/i, "Drop-off address is required.");
    expectFieldError(/^Recipient name/i, "Recipient name is required.");
  });

  it.each([
    ["zero weight", /^Parcel weight/i, "0", "Enter a weight greater than zero in kg."],
    ["negative weight", /^Parcel weight/i, "-0.5", "Enter a weight greater than zero in kg."],
    ["nonnumeric weight", /^Parcel weight/i, "abc", "Enter a weight greater than zero in kg."],
    ["zero length", /^Length \(cm\)/i, "0", "Enter a length greater than zero in cm."],
    ["negative width", /^Width \(cm\)/i, "-2", "Enter a width greater than zero in cm."],
    ["zero height", /^Height \(cm\)/i, "0", "Enter a height greater than zero in cm."],
  ])("rejects %s instead of showing review", async (_case, label, value, message) => {
    const user = userEvent.setup();
    render(<CreateDelivery />);
    await fillDetails(user);
    await user.clear(screen.getByLabelText(label));
    await user.type(screen.getByLabelText(label), value);

    await review(user);

    expectFieldError(label, message);
    expect(screen.getByLabelText(label)).toHaveFocus();
    expect(screen.queryByRole("heading", { name: "Review your delivery details" })).not.toBeInTheDocument();
  });

  it.each(["771234567", "07712345678", "abcdefghij", "+94771234567"])("rejects invalid recipient phone %s", async (phone) => {
    const user = userEvent.setup();
    render(<CreateDelivery />);
    await fillDetails(user);
    await user.clear(screen.getByLabelText(/^Recipient phone/i));
    await user.type(screen.getByLabelText(/^Recipient phone/i), phone);

    await review(user);

    expectFieldError(/^Recipient phone/i, "Enter a 10-digit phone number starting with 0, e.g. 0771234567. Spaces are allowed.");
    expect(screen.getByLabelText(/^Recipient phone/i)).toHaveFocus();
  });

  it("focuses parcel errors before a later missing recipient name", async () => {
    const user = userEvent.setup();
    render(<CreateDelivery />);
    await user.type(screen.getByLabelText(/^Pickup address/i), "12 Flower Road");
    await user.type(screen.getByLabelText(/^Drop-off address/i), "34 Temple Road");

    await review(user);

    expect(screen.getByLabelText(/^Parcel weight/i)).toHaveFocus();
    expectFieldError(/^Parcel weight/i, "Enter a weight greater than zero in kg.");
  });

  it("reviews valid details using the keyboard, including decimal measurements and a spaced phone number", async () => {
    const user = userEvent.setup();
    render(<CreateDelivery />);
    await fillDetails(user);

    // Tab from the last field to the review button and activate it.
    await user.tab();
    expect(screen.getByRole("button", { name: "Review delivery details" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("heading", { name: "Review your delivery details" })).toHaveFocus();
    const summary = within(screen.getByRole("region", { name: "Review your delivery details" }));
    for (const value of ["12 Flower Road, Colombo 07", "34 Temple Road, Kandy", "0.75 kg", "25.5 × 15 × 10 cm", "Test Recipient", "077 123 4567"]) {
      expect(summary.getByText(value, { exact: true })).toBeVisible();
    }
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves every value when editing and reviews the updated details", async () => {
    const user = userEvent.setup();
    render(<CreateDelivery />);
    await fillDetails(user);
    await review(user);

    await user.click(screen.getByRole("button", { name: "Back to edit details" }));

    expect(screen.getByRole("heading", { name: "Where are you sending your parcel?" })).toHaveFocus();
    for (const [label, value] of validDetails) {
      const field = screen.getByLabelText(label);
      expect(field).toHaveValue(field.type === "number" ? Number(value) : value);
    }
    for (const [label, value] of [
      [/^Pickup address/i, "56 Updated Road, Galle"],
      [/^Parcel weight/i, "1.5"],
      [/^Recipient phone/i, "0712345678"],
    ]) {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), value);
    }

    await review(user);

    expect(screen.getByText("56 Updated Road, Galle", { exact: true })).toBeVisible();
    expect(screen.getByText("1.5 kg", { exact: true })).toBeVisible();
    expect(screen.getByText("0712345678", { exact: true })).toBeVisible();
    expect(screen.queryByText("12 Flower Road, Colombo 07", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("0.75 kg", { exact: true })).not.toBeInTheDocument();
  });

  it("keeps estimates and submission unavailable throughout review without inventing a price or placing an order", async () => {
    const user = userEvent.setup();
    const fetch = vi.fn().mockRejectedValue(new Error("Backend unavailable"));
    vi.stubGlobal("fetch", fetch);
    render(<CreateDelivery />);

    async function expectUnavailable() {
      const estimate = screen.getByRole("complementary", { name: "Delivery fee" });
      expect(within(estimate).getByText("Estimate unavailable")).toBeVisible();
      expect(within(estimate).getByText(/no price is available/i)).toBeVisible();
      expect(within(estimate).getByRole("heading", { name: "Order submission unavailable" })).toBeVisible();
      expect(within(estimate).getByText(/No order has been placed\./)).toBeVisible();
      expect(estimate).not.toHaveTextContent(/(?:LKR|Rs\.?|USD|\$|€|£)\s*\d/i);
      const submit = within(estimate).getByRole("button", { name: "Place delivery request (unavailable)" });
      expect(submit).toBeDisabled();
      await user.click(submit);
      expect(screen.queryByText(/delivery (?:placed|confirmed)|order placed successfully|tracking number/i)).not.toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    }

    await expectUnavailable();
    await fillDetails(user);
    await review(user);
    await expectUnavailable();
    expect(screen.getByRole("heading", { name: "Review your delivery details" })).toBeVisible();
  });
});
