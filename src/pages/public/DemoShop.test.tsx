import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

async function renderShop() {
  const { default: DemoShop } = await import("./DemoShop");
  render(<MemoryRouter><DemoShop /></MemoryRouter>);
}

describe("Demo Mart shop (Member 10)", () => {
  it("places an order through the merchant API and shows the tracking number", async () => {
    vi.stubEnv("VITE_DEMO_SHOP_CLIENT_ID", "sd_test");
    vi.stubEnv("VITE_DEMO_SHOP_CLIENT_SECRET", "secret");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "tok" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ trackingNumber: "SD-ABC1234567" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await renderShop();
    await userEvent.click(screen.getAllByRole("button", { name: "Buy" })[0]);
    await userEvent.type(screen.getByLabelText("Full name"), "Kamal Silva");
    await userEvent.type(screen.getByLabelText("Email"), "kamal@example.com");
    await userEvent.type(screen.getByLabelText(/Mobile number/), "0771234567");
    await userEvent.type(screen.getByLabelText("Delivery address"), "12 Temple Road, Kandy");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("SD-ABC1234567")).toBeTruthy();
    expect(screen.getByText("We've emailed your order confirmation to kamal@example.com.")).toBeTruthy();
    const orderBody = JSON.parse(String(fetchMock.mock.calls[1][1].body));
    expect(orderBody.recipientName).toBe("Kamal Silva");
    expect(orderBody.weightKg).toBe(1.2);
    expect(orderBody.recipientEmail).toBe("kamal@example.com");
    expect(orderBody.recipientPhone).toBe("0771234567");
  });

  it("does not take orders while the shop has no key", async () => {
    vi.stubEnv("VITE_DEMO_SHOP_CLIENT_ID", "");
    vi.stubEnv("VITE_DEMO_SHOP_CLIENT_SECRET", "");
    await renderShop();
    await userEvent.click(screen.getAllByRole("button", { name: "Buy" })[0]);
    await userEvent.type(screen.getByLabelText("Full name"), "Kamal Silva");
    await userEvent.type(screen.getByLabelText("Email"), "kamal@example.com");
    await userEvent.type(screen.getByLabelText("Delivery address"), "Kandy");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));
    expect(screen.getByRole("alert").textContent).toContain("can't take orders");
    expect(screen.getByRole("form", { name: "Connect to SwiftDrop" })).toBeTruthy();
  });
});
