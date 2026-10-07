import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

export function UpdatePrompt() {
  const { locale } = useAppContext();
  const t = UI_STRINGS[locale];
  const [update, setUpdate] = useState<(() => Promise<void>) | undefined>();

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdate(() => () => updateSW(true));
      },
      onRegistered(registration) {
        if (!registration) return;
        window.setInterval(() => {
          registration.update().catch(() => undefined);
        }, 60 * 60 * 1000);
      }
    });
  }, []);

  if (!update) return null;

  return (
    <div className="update-banner" role="status">
      <p>{t.updateReady}</p>
      <button type="button" className="btn-primary" onClick={() => update()}>
        {t.updateAction}
      </button>
    </div>
  );
}
