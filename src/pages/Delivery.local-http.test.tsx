import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateDelivery from "./customer/CreateDelivery";
import CancelDelivery from "./customer/CancelDelivery";
import GetQuote from "./public/GetQuote";
import RecoverDelivery from "./customer/RecoverDelivery";

// Enabled only by the backend's isolated PostgreSQL suite. No mocks and no shared API target.
const enabled = process.env.SWIFTDROP_LOCAL_HTTP_TEST === "true";
const port = process.env.SWIFTDROP_LOCAL_HTTP_PORT;
const scenario = process.env.SWIFTDROP_LOCAL_HTTP_SCENARIO;
if (enabled && (!/^\d+$/.test(port || "") || Number(port) < 1 || Number(port) > 65535
    || !["success", "unavailable"].includes(scenario))) {
  throw new Error("An explicit isolated HTTP test port and scenario are required");
}
beforeEach(() => {
  localStorage.clear();
  if (enabled) vi.stubEnv("VITE_API_URL", `http://127.0.0.1:${port}/api`);
});
afterEach(() => { vi.unstubAllEnvs(); localStorage.clear(); });

async function fill(user) {
  for (const [label, value] of [[/^Pickup address/, "Test pickup"], [/^Drop-off address/, "Test drop-off"],
    [/^Parcel weight/, "0.75"], [/^Length/, "25.5"], [/^Width/, "15"], [/^Height/, "10"],
    [/^Recipient name/, "Fixture Recipient"], [/^Recipient phone/, "0771234567"]]) {
    await user.type(screen.getByLabelText(label), value);
  }
}

describe.skipIf(!enabled)("Actual UI/client -> loopback Spring HTTP -> isolated PostgreSQL", () => {
  it.skipIf(scenario !== "success")("quotes, confirms, reads current state and cancels through actual HTTP", async () => {
    const user = userEvent.setup();
    const create = render(<CreateDelivery />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Review delivery details" }));
    await screen.findByText("USD 2.88"); // Server fixture configuration, never production pricing.
    const reference = screen.getByText(/Quote reference:/).querySelector("code").textContent;
    await user.click(screen.getByRole("checkbox", { name: /I accept/ }));
    await user.click(screen.getByRole("button", { name: "Confirm delivery" }));
    await screen.findByRole("heading", { name: "Delivery confirmed" });
    const link = screen.getByRole("link", { name: "Cancel this delivery" }).getAttribute("href");
    expect(link).toMatch(/^\/customer\/cancel-delivery\?tracking=SD-/);
    create.unmount();
    const cancel = render(<MemoryRouter initialEntries={[link]}><CancelDelivery /></MemoryRouter>);
    await user.click(screen.getByRole("button", { name: "Find my delivery" }));
    await screen.findByText("Status: CREATED");
    await user.click(screen.getByRole("checkbox", { name: /I want to cancel/ }));
    await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Delivery cancelled");
    cancel.unmount();
    render(<MemoryRouter initialEntries={[`/customer/recover-delivery?quote=${reference}`]}><RecoverDelivery /></MemoryRouter>);
    await user.click(screen.getByRole("button", { name: "Find saved confirmation" }));
    await screen.findByRole("heading", { name: "Saved delivery confirmation" });
    expect(await screen.findByText("Cancelled")).toBeVisible();
    expect(screen.getByText("USD 2.88")).toBeVisible();
    expect(screen.queryByRole("link", { name: "View cancellation options" })).not.toBeInTheDocument();
  }, 30000);

  it.skipIf(scenario !== "unavailable")("does not fabricate a quote or booking when real integrations are absent", async () => {
    const user = userEvent.setup();
    const create = render(<CreateDelivery />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Review delivery details" }));
    await screen.findByText("Customer authentication is not connected yet.");
    expect(screen.queryByRole("checkbox", { name: /I accept/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Delivery confirmed" })).not.toBeInTheDocument();
    create.unmount();
    render(<MemoryRouter><GetQuote /></MemoryRouter>);
    await user.type(screen.getByLabelText(/^Pickup city/), "Test pickup");
    await user.type(screen.getByLabelText(/^Drop-off city/), "Test drop-off");
    await user.type(screen.getByLabelText(/^Parcel weight/), "0.75");
    await user.click(screen.getByRole("button", { name: "Request estimate" }));
    await screen.findByText("Delivery pricing or zone configuration is not available.");
    expect(screen.queryByText("USD 2.88")).not.toBeInTheDocument();
  }, 30000);
});
