import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { keyPointsFor } from "../insights";
import { suggestionsFor } from "../suggestions";
import type { AgentIntent, AgentResponse, Locale } from "../types";
import { HighlightedText, KeyPoints } from "./Highlights";
import { PanelHeader } from "./PanelHeader";

interface ChatEntry {
  from: "user" | "agent";
  text: string;
  source?: "live" | "bundled";
  data?: AgentResponse["data"];
  locale?: Locale;
}

export function ChatPanel() {
  const { locale, demoProfile, demoQueryTrigger, demoResetKey, county, setCounty, crop, setCrop } = useAppContext();
  const t = UI_STRINGS[locale];
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastIntent, setLastIntent] = useState<AgentIntent | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setLastIntent(undefined);
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
      if (reply.entities.crop) setCrop(reply.entities.crop);
      setLastIntent(reply.intent);
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
      <PanelHeader title={t.chatTitle} subtitle={t.chatSubtitle} />
      <div className="chat-window chat-window-main" ref={scrollRef} aria-live="polite">
        {messages.length === 0 && !sending && <p className="chat-empty">{t.chatEmpty}</p>}
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

      <div className="suggestions" aria-label={t.tryAsking}>
        {suggestionsFor(lastIntent, crop, county, demoProfile.budgetKsh, locale).map((s) => (
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
    </section>
  );
}
