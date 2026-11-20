// AI Delivery Assistant API (Member 10). The Gemini key stays on the backend.
import { request } from "./http";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export interface ChatReply {
  reply: string;
  toolsUsed: string[];
}

export const MAX_MESSAGE_LENGTH = 1000;
/** Only the latest messages are sent; the backend keeps no conversation history. */
export const HISTORY_LIMIT = 16;

export const assistantApi = {
  status: () => request<{ available: boolean }>("GET", "/assistant/status"),
  chat: (messages: ChatMessage[]) =>
    request<ChatReply>("POST", "/assistant/chat", { messages: messages.slice(-HISTORY_LIMIT) }),
};
