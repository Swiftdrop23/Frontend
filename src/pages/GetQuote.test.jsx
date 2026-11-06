import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import GetQuote from "./GetQuote";

function renderQuote() {
  return render(<MemoryRouter><GetQuote /></MemoryRouter>);
}

async function fillQuote(user, weight = "0.75") {
  await user.type(screen.getByLabelText(/^Pickup city/), "Colombo");
  await user.type(screen.getByLabelText(/^Drop-off city/), "Kandy");
  await user.type(screen.getByLabelText(/^Parcel weight/), weight);
}

afterEach(() => vi.unstubAllGlobals());

describe("Public quote form", () => {
  it("explains missing inputs, associates errors, and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    renderQuote();
    await user.click(screen.getByRole("button", { name: "Request estimate" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please correct the highlighted fields");
    for (const [label, message] of [
      [/^Pickup city/, "Pickup city is required."],
      [/^Drop-off city/, "Drop-off city is required."],
      [/^Parcel weight/, "Parcel weight is required."],
    ]) {
      expect(screen.getByLabelText(label)).toBeInvalid();
      expect(screen.getByLabelText(label)).toHaveAccessibleDescription(expect.stringContaining(message));
    }
    expect(screen.getByLabelText(/^Pickup city/)).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it.each(["   ", "123", "---"])("rejects missing or invalid city names: %j", async (city) => {
    const user = userEvent.setup();
    renderQuote();
    await fillQuote(user);
    for (const label of [/^Pickup city/, /^Drop-off city/]) {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), city);
    }
    await user.click(screen.getByRole("button", { name: "Request estimate" }));

    expect(screen.getByLabelText(/^Pickup city/)).toBeInvalid();
    expect(screen.getByLabelText(/^Drop-off city/)).toBeInvalid();
    expect(screen.getByLabelText(/^Pickup city/)).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it.each(["0", "-0.5", "abc", "1e309"])("rejects invalid weight %s", async (weight) => {
    const user = userEvent.setup();
    renderQuote();
    await fillQuote(user, weight);
    await user.click(screen.getByRole("button", { name: "Request estimate" }));

    expect(screen.getByLabelText(/^Parcel weight/)).toBeInvalid();
    expect(screen.getByLabelText(/^Parcel weight/)).toHaveAccessibleDescription(expect.stringContaining(
      Number.isFinite(Number(weight)) ? "Enter a weight greater than zero in kg." : "Parcel weight is required."
    ));
    expect(screen.getByLabelText(/^Parcel weight/)).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("supports keyboard submission and announces unavailability without making a request or inventing a fee", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const user = userEvent.setup();
    renderQuote();
    expect(screen.getByText(/Fee estimates are currently unavailable/)).toBeVisible();
    await fillQuote(user);
    await user.tab();
    expect(screen.getByRole("button", { name: "Request estimate" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("status")).toHaveTextContent("Estimate unavailable");
    expect(screen.getByRole("status")).toHaveTextContent("No delivery fee has been calculated and no delivery has been placed.");
    expect(screen.getByRole("status")).not.toHaveTextContent(/(?:LKR|Rs\.?|USD|\$)\s*\d/i);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Pickup city/)).toHaveValue("Colombo");
    expect(screen.getByLabelText(/^Drop-off city/)).toHaveValue("Kandy");
    expect(screen.getByLabelText(/^Parcel weight/)).toHaveValue(0.75);
    await user.tab();
    expect(screen.getByRole("link", { name: "Log in to place a delivery" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Log in to place a delivery" })).toHaveAttribute("href", "/login");
  });

  it("clears corrected errors and resets the request state after editing", async () => {
    const user = userEvent.setup();
    renderQuote();
    await user.click(screen.getByRole("button", { name: "Request estimate" }));
    await fillQuote(user);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Request estimate" }));
    expect(screen.getByRole("status")).toHaveTextContent("Estimate unavailable");

    await user.clear(screen.getByLabelText(/^Drop-off city/));
    await user.type(screen.getByLabelText(/^Drop-off city/), "Sri Jayawardenepura Kotte");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await user.click(screen.getByRole("button", { name: "Request estimate" }));
    expect(screen.getByRole("status")).toHaveTextContent("Estimate unavailable");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("accepts international city names and supports the complete keyboard-only flow", async () => {
    const user = userEvent.setup();
    renderQuote();
    for (const [label, value] of [
      [/^Pickup city/, "  ශ්‍රී ජයවර්ධනපුර කෝට්ටේ  "],
      [/^Drop-off city/, "Saint-Denis"],
      [/^Parcel weight/, "1.25"],
    ]) {
      await user.tab();
      expect(screen.getByLabelText(label)).toHaveFocus();
      await user.keyboard(value);
    }
    // Enter in the final input submits the form without a pointer interaction.
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("Estimate unavailable");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole("button", { name: "Request estimate" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Log in to place a delivery" })).toHaveFocus();
  });
});
