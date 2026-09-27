import { useEffect, useMemo, useState } from "react";
import { ussdInput, ussdStart } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { PanelHeader } from "./PanelHeader";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

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
    if (busy || done || !input.trim()) return;
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
    setInput("");
    ussdStart(sessionId, locale).then((res) => setScreen(res.text));
  }

  return (
    <section className="card">
      <PanelHeader title={t.ussdTitle} subtitle={t.ussdSubtitle} badge={t.simulator} badgeHint={t.simulatorHint} />
      <div className="phone">
        <div className="phone-statusbar">
          <span>{t.ussdDial}</span>
          <span>USSD</span>
        </div>
        <div className="phone-screen ussd-screen" aria-live="polite">
          <pre className="ussd-text">{screen}</pre>
        </div>

        {done ? (
          <button className="btn-primary phone-full-button" onClick={restart}>
            {t.dialAgain}
          </button>
        ) : (
          <>
            <div className="phone-input">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^\d,]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={t.ussdInputPlaceholder}
                aria-label={t.ussdInputPlaceholder}
                inputMode="numeric"
              />
            </div>
            <div className="keypad" role="group" aria-label="Keypad">
              {KEYS.map((key) => (
                <button key={key} className="key" onClick={() => setInput((v) => v + key)} disabled={busy}>
                  {key}
                </button>
              ))}
              <button className="key key-muted" onClick={() => setInput((v) => v.slice(0, -1))} disabled={busy || !input}>
                {t.del}
              </button>
              <button className="key" onClick={() => setInput((v) => v + "0")} disabled={busy}>
                0
              </button>
              <button className="key key-send" onClick={submit} disabled={busy || !input.trim()}>
                {t.ussdSend}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
