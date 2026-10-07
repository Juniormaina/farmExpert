import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { HelpDialog } from "./HelpDialog";

const NAV = [
  { id: "ask", key: "navAsk" },
  { id: "crops", key: "navCrops" },
  { id: "markets", key: "navMarkets" },
  { id: "fertilizer", key: "navFertilizer" },
  { id: "budget", key: "navBudget" }
] as const;

export function Header() {
  const { locale, setLocale, setChannel, demoResetKey, resetDemo, startDemo } = useAppContext();
  const t = UI_STRINGS[locale];
  const [menuOpen, setMenuOpen] = useState(false);

  function go(id: string) {
    setMenuOpen(false);
    setChannel("web");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (id === "ask") {
        document.getElementById("ask-input")?.focus();
      } else {
        target?.focus({ preventScroll: true });
      }
    }, 0);
  }

  return (
    <header className="site-header">
      <div className="site-bar">
        <a className="wordmark" href="#content">
          Farm Expert
        </a>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {t.menu}
        </button>
        <nav id="site-nav" className={menuOpen ? "site-nav open" : "site-nav"} aria-label={t.channels}>
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(event) => {
                event.preventDefault();
                go(item.id);
              }}
            >
              {t[item.key]}
            </a>
          ))}
        </nav>
        <div className="site-tools">
          <div className="header-controls" role="group" aria-label={locale === "sw" ? "Lugha" : "Language"}>
            <button
              type="button"
              className={`pill-button ${locale === "en" ? "active" : ""}`}
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
            >
              {t.english}
            </button>
            <button
              type="button"
              className={`pill-button ${locale === "sw" ? "active" : ""}`}
              onClick={() => setLocale("sw")}
              aria-pressed={locale === "sw"}
            >
              {t.kiswahili}
            </button>
          </div>
          <HelpDialog />
          <ConnectivityBar compact />
        </div>
      </div>

      <div className="hero">
        <p className="eyebrow">{t.heroEyebrow}</p>
        <h1 className="hero-title">{t.heroTitle}</h1>
        <p className="hero-support">{t.heroSupport}</p>
        <button type="button" className="btn-primary hero-cta" onClick={() => go("ask")}>
          {t.heroCta}
          <span className="cta-arrow" aria-hidden="true">
            →
          </span>
        </button>
        <div className="demo-bar">
          <button type="button" className="text-button" onClick={() => startDemo()}>
            {locale === "sw" ? "Anzisha onyesho" : "Start demo"}
          </button>
          {import.meta.env.PROD ? null : (
            <button type="button" className="text-button" onClick={() => resetDemo()}>
              {locale === "sw" ? "Anzisha upya" : "Reset demo"}
            </button>
          )}
          <span className="demo-run">{locale === "sw" ? `Onyesho #${demoResetKey + 1}` : `Demo run #${demoResetKey + 1}`}</span>
        </div>
      </div>
    </header>
  );
}

export function ConnectivityBar({ compact = false }: { compact?: boolean }) {
  const { locale, browserOnline, status, statusSource } = useAppContext();
  const t = UI_STRINGS[locale];
  const previousOnline = useRef(browserOnline);
  const [backOnline, setBackOnline] = useState(false);
  const waitingForFirstCheck = status === undefined && browserOnline;
  const serviceReachable = browserOnline && (statusSource === "live" || waitingForFirstCheck);

  useEffect(() => {
    if (!previousOnline.current && browserOnline) {
      setBackOnline(true);
      const timer = window.setTimeout(() => setBackOnline(false), 4000);
      previousOnline.current = browserOnline;
      return () => window.clearTimeout(timer);
    }
    previousOnline.current = browserOnline;
  }, [browserOnline]);

  const mode = backOnline ? "back" : serviceReachable ? "online" : "offline";
  const text = mode === "back" ? t.statusBack : mode === "online" ? t.statusOnline : t.statusOffline;

  return (
    <div className={`connect-bar ${mode} ${compact ? "compact" : ""}`} role="status">
      <span className={`status-dot ${mode === "offline" ? "offline" : "online"}`} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
