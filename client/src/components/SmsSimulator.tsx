import { useEffect, useMemo, useState } from "react";
import { getSmsHistory, sendSms } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import type { SmsMessage } from "../types";

export function SmsSimulator() {
  const { locale, demoResetKey } = useAppContext();
  const t = UI_STRINGS[locale];
  const sessionId = useMemo(() => `sms-${demoResetKey}-${Math.random().toString(36).slice(2, 8)}`, [demoResetKey]);
  const [history, setHistory] = useState<SmsMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setHistory([]);
    getSmsHistory(sessionId).then(setHistory);
  }, [sessionId]);

  async function send() {
    if (!input.trim() || sending) return;
    const text = input;
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
      <p className="demo-notice">{t.simulatorLabel}</p>
      <p style={{ fontSize: "0.85rem", color: "var(--color-neutral-700)" }}>{t.smsIntro}</p>
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="phone-screen-header">ShambaAI SMS</div>
          <div className="chat-window" style={{ flex: 1 }}>
            {history.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from === "farmer" ? "user" : "agent"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t.chatPlaceholder}
            />
            <button className="btn-primary" onClick={send} disabled={sending}>
              {t.send}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
