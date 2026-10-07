import { useEffect, useMemo, useRef, useState } from "react";
import { getSmsHistory, sendSms } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { suggestionsFor } from "../suggestions";
import type { SmsMessage } from "../types";
import { PanelHeader } from "./PanelHeader";
import { formatClock, PhoneStatusBar } from "./PhoneStatusBar";

export function SmsSimulator() {
  const { locale, demoResetKey, crop, county, demoProfile } = useAppContext();
  const t = UI_STRINGS[locale];
  const sessionId = useMemo(() => `sms-${demoResetKey}-${Math.random().toString(36).slice(2, 8)}`, [demoResetKey]);
  const [history, setHistory] = useState<SmsMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory([]);
    getSmsHistory(sessionId).then(setHistory);
  }, [sessionId]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [history, sending]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setInput("");
    setSending(true);
    setHistory((prev) => [...prev, { sessionId, from: "farmer", text, timestamp: new Date().toISOString() }]);
    try {
      const result = await sendSms(sessionId, text);
      if (result.data.history.length > 0) {
        setHistory(result.data.history);
      } else {
        setHistory((prev) => [...prev, { sessionId, from: "agent", text: result.data.agentText, timestamp: new Date().toISOString() }]);
      }
    } finally {
      setSending(false);
    }
  }

  const lastSent = history.map((m) => m.from).lastIndexOf("farmer");

  return (
    <section className="card">
      <PanelHeader title={t.smsTitle} subtitle={t.smsSubtitle} badge={t.simulator} badgeHint={t.simulatorHint} />
      <div className="handset">
        <PhoneStatusBar />
        <div className="sms-app">
          <div className="sms-topbar">
            <svg className="sms-back" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            <img className="sms-avatar" src="/icon-192.png" alt="" />
            <div className="sms-contact">
              <strong>Farm Expert</strong>
              <span>{t.smsContactLine}</span>
            </div>
          </div>

          <div className="sms-thread" ref={threadRef} aria-live="polite">
            {history.length === 0 && !sending ? (
              <div className="phone-empty">
                <p>{t.smsEmpty}</p>
                {suggestionsFor(undefined, crop, county, demoProfile.budgetKsh, locale)
                  .slice(0, 1)
                  .map((example) => (
                    <button key={example} className="chip" onClick={() => send(example)}>
                      {example}
                    </button>
                  ))}
              </div>
            ) : (
              <>
                <div className="sms-day">{t.today}</div>
                {history.map((m, i) => (
                  <div key={i} className={`sms-row ${m.from === "farmer" ? "sent" : "received"}`}>
                    <div className="sms-bubble">{m.text}</div>
                    <div className="sms-meta">
                      {formatClock(new Date(m.timestamp))}
                      {i === lastSent && m.from === "farmer" && (sending ? ` · ${t.sending}` : ` · ${t.delivered}`)}
                    </div>
                  </div>
                ))}
              </>
            )}
            {sending && (
              <div className="sms-row received">
                <div className="sms-bubble typing" role="status" aria-label={t.thinking}>
                  <span className="typing-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="sms-composer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder={t.textMessage}
              aria-label={t.textMessage}
            />
            <button className="sms-send" onClick={() => send(input)} disabled={sending || !input.trim()} aria-label={t.send}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
