import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GetQuote from "./public/GetQuote";
import { requestEstimate } from "../api/delivery";

vi.mock("../api/delivery", async (original) => ({ ...(await original()), requestEstimate: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
async function fill(user) {
  await user.type(screen.getByLabelText(/^Pickup city/), "Test pickup");
  await user.type(screen.getByLabelText(/^Drop-off city/), "Test drop-off");
  await user.type(screen.getByLabelText(/^Parcel weight/), "0.75");
}
describe("Connected indicative estimates", () => {
  it("displays the server fee without implying that a delivery was placed", async () => {
    requestEstimate.mockResolvedValue({ fee: { amount: "2.88", currency: "USD" }, indicative: true });
    const user = userEvent.setup(); render(<MemoryRouter><GetQuote /></MemoryRouter>); await fill(user);
    await user.click(screen.getByRole("button", { name: "Request estimate" }));
    expect(await screen.findByText("USD 2.88")).toBeVisible();
    expect(screen.getByText(/This estimate is not a delivery booking/)).toBeVisible();
    expect(screen.queryByText("Estimate unavailable")).not.toBeInTheDocument();
  });
  it("does not retain an old estimate after the route is edited", async () => {
    requestEstimate.mockResolvedValue({ fee: { amount: "2.88", currency: "USD" }, indicative: true });
    const user = userEvent.setup(); render(<MemoryRouter><GetQuote /></MemoryRouter>); await fill(user);
    await user.click(screen.getByRole("button", { name: "Request estimate" }));
    await screen.findByText("USD 2.88");
    await user.type(screen.getByLabelText(/^Drop-off city/), " changed");
    expect(screen.queryByText("USD 2.88")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
