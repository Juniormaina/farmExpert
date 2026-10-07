import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { userFacingError } from "../errors";
import { UI_STRINGS } from "../i18n";
import { keyPointsFor } from "../insights";
import { starterQuestions, suggestionsFor } from "../suggestions";
import type { AgentIntent, AgentResponse, Locale } from "../types";
import { HighlightedText, KeyPoints } from "./Highlights";
import { formatClock } from "./PhoneStatusBar";
import { FeedbackRow } from "./FeedbackRow";

interface ChatEntry {
  from: "user" | "agent";
  text: string;
  time: string;
  source?: "live" | "bundled";
  data?: AgentResponse["data"];
  locale?: Locale;
}

export function ChatPanel() {
  const { locale, demoProfile, demoQueryTrigger, demoResetKey, county, setCounty, crop, setCrop, statusLabel } = useAppContext();
  const online = statusLabel !== "offline-cached" && statusLabel !== "waiting-for-connectivity";
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
    setMessages((prev) => [...prev, { from: "user", text, time: formatClock(new Date()) }]);
    setInput("");
    setSending(true);
    try {
      const result = await sendChatMessage(text, locale);
      const reply = result.data;
      setMessages((prev) => [
        ...prev,
        {
          from: "agent",
          text: reply.reply,
          time: formatClock(new Date()),
          source: result.source === "live" ? "live" : "bundled",
          data: reply.data,
          locale: reply.locale
        }
      ]);
      if (reply.entities.county) setCounty(reply.entities.county);
      if (reply.entities.crop) setCrop(reply.entities.crop);
      setLastIntent(reply.intent);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "agent", text: userFacingError(err, t.serviceError), time: formatClock(new Date()) }
      ]);
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

  const starters = starterQuestions(crop, county, demoProfile.budgetKsh, locale);

  return (
    <section className="card" id="ask" tabIndex={-1} aria-labelledby="ask-heading">
      <div className="chat-topbar">
        <div className="chat-contact">
          <p className="eyebrow">{t.askEyebrow}</p>
          <h2 id="ask-heading">{t.askPrompt}</h2>
          <span className={online ? "presence online" : "presence offline"}>{online ? t.chatOnline : t.chatOffline}</span>
        </div>
      </div>
      <div className="chat-window chat-window-main" ref={scrollRef} aria-live="polite">
        {messages.length === 0 && !sending && <p className="chat-empty">{t.chatEmpty}</p>}
        {messages.map((m, i) => {
          if (m.from === "user") {
            return (
              <div key={i} className="chat-bubble user">
                {m.text}
                <span className="bubble-time">{m.time}</span>
              </div>
            );
          }
          const points = keyPointsFor(m.data, m.locale ?? locale);
          return (
            <div key={i} className="agent-turn">
              {points.length > 0 && (
                <>
                  <p className="section-kicker">{t.calculation}</p>
                  <KeyPoints points={points} />
                </>
              )}
              <p className="section-kicker">{t.recommendation}</p>
              <div className="chat-bubble agent">
                <HighlightedText text={m.text} />
                {m.source === "bundled" && (
                  <div className="offline-note">{t.offlineReply}</div>
                )}
                <span className="bubble-time">{m.time}</span>
              </div>
            </div>
          );
        })}
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

      {messages.length === 0 ? (
        <div className="starter-list" aria-label={t.tryAsking}>
          {starters.map((question) => (
            <button key={question} type="button" className="starter" onClick={() => send(question)} disabled={sending}>
              {question}
            </button>
          ))}
        </div>
      ) : (
        <div className="suggestions" aria-label={t.nextStep}>
          <span className="suggestions-label">{t.nextStep}</span>
          {suggestionsFor(lastIntent, crop, county, demoProfile.budgetKsh, locale).map((s) => (
            <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={sending}>
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.some((message) => message.from === "agent") && <FeedbackRow context="web" locale={locale} />}

      <div className="chat-input-row">
        <label className="sr-only" htmlFor="ask-input">
          {t.chatPlaceholder}
        </label>
        <input
          id="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={t.chatPlaceholder}
        />
        <button type="button" className="btn-primary" onClick={() => send(input)} disabled={sending || !input.trim()}>
          {t.send}
        </button>
      </div>
    </section>
  );
}
