import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import type { Channel } from "../types";

const CHANNELS: Channel[] = ["web", "sms", "ussd"];

export function ChannelSwitcher() {
  const { channel, setChannel, locale } = useAppContext();
  const t = UI_STRINGS[locale];
  const tabs: Record<Channel, { title: string; hint: string }> = {
    web: { title: t.webTab, hint: t.webTabHint },
    sms: { title: t.smsTab, hint: t.smsTabHint },
    ussd: { title: t.ussdTab, hint: t.ussdTabHint }
  };

  return (
    <nav className="channel-switcher" aria-label={t.channels}>
      <p className="eyebrow channel-label">{t.useProduct}</p>
      <div className="channel-row">
      {CHANNELS.map((c) => (
        <button
          key={c}
          type="button"
          className={`channel-tab ${channel === c ? "active" : ""}`}
          onClick={() => setChannel(c)}
          aria-pressed={channel === c}
        >
          <span className="tab-title">{tabs[c].title}</span>
          <span className="tab-hint">{tabs[c].hint}</span>
        </button>
      ))}
      </div>
    </nav>
  );
}
