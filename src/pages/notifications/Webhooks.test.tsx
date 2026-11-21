import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/http", () => ({ isMock: false, request: vi.fn(), wait: vi.fn() }));
const api = vi.hoisted(() => ({ merchant: vi.fn(), saveEndpoint: vi.fn(), test: vi.fn() }));
vi.mock("../../api/notifications", () => ({ notificationApi: api }));

import Webhooks from "./Webhooks";

const delivery = (id: string, result: string) => ({
  id, merchant: "1", tracking: "SD-AAA", event: "Picked up", eventName: "parcel.status.changed",
  result, time: "21 Nov 2026, 14:00", attemptCount: 1,
});

beforeEach(() => vi.clearAllMocks());

describe("Webhooks (simplified)", () => {
  it("explains the page, shows the connection and the updates sent", async () => {
    api.merchant.mockResolvedValue({ endpoint: "https://shop.example/hooks", deliveries: [delivery("d1", "Success"), delivery("d2", "Failed (DLQ)")] });
    render(<MemoryRouter><Webhooks /></MemoryRouter>);

    expect(await screen.findByText("Get order updates on your shop's server")).toBeTruthy();
    expect(screen.getByText("Connected")).toBeTruthy();
    expect(screen.getByText("Delivered")).toBeTruthy();
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("saves the address and only then allows a test", async () => {
    api.merchant.mockResolvedValue({ endpoint: "", deliveries: [] });
    api.saveEndpoint.mockResolvedValue({ endpoint: "https://shop.example/hooks" });
    render(<MemoryRouter><Webhooks /></MemoryRouter>);

    expect(await screen.findByText("Not connected")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Send a test update" }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.type(screen.getByLabelText("Webhook endpoint"), "https://shop.example/hooks");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(api.saveEndpoint).toHaveBeenCalledWith("https://shop.example/hooks");
  });
});
