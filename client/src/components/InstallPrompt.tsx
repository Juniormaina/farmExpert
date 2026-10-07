import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "farmexpert-install-dismissed";

export function InstallPrompt() {
  const { locale } = useAppContext();
  const t = UI_STRINGS[locale];
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") setHidden(true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || !promptEvent) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }

  return (
    <aside className="install-banner">
      <p>
        <strong>{t.installTitle}</strong> {t.installBody}
      </p>
      <div className="install-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            void promptEvent?.prompt().finally(dismiss);
          }}
        >
          {t.installAction}
        </button>
        <button type="button" className="btn-secondary" onClick={dismiss}>
          {t.installDismiss}
        </button>
      </div>
    </aside>
  );
}
