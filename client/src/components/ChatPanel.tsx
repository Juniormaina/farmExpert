import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { keyPointsFor } from "../insights";
import type { AgentResponse, Locale } from "../types";
import { HighlightedText, KeyPoints } from "./Highlights";

interface ChatEntry {
  from: "user" | "agent";
  text: string;
  source?: "live" | "bundled";
  data?: AgentResponse["data"];
  locale?: Locale;
}

const SUGGESTIONS: Record<Locale, string[]> = {
  en: [
    "Maize price in Eldoret?",
    "How much is DAP in Nakuru?",
    "Is CAN available in Eldoret?",
    "I have KSh 15,000 for 2 acres in Nakuru"
  ],
  sw: [
    "Bei ya mahindi Eldoret?",
    "Bei ya DAP Nakuru ni ngapi?",
    "CAN iko Eldoret?",
    "Nina shilingi 15,000 kwa ekari 2 Nakuru"
  ]
};

export function ChatPanel() {
  const { locale, demoProfile, demoQueryTrigger, demoResetKey, setCounty } = useAppContext();
  const t = UI_STRINGS[locale];
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
  }, [demoResetKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const result = await sendChatMessage(text);
      const reply = result.data;
      setMessages((prev) => [
        ...prev,
        {
          from: "agent",
          text: reply.reply,
          source: result.source === "live" ? "live" : "bundled",
          data: reply.data,
          locale: reply.locale
        }
      ]);
      if (reply.entities.county) setCounty(reply.entities.county);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (demoQueryTrigger > 0) {
      send(demoProfile.sampleQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoQueryTrigger]);

  return (
    <section className="card">
      <h2>{t.chatTitle}</h2>
      <div className="chat-window chat-window-main" ref={scrollRef} aria-live="polite">
        {messages.map((m, i) =>
          m.from === "user" ? (
            <div key={i} className="chat-bubble user">
              {m.text}
            </div>
          ) : (
            <div key={i} className="agent-turn">
              <KeyPoints points={keyPointsFor(m.data, m.locale ?? locale)} />
              <div className="chat-bubble agent">
                <HighlightedText text={m.text} />
                {m.source === "bundled" && (
                  <div className="offline-note">{locale === "sw" ? "(jibu la nje ya mtandao)" : "(offline fallback reply)"}</div>
                )}
              </div>
            </div>
          )
        )}
        {sending && (
          <div className="chat-bubble agent typing" role="status">
            <span className="typing-label">{t.thinking}</span>
            <span className="typing-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
      </div>

      <div className="suggestions">
        <span className="suggestions-label">{t.tryAsking}</span>
        {SUGGESTIONS[locale].map((s) => (
          <button key={s} className="chip" onClick={() => send(s)} disabled={sending}>
            {s}
          </button>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={t.chatPlaceholder}
        />
        <button className="btn-primary" onClick={() => send(input)} disabled={sending || !input.trim()}>
          {t.send}
        </button>
      </div>
      <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => send(demoProfile.sampleQuery)} disabled={sending}>
        {t.startDemoQuery}
      </button>
    </section>
  );
}
