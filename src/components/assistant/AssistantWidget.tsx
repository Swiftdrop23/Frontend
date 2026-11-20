import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { assistantApi, MAX_MESSAGE_LENGTH } from "../../api/assistant";
import type { ChatMessage } from "../../api/assistant";
import type { Role } from "../../types";
import "./assistant.css";

const SUGGESTIONS: Record<Role, string[]> = {
  CUSTOMER: ["Where are my parcels?", "How much to send 2 kg from Colombo to Kandy?", "Which areas do you deliver to?"],
  MERCHANT: ["How much to send 1 kg from Colombo to Galle?", "Which areas do you deliver to?"],
  DISPATCHER: ["Track SD-E693FAEC", "Which areas do you deliver to?"],
  COURIER: ["Track SD-E693FAEC", "Which areas do you deliver to?"],
  ADMIN: ["Which areas do you deliver to?", "How much to send 5 kg from Colombo to Gampaha?"],
};

const WELCOME = "Hi! I'm the SwiftDrop assistant. Ask me about delivery fees, service areas or a tracking number.";

/** Floating chat panel shown on every dashboard. Answers come from live SwiftDrop data via the backend. */
export default function AssistantWidget({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", text: question }];
    setMessages(next);
    setDraft("");
    setError(null);
    setBusy(true);
    try {
      const { reply } = await assistantApi.chat(next);
      setMessages((current) => [...current, { role: "assistant", text: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant could not answer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  }

  return (
    <div className="sd-assistant">
      {open && (
        <section className="sd-assistant-panel" role="dialog" aria-label="SwiftDrop assistant">
          <header className="sd-assistant-head">
            <div>
              <strong>SwiftDrop Assistant</strong>
              <span>AI · answers from live delivery data</span>
            </div>
            <div className="sd-assistant-head-actions">
              {messages.length > 0 && (
                <button type="button" onClick={() => { setMessages([]); setError(null); }} aria-label="Start a new chat">
                  New chat
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
            </div>
          </header>

          <div className="sd-assistant-list" ref={listRef} aria-live="polite">
            <p className="sd-msg sd-msg-assistant">{WELCOME}</p>
            {messages.length === 0 && (
              <div className="sd-assistant-suggestions">
                {SUGGESTIONS[role].map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)}>{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <p key={i} className={`sd-msg sd-msg-${m.role}`}>{m.text}</p>
            ))}
            {busy && <p className="sd-msg sd-msg-assistant sd-msg-typing" aria-label="Assistant is typing">…</p>}
            {error && <p className="sd-assistant-error" role="alert">{error}</p>}
          </div>

          <form className="sd-assistant-form" onSubmit={submit}>
            <textarea
              ref={inputRef}
              value={draft}
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Ask about fees, areas or a tracking number…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              aria-label="Message the assistant"
            />
            <button type="submit" disabled={busy || !draft.trim()}>Send</button>
          </form>
          <p className="sd-assistant-note">AI can make mistakes. Fees are confirmed when you create a delivery.</p>
        </section>
      )}
      <button
        type="button"
        className="sd-assistant-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open SwiftDrop assistant"}
      >
        {open ? "✕" : "Ask SwiftDrop AI"}
      </button>
    </div>
  );
}
