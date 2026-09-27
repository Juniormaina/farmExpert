import { useState } from "react";
import { ussdInput, ussdStart } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { PanelHeader } from "./PanelHeader";
import { PhoneStatusBar } from "./PhoneStatusBar";

const SERVICE_CODE = "*384*99#";
const RUNNING_DELAY_MS = 900;

const DIAL_KEYS: Array<[string, string]> = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  ["*", ""], ["0", "+"], ["#", ""]
];

type Stage = "dialer" | "running" | "menu" | "message";

export function UssdSimulator() {
  const { locale, demoResetKey } = useAppContext();
  const t = UI_STRINGS[locale];
  const [sessionId, setSessionId] = useState(() => `ussd-${demoResetKey}-${Date.now()}`);
  const [stage, setStage] = useState<Stage>("dialer");
  const [dialed, setDialed] = useState(SERVICE_CODE);
  const [screen, setScreen] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const pause = () => new Promise((resolve) => setTimeout(resolve, RUNNING_DELAY_MS));

  // A final message (goodbye, or an error) shows with a single OK button,
  // exactly like a real phone, and ends the session.
  function showMessage(text: string) {
    setScreen(text);
    setStage("message");
  }

  async function call() {
    if (!dialed) return;
    setStage("running");
    if (dialed !== SERVICE_CODE) {
      await pause();
      showMessage(t.ussdInvalid);
      return;
    }
    const id = `ussd-${demoResetKey}-${Date.now()}`;
    setSessionId(id);
    try {
      const [res] = await Promise.all([ussdStart(id, locale), pause()]);
      setScreen(res.text);
      setReply("");
      setStage("menu");
    } catch {
      showMessage(t.ussdInvalid);
    }
  }

  async function send() {
    if (busy || !reply.trim()) return;
    setBusy(true);
    try {
      const res = await ussdInput(sessionId, reply);
      setReply("");
      if (res.done) showMessage(res.text);
      else setScreen(res.text);
    } catch {
      showMessage(t.ussdInvalid);
    } finally {
      setBusy(false);
    }
  }

  function hangUp() {
    setStage("dialer");
    setReply("");
  }

  const dialogOpen = stage !== "dialer";

  return (
    <section className="card">
      <PanelHeader title={t.ussdTitle} subtitle={t.ussdSubtitle} badge={t.simulator} badgeHint={t.simulatorHint} />
      <div className="handset">
        <PhoneStatusBar />
        <div className="dialer">
          <div className="dial-display" aria-live="polite">
            <span className="dial-number">{dialed || " "}</span>
            <button
              className="dial-backspace"
              onClick={() => setDialed((d) => d.slice(0, -1))}
              disabled={dialogOpen || !dialed}
              aria-label={t.del}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5h11v14H9l-6-7zM12 9l6 6M18 9l-6 6" />
              </svg>
            </button>
          </div>
          <p className="dial-hint">{t.ussdDialHint}</p>

          <div className="dial-pad">
            {DIAL_KEYS.map(([digit, letters]) => (
              <button key={digit} className="dial-key" onClick={() => setDialed((d) => d + digit)} disabled={dialogOpen}>
                <span className="dial-digit">{digit}</span>
                <span className="dial-letters">{letters || " "}</span>
              </button>
            ))}
          </div>

          <button className="call-button" onClick={call} disabled={dialogOpen || !dialed} aria-label={t.call}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.6a1 1 0 01-.25 1z" />
            </svg>
          </button>
        </div>

        {dialogOpen && (
          <div className="ussd-overlay">
            <div className="ussd-dialog" role="dialog" aria-modal="true" aria-label="USSD">
              {stage === "running" || busy ? (
                <div className="ussd-running" role="status">
                  <span className="spinner" aria-hidden="true" />
                  {t.ussdRunning}
                </div>
              ) : (
                <>
                  <pre className="ussd-message">{screen}</pre>
                  {stage === "menu" && (
                    <input
                      className="ussd-field"
                      value={reply}
                      autoFocus
                      inputMode="numeric"
                      onChange={(e) => setReply(e.target.value.replace(/[^\d,]/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      aria-label={t.ussdInputPlaceholder}
                    />
                  )}
                  <div className="ussd-actions">
                    {stage === "menu" ? (
                      <>
                        <button onClick={hangUp}>{t.cancel}</button>
                        <button onClick={send} disabled={!reply.trim()}>
                          {t.send}
                        </button>
                      </>
                    ) : (
                      <button onClick={hangUp}>{t.ok}</button>
                    )}
                  </div>
                </>
              )}
            </div>

            {stage === "menu" && !busy && (
              <div className="number-pad" role="group" aria-label={t.ussdInputPlaceholder}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button key={digit} onClick={() => setReply((r) => r + digit)}>
                    {digit}
                  </button>
                ))}
                <span />
                <button onClick={() => setReply((r) => r + "0")}>0</button>
                <button onClick={() => setReply((r) => r.slice(0, -1))} aria-label={t.del}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 5h11v14H9l-6-7zM12 9l6 6M18 9l-6 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
