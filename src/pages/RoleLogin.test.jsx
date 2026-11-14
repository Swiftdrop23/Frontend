import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { clearSession, login } from "../api/auth";
import { homePath } from "../config/navigation";

vi.mock("../api/auth", async original => ({ ...(await original()), login: vi.fn() }));

function show(path) {
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
  return userEvent.setup();
}
const email = () => screen.getByLabelText(/^Email/);
const password = () => screen.getByLabelText(/^Password/);

beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); });
afterEach(clearSession);

describe("main login page: choose a role", () => {
  it("offers one button per non-admin role and nothing about the admin", () => {
    show("/login");
    const nav = screen.getByRole("navigation", { name: "Sign in as" });
    const links = within(nav).getAllByRole("link");
    expect(links.map(l => l.getAttribute("href"))).toEqual(["/login/customer", "/login/merchant", "/login/courier", "/login/dispatcher"]);
    expect(within(nav).queryByText(/admin/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /admin/i })).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("/admin-login");
    expect(screen.getByRole("link", { name: "New here? Create an account" })).toHaveAttribute("href", "/register");
  });

  it("clicking a role opens that role's own sign-in form", async () => {
    const user = show("/login");
    await user.click(screen.getByRole("link", { name: /Courier/ }));
    expect(await screen.findByRole("heading", { name: "Courier login" })).toBeVisible();
    expect(email()).toBeVisible();
    expect(screen.getByRole("link", { name: /Choose a different role/ })).toHaveAttribute("href", "/login");
  });
});

describe("role sign-in forms", () => {
  it("customer: Google button, quote link and registration for customers", () => {
    show("/login/customer");
    expect(screen.getByRole("heading", { name: "Customer login" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Get a Quote" })).toBeVisible();
    expect(screen.getByRole("link", { name: "New here? Create an account" })).toHaveAttribute("href", "/register?type=CUSTOMER");
  });

  it("merchant: can register as a merchant, no Google", () => {
    show("/login/merchant");
    expect(screen.getByRole("heading", { name: "Merchant login" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New here? Create an account" })).toHaveAttribute("href", "/register?type=MERCHANT");
  });

  it.each(["courier", "dispatcher"])("%s: staff account, so no registration and no Google", slug => {
    show(`/login/${slug}`);
    expect(screen.getByText(/accounts are created by a SwiftDrop administrator/)).toBeVisible();
    expect(screen.queryByRole("link", { name: /Create an account/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
  });

  it("an unknown role address goes back to the role chooser", () => {
    show("/login/superuser");
    expect(screen.getByRole("navigation", { name: "Sign in as" })).toBeVisible();
  });

  it("validates before sending", async () => {
    const user = show("/login/merchant");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(screen.getByText("Enter a valid email address.")).toBeVisible();
    expect(screen.getByText("Enter your password.")).toBeVisible();
    expect(login).not.toHaveBeenCalled();
  });

  it("sends the chosen role with the credentials and opens that role's dashboard", async () => {
    login.mockResolvedValue({ token: "t", user: { name: "Kamal", role: "COURIER" } });
    const user = show("/login/courier");
    await user.type(email(), " kamal@example.com ");
    await user.type(password(), "Secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "My Deliveries", exact: true })).toBeVisible());
    expect(login).toHaveBeenCalledWith("kamal@example.com", "Secret123", "COURIER");
    expect(localStorage.getItem("token")).toBe("t");
  });

  it("refuses an account of another role and stores nothing", async () => {
    login.mockResolvedValue({ token: "t", user: { name: "Nimal", role: "CUSTOMER" } });
    const user = show("/login/courier");
    await user.type(email(), "nimal@example.com");
    await user.type(password(), "Secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("not a courier account");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("shows the server's message when sign-in fails", async () => {
    login.mockRejectedValue(new Error("Email or password is incorrect."));
    const user = show("/login/customer");
    await user.type(email(), "a@b.co");
    await user.type(password(), "wrong");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  });
});

describe("admin sign-in stays separate", () => {
  it("/admin-login has its own form and the admin dashboard sends visitors there", async () => {
    show("/admin-login");
    expect(screen.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Choose a different role/ })).not.toBeInTheDocument();
  });

  it("a logged-out visitor to an admin page lands on /admin-login, other roles on /login", () => {
    show(homePath("ADMIN"));
    expect(screen.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
  });

  it("a logged-out visitor to a courier page lands on the role chooser", () => {
    show(homePath("COURIER"));
    expect(screen.getByRole("navigation", { name: "Sign in as" })).toBeVisible();
  });
});
