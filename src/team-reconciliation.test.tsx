import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { saveSession, clearSession } from "./api/auth";
import { createParcel } from "./api/parcels";
import StatusBadge from "./components/ui/StatusBadge";

vi.mock("./api/users", async original => ({ ...(await original()),
  getProfile: vi.fn().mockResolvedValue({ fullName: "Fixture User", email: "fixture@example.test", phone: "0771234567" }),
  listAddresses: vi.fn().mockResolvedValue([]),
}));

afterEach(() => { clearSession(); vi.unstubAllGlobals(); });

describe("Team frontend and delivery reconciliation", () => {
  it.each(["CUSTOMER", "COURIER", "DISPATCHER", "ADMIN"])(
    "keeps %s account routes and password navigation alongside delivery routes", async (role) => {
      saveSession({ token: "fixture-token", user: { name: "Fixture User", role } });
      const user = userEvent.setup();
      render(<MemoryRouter initialEntries={[`/${role.toLowerCase()}/profile`]}><App /></MemoryRouter>);
      expect(screen.getByLabelText("Full name")).toBeVisible();
      expect(screen.queryByRole("button", { name: "Add address" }) !== null).toBe(role === "CUSTOMER");
      await user.click(screen.getByRole("link", { name: "Change password" }));
      expect(screen.getByLabelText("Current password")).toBeVisible();
      expect(screen.queryByLabelText(/^Pickup address/)).not.toBeInTheDocument();
    });

  it("preserves the merchant-owned profile placeholder", () => {
    saveSession({ token: "fixture-token", user: { name: "Fixture Merchant", role: "MERCHANT" } });
    render(<MemoryRouter initialEntries={["/merchant/profile"]}><App /></MemoryRouter>);
    expect(screen.getByText("/merchant/profile")).toBeVisible();
    expect(screen.queryByLabelText("Full name")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/merchant/orders");
  });

  it("renders the new CREATED status through the shared team badge", () => {
    render(<StatusBadge status="CREATED" />);
    expect(screen.getByText("Created")).toHaveClass("badge", "created");
  });

  it("never simulates legacy parcel creation without API configuration", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(createParcel({ senderName: "Fixture sender", receiverName: "Fixture recipient", receiverAddress: "Fixture address" }))
      .rejects.toThrow("Use delivery quote confirmation");
    expect(fetch).not.toHaveBeenCalled();
  });
});
