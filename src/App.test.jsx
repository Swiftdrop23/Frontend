import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { NAV, homePath } from "./config/navigation";
import { clearSession, saveSession } from "./api/auth";

function renderRoute(path) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

afterEach(clearSession);

describe("Quote routing and existing routes", () => {
  it("protects saved confirmation lookup while allowing the customer recovery screen", () => {
    const visitor = renderRoute("/customer/recover-delivery?quote=fixture-quote");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    visitor.unmount();
    saveSession({ token: "test-token", user: { name: "Test Customer", role: "CUSTOMER" } });
    const customer = renderRoute("/customer/recover-delivery?quote=fixture-quote");
    expect(screen.getByRole("heading", { name: "Check a previous confirmation" })).toBeVisible();
    expect(screen.getByLabelText("Quote reference")).toHaveValue("fixture-quote");
    customer.unmount();
    saveSession({ token: "test-token", user: { name: "Test Merchant", role: "MERCHANT" } });
    renderRoute("/customer/recover-delivery");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
  it("protects the cancellation screen and exposes it in customer navigation", () => {
    const visitor = renderRoute("/customer/cancel-delivery");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    visitor.unmount();
    saveSession({ token: "test-token", user: { name: "Test Customer", role: "CUSTOMER" } });
    const customer = renderRoute("/customer/cancel-delivery?tracking=fixture-tracking");
    expect(screen.getByRole("heading", { name: "Cancel a delivery" })).toBeVisible();
    expect(screen.getByLabelText("Tracking number")).toHaveValue("fixture-tracking");
    expect(screen.getByRole("link", { name: "Cancel Delivery" })).toHaveAttribute("href", "/customer/cancel-delivery");
    customer.unmount();
    saveSession({ token: "test-token", user: { name: "Test Merchant", role: "MERCHANT" } });
    renderRoute("/customer/cancel-delivery");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  it("allows a visitor to open the quote route directly and navigate to login", async () => {
    const user = userEvent.setup();
    renderRoute("/get-a-quote");
    expect(screen.getByRole("heading", { name: "Get a Quote" })).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Log in to place a delivery" }));
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Get a Quote" }));
    expect(screen.getByRole("heading", { name: "Get a Quote" })).toBeVisible();
  });

  it("keeps the visitor root redirect and customer route protection", () => {
    const root = renderRoute("/");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    root.unmount();
    renderRoute("/customer/create-delivery");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    expect(screen.queryByLabelText(/^Pickup address/)).not.toBeInTheDocument();
  });

  it.each(Object.keys(NAV))("preserves the %s dashboard root redirect", (role) => {
    saveSession({ token: "test-token", user: { name: "Test User", role } });
    renderRoute("/");
    expect(screen.getByRole("heading", { name: NAV[role].items[0][0], exact: true })).toBeVisible();
    expect(screen.getByRole("link", { name: NAV[role].items[0][0], exact: true })).toHaveAttribute("href", homePath(role));
    if (role === "CUSTOMER") {
      expect(screen.getByLabelText(/^Pickup address/)).toBeVisible();
      expect(screen.getByRole("button", { name: "Review delivery details" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Place delivery request (unavailable)" })).toBeDisabled();
    }
  });

  it("keeps quotes public for an existing session without changing it", () => {
    saveSession({ token: "test-token", user: { name: "Test User", role: "CUSTOMER" } });
    renderRoute("/get-a-quote");
    expect(screen.getByRole("heading", { name: "Get a Quote" })).toBeVisible();
    expect(localStorage.getItem("token")).toBe("test-token");
  });

  it("preserves direct customer delivery access and rejects a different role", () => {
    saveSession({ token: "test-token", user: { name: "Test Customer", role: "CUSTOMER" } });
    const customer = renderRoute("/customer/create-delivery");
    expect(screen.getByLabelText(/^Pickup address/)).toBeVisible();
    expect(screen.getByLabelText(/^Recipient phone/)).toBeVisible();
    customer.unmount();

    saveSession({ token: "test-token", user: { name: "Test Merchant", role: "MERCHANT" } });
    renderRoute("/customer/create-delivery");
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    expect(screen.queryByLabelText(/^Pickup address/)).not.toBeInTheDocument();
  });
});
