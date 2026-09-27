import { useEffect, useMemo, useRef, useState } from "react";
import { getSmsHistory, sendSms } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { suggestionsFor } from "../suggestions";
import type { SmsMessage } from "../types";
import { PanelHeader } from "./PanelHeader";

export function SmsSimulator() {
  const { locale, demoResetKey, crop, county, demoProfile } = useAppContext();
  const t = UI_STRINGS[locale];
  const sessionId = useMemo(() => `sms-${demoResetKey}-${Math.random().toString(36).slice(2, 8)}`, [demoResetKey]);
  const [history, setHistory] = useState<SmsMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory([]);
    getSmsHistory(sessionId).then(setHistory);
  }, [sessionId]);

  useEffect(() => {
    screenRef.current?.scrollTo({ top: screenRef.current.scrollHeight, behavior: "smooth" });
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

  return (
    <section className="card">
      <PanelHeader title={t.smsTitle} subtitle={t.smsSubtitle} badge={t.simulator} badgeHint={t.simulatorHint} />
      <div className="phone">
        <div className="phone-statusbar">
          <span>ShambaAI</span>
          <span>SMS</span>
        </div>
        <div className="phone-screen sms-screen" ref={screenRef} aria-live="polite">
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
            history.map((m, i) => (
              <div key={i} className={`sms-bubble ${m.from === "farmer" ? "sent" : "received"}`}>
                {m.text}
              </div>
            ))
          )}
          {sending && (
            <div className="sms-bubble received typing" role="status">
              <span className="typing-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
        </div>
        <div className="phone-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder={t.chatPlaceholder}
            aria-label={t.chatPlaceholder}
          />
          <button className="btn-primary" onClick={() => send(input)} disabled={sending || !input.trim()}>
            {t.send}
          </button>
        </div>
      </div>
    </section>
  );
}
