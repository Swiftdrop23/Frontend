import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Users from "./Users";

// Runs in mock mode (no VITE_API_URL), using the demo accounts from src/api/adminUsers.ts.
describe("Admin user management (Member 1)", () => {
  it("lists users and filters them by role", async () => {
    const user = userEvent.setup();
    render(<Users />);

    expect(await screen.findByText("customer@swiftdrop.test")).toBeInTheDocument();
    expect(screen.getByText("courier@swiftdrop.test")).toBeInTheDocument();

    await user.selectOptions(screen.getAllByLabelText("Role")[0], "COURIER");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("courier@swiftdrop.test")).toBeInTheDocument();
    expect(screen.queryByText("customer@swiftdrop.test")).not.toBeInTheDocument();
  });

  it("validates and adds a staff account", async () => {
    const user = userEvent.setup();
    const { container } = render(<Users />);
    await screen.findByText("customer@swiftdrop.test");

    await user.click(screen.getByRole("button", { name: "Add staff account" }));
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Full name is required.")).toBeInTheDocument();

    const input = (name: string) => {
      const element = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (!element) throw new Error(`No input named ${name}`);
      return element;
    };
    await user.type(input("fullName"), "New Courier");
    await user.type(input("email"), "new.courier@swiftdrop.test");
    await user.type(input("password"), "Courier123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    const row = (await screen.findByText("new.courier@swiftdrop.test")).closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByRole("button", { name: "Disable" })).toBeInTheDocument();
  });
});