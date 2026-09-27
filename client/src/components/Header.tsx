import { useAppContext, type StatusLabel } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

const STATUS_META: Record<StatusLabel, { dot: "online" | "degraded" | "offline"; en: string; sw: string }> = {
  "online-hosted": { dot: "online", en: "Online: hosted AI available", sw: "Mtandaoni: AI ya hosted inapatikana" },
  "offline-local-ai": { dot: "degraded", en: "Offline: local AI active", sw: "Nje ya mtandao: AI ya ndani inafanya kazi" },
  "offline-deterministic": { dot: "degraded", en: "Offline: deterministic fallback", sw: "Nje ya mtandao: majibu ya kawaida" },
  "offline-cached": { dot: "degraded", en: "Offline: cached data available", sw: "Nje ya mtandao: data iliyohifadhiwa inapatikana" },
  "waiting-for-connectivity": { dot: "offline", en: "Waiting for connectivity...", sw: "Inasubiri mtandao..." }
};

export function Header() {
  const { locale, setLocale, statusLabel, demoResetKey, resetDemo, startDemo } = useAppContext();
  const t = UI_STRINGS[locale];
  const meta = STATUS_META[statusLabel];

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="app-header-top">
          <div className="brand">
            <img src="/icon-192.png" alt="" />
            <span>SmartShambaAI</span>
          </div>
          <div className="header-controls">
            <button
              className={`pill-button ${locale === "en" ? "active" : ""}`}
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
            >
              EN
            </button>
            <button
              className={`pill-button ${locale === "sw" ? "active" : ""}`}
              onClick={() => setLocale("sw")}
              aria-pressed={locale === "sw"}
            >
              SW
            </button>
          </div>
        </div>

        <div className="hero-photo" aria-hidden="true" />

        <p className="tagline">{t.tagline}</p>
        <p className="subtitle">{t.subtitle}</p>

        <div className="status-strip">
          <span className={`status-dot ${meta.dot}`} />
          <span>{locale === "sw" ? meta.sw : meta.en}</span>
        </div>

        <div className="demo-bar">
          <button className="pill-button" onClick={() => startDemo()}>
            {locale === "sw" ? "Anzisha Demo" : "Start Demo"}
          </button>
          <button className="pill-button" onClick={() => resetDemo()}>
            {locale === "sw" ? "Anzisha upya Demo" : "Reset Demo"}
          </button>
          <span className="pill-button" style={{ opacity: 0.75, cursor: "default" }}>
            {locale === "sw" ? `Onyesho #${demoResetKey + 1}` : `Demo run #${demoResetKey + 1}`}
          </span>
        </div>
      </div>
    </header>
  );
}
