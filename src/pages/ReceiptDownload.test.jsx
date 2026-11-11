import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DeliveryReceipt from "./customer/DeliveryReceipt";

// Parcel data stays on mock data (http.ts reads VITE_API_URL at import). downloadReceiptPdf reads it per call,
// so stubbing it switches only the PDF download to the "real backend" path with a mocked fetch.

function show() {
  render(
    <MemoryRouter initialEntries={["/customer/delivery-history/SD-000099/receipt"]}>
      <Routes><Route path="/customer/delivery-history/:trackingNumber/receipt" element={<DeliveryReceipt />} /></Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  localStorage.setItem("token", "test-token");
  URL.createObjectURL = vi.fn(() => "blob:receipt");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe("Receipt PDF download", () => {
  it("downloads the PDF from the backend with the login token", async () => {
    vi.stubEnv("VITE_API_URL", "http://api.test/api");
    const fetchMock = vi.fn(async () => new Response(new Blob(["%PDF-1.4"], { type: "application/pdf" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const clicks = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () { clicks.push(this.download); });
    const print = vi.spyOn(window, "print").mockImplementation(() => {});

    const user = show();
    await user.click(await screen.findByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(clicks).toEqual(["SwiftDrop-receipt-SD-000099.pdf"]));
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/v1/tracking/parcels/SD-000099/receipt.pdf");
    expect(options.headers.Authorization).toBe("Bearer test-token");
    expect(print).not.toHaveBeenCalled();
    click.mockRestore(); print.mockRestore();
  });

  it("shows the server's message when the download is refused", async () => {
    vi.stubEnv("VITE_API_URL", "http://api.test/api");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "PARCEL_NOT_FOUND", message: "We could not find that parcel." }),
      { status: 404, headers: { "Content-Type": "application/json" } })));

    const user = show();
    await user.click(await screen.findByRole("button", { name: "Download PDF" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not find that parcel.");
  });

  it("falls back to the print dialog in mock mode", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = show();
    await user.click(await screen.findByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    print.mockRestore();
  });
});
