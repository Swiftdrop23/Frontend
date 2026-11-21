import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import MerchantProfile from "./MerchantProfile";

describe("Merchant business profile (Member 10)", () => {
  it("shows the approved business and saves contact details", async () => {
    render(<MemoryRouter><MerchantProfile /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Demo Mart" })).toBeTruthy();
    const contact = screen.getByLabelText("Contact person");
    await userEvent.clear(contact);
    await userEvent.type(contact, "Nimal Perera");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Business profile saved.")).toBeTruthy();
  });
});
