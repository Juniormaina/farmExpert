import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

export function DemoProfileCard() {
  const { demoProfile, locale } = useAppContext();
  const t = UI_STRINGS[locale];
  const initials = demoProfile.name
    .split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <section className="card demo-profile-card">
      <div className="avatar-circle">{initials}</div>
      <div>
        <div style={{ fontSize: "0.78rem", color: "var(--color-neutral-700)", fontWeight: 600 }}>
          {t.profileGreeting}
        </div>
        <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{demoProfile.name}</div>
        <div style={{ fontSize: "0.85rem", color: "var(--color-neutral-700)" }}>
          {demoProfile.county} · {demoProfile.farmSizeAcres} {locale === "sw" ? "ekari ya mahindi" : "acre(s) of maize"} ·{" "}
          KSh {demoProfile.budgetKsh.toLocaleString()} {locale === "sw" ? "bajeti" : "budget"}
        </div>
      </div>
    </section>
  );
}
