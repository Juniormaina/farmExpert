import { getCrop } from "../../../server/src/shared/crops";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

export function DemoProfileCard() {
  const { demoProfile, locale } = useAppContext();
  const t = UI_STRINGS[locale];
  const initials = demoProfile.name
    .split(" ")
    .map((p) => p[0])
    .join("");
  const cropLabel = getCrop(demoProfile.crop).name[locale].toLowerCase();
  const size = demoProfile.farmSizeAcres;
  const sizeLabel = locale === "sw" ? `${size} ekari ya ${cropLabel}` : `${size} ${size === 1 ? t.acre : t.acres} of ${cropLabel}`;

  return (
    <section className="card demo-profile-card">
      <div className="avatar-circle" aria-hidden="true">
        {initials}
      </div>
      <div>
        <p className="profile-kicker">{t.profileGreeting}</p>
        <p className="profile-name">{demoProfile.name}</p>
        <p className="profile-meta">
          {demoProfile.county} · {sizeLabel} · KSh {demoProfile.budgetKsh.toLocaleString()} {locale === "sw" ? "bajeti" : "budget"}
        </p>
      </div>
    </section>
  );
}
