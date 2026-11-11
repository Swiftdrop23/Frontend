import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LiveTracking from "./customer/LiveTracking";

// Data calls stay on mock data (http.ts reads VITE_API_URL once at import, which is empty in tests).
// liveTrackingUrl reads it per call, so stubbing it here turns on the SSE path only.

class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances = [];
  constructor(url) {
    this.url = url;
    this.readyState = FakeEventSource.CONNECTING;
    this.listeners = {};
    this.closed = false;
    FakeEventSource.instances.push(this);
  }
  addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); }
  close() { this.closed = true; this.readyState = FakeEventSource.CLOSED; }
  open() { this.readyState = FakeEventSource.OPEN; this.onopen?.(); }
  push(data) { (this.listeners.status ?? []).forEach((fn) => fn({ data: JSON.stringify(data) })); }
  drop() { this.readyState = FakeEventSource.CONNECTING; this.onerror?.(); }
}

const step = (status, label, reached, current, at = null) => ({ status, label, reached, current, at });

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.stubGlobal("EventSource", FakeEventSource);
  vi.stubEnv("VITE_API_URL", "http://api.test/api");
});
afterEach(() => vi.unstubAllGlobals());

function show() {
  render(
    <MemoryRouter initialEntries={["/customer/live-tracking?parcel=SD-000123"]}>
      <Routes><Route path="/customer/live-tracking" element={<LiveTracking />} /></Routes>
    </MemoryRouter>,
  );
}

describe("Live Tracking over SSE", () => {
  it("connects to the parcel stream and applies pushed updates", async () => {
    show();
    expect(await screen.findByText("SD-000123", { selector: ".tracking-number" })).toBeVisible();
    const source = FakeEventSource.instances.at(-1);
    expect(source.url).toBe("http://api.test/api/v1/tracking/live/SD-000123");

    act(() => source.open());
    expect(screen.getByText("Live")).toBeVisible();

    act(() => source.push({
      trackingNumber: "SD-000123", status: "OUT_FOR_DELIVERY", timeline: [
        step("CREATED", "Created", true, false, "2026-10-27T08:10:00Z"),
        step("PICKED_UP", "Picked Up", true, false, "2026-10-27T10:25:00Z"),
        step("IN_TRANSIT", "In Transit", true, false, "2026-10-27T13:40:00Z"),
        step("OUT_FOR_DELIVERY", "Out for Delivery", true, true, "2026-10-27T15:00:00Z"),
        step("DELIVERED", "Delivered", false, false),
      ],
    }));

    const timeline = screen.getByRole("list", { name: "Delivery timeline" });
    expect(within(timeline).getByText("Out for Delivery").closest("li")).toHaveAttribute("aria-current", "step");
    expect(within(timeline).getAllByText("pending")).toHaveLength(1);
    expect(screen.getByText("Out for delivery", { selector: ".badge" })).toBeVisible();
    // Details that the stream does not carry are kept.
    expect(screen.getByText("Kamal S.")).toBeVisible();
  });

  it("falls back to timed refresh when the connection drops", async () => {
    show();
    await screen.findByText("SD-000123", { selector: ".tracking-number" });
    const source = FakeEventSource.instances.at(-1);
    act(() => source.open());
    act(() => source.drop());
    expect(screen.getByText("Auto-refresh")).toBeVisible();
    expect(screen.getByText("Refreshing every 15 seconds")).toBeVisible();
  });

  it("closes the stream once the parcel is delivered", async () => {
    show();
    await screen.findByText("SD-000123", { selector: ".tracking-number" });
    const source = FakeEventSource.instances.at(-1);
    act(() => source.open());
    act(() => source.push({ trackingNumber: "SD-000123", status: "DELIVERED", timeline: [
      step("CREATED", "Created", true, false), step("PICKED_UP", "Picked Up", true, false),
      step("IN_TRANSIT", "In Transit", true, false), step("OUT_FOR_DELIVERY", "Out for Delivery", true, false),
      step("DELIVERED", "Delivered", true, true, "2026-10-27T17:00:00Z"),
    ] }));
    expect(source.closed).toBe(true);
    expect(screen.getByText("Final")).toBeVisible();
  });
});
