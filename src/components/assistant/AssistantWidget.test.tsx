import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AssistantWidget from "./AssistantWidget";

const chat = vi.fn();
vi.mock("../../api/assistant", () => ({
  MAX_MESSAGE_LENGTH: 1000,
  assistantApi: { chat: (...args: unknown[]) => chat(...args) },
}));

describe("AI Delivery Assistant widget (Member 10)", () => {
  it("opens, sends the conversation and shows the reply", async () => {
    chat.mockResolvedValueOnce({ reply: "It costs about LKR 475.00.", toolsUsed: ["estimate_delivery_fee"] });
    render(<AssistantWidget role="CUSTOMER" />);

    fireEvent.click(screen.getByRole("button", { name: "Open SwiftDrop assistant" }));
    fireEvent.change(screen.getByLabelText("Message the assistant"), { target: { value: "Fee to Kadawatha for 1.5 kg?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("It costs about LKR 475.00.")).toBeTruthy();
    expect(chat).toHaveBeenCalledWith([{ role: "user", text: "Fee to Kadawatha for 1.5 kg?" }]);
  });

  it("shows an error when the assistant is unavailable", async () => {
    chat.mockRejectedValueOnce(new Error("The assistant is busy right now. Please try again in a minute."));
    render(<AssistantWidget role="DISPATCHER" />);

    fireEvent.click(screen.getByRole("button", { name: "Open SwiftDrop assistant" }));
    fireEvent.click(screen.getByRole("button", { name: "Which areas do you deliver to?" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("busy"));
  });
});
