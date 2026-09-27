import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import type { Channel } from "../types";

const CHANNELS: Channel[] = ["web", "sms", "ussd"];

export function ChannelSwitcher() {
  const { channel, setChannel, locale } = useAppContext();
  const t = UI_STRINGS[locale];
  const labels: Record<Channel, string> = { web: t.webTab, sms: t.smsTab, ussd: t.ussdTab };

  return (
    <nav className="channel-switcher" aria-label="Channel switcher">
      {CHANNELS.map((c) => (
        <button
          key={c}
          className={`channel-tab ${channel === c ? "active" : ""}`}
          onClick={() => setChannel(c)}
          aria-pressed={channel === c}
        >
          {labels[c]}
        </button>
      ))}
    </nav>
  );
}
