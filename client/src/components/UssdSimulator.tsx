import { useEffect, useMemo, useState } from "react";
import { ussdInput, ussdStart } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

export function UssdSimulator() {
  const { locale, demoResetKey } = useAppContext();
  const t = UI_STRINGS[locale];
  const sessionId = useMemo(() => `ussd-${demoResetKey}-${Math.random().toString(36).slice(2, 8)}`, [demoResetKey]);
  const [screen, setScreen] = useState("");
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDone(false);
    ussdStart(sessionId, locale).then((res) => setScreen(res.text));
  }, [sessionId, locale]);

  async function submit() {
    if (busy || done) return;
    setBusy(true);
    try {
      const res = await ussdInput(sessionId, input);
      setScreen(res.text);
      setDone(res.done);
      setInput("");
    } catch {
      setScreen(locale === "sw" ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setDone(false);
    ussdStart(sessionId, locale).then((res) => setScreen(res.text));
  }

  return (
    <section className="card">
      <p className="demo-notice">{t.simulatorLabel}</p>
      <p style={{ fontSize: "0.85rem", color: "var(--color-neutral-700)" }}>{t.ussdIntro}</p>
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="phone-screen-header">{t.ussdDial}</div>
          <div className="ussd-menu-text">{screen}</div>
          {done ? (
            <button className="btn-primary" style={{ marginTop: 10 }} onClick={restart}>
              {locale === "sw" ? "Piga tena" : "Dial again"}
            </button>
          ) : (
            <div className="chat-input-row" style={{ marginTop: 10 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={t.ussdInputPlaceholder}
                inputMode="numeric"
              />
              <button className="btn-primary" onClick={submit} disabled={busy}>
                {t.ussdSend}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
