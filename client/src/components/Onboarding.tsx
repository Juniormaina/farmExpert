import { useEffect, useState } from "react";
import { COUNTIES, CROPS } from "../../../server/src/shared/crops";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { markOnboardingSkipped, onboardingComplete } from "../profile";
import type { CropId } from "../types";

export function Onboarding() {
  const { locale, setLocale, county, setCounty, crop, setCrop, applyFarmProfile, profileRevision } = useAppContext();
  const t = UI_STRINGS[locale];
  const [open, setOpen] = useState(() => !onboardingComplete());
  const [farmSize, setFarmSize] = useState(1);
  const [budget, setBudget] = useState(12000);

  useEffect(() => {
    setOpen(!onboardingComplete());
  }, [profileRevision]);

  if (!open) return null;

  return (
    <section className="card onboarding" aria-labelledby="onboarding-title">
      <h2 id="onboarding-title">{t.welcomeTitle}</h2>
      <p>{t.welcomeBody}</p>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="onboard-county">{t.whereFarm}</label>
          <select id="onboard-county" value={county} onChange={(event) => setCounty(event.target.value)}>
            {COUNTIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="onboard-crop">{t.whatGrow}</label>
          <select id="onboard-crop" value={crop} onChange={(event) => setCrop(event.target.value as CropId)}>
            {CROPS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name[locale]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="onboard-size">{t.farmSize}</label>
          <input
            id="onboard-size"
            type="number"
            min={0.25}
            step={0.25}
            inputMode="decimal"
            value={farmSize}
            onChange={(event) => setFarmSize(Number(event.target.value))}
          />
        </div>
        <div className="form-field">
          <label htmlFor="onboard-budget">{t.budget}</label>
          <input
            id="onboard-budget"
            type="number"
            min={0}
            step={500}
            inputMode="numeric"
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
          />
        </div>
        <div className="form-field">
          <label htmlFor="onboard-locale">{locale === "sw" ? "Lugha" : "Language"}</label>
          <select id="onboard-locale" value={locale} onChange={(event) => setLocale(event.target.value === "sw" ? "sw" : "en")}>
            <option value="en">{t.english}</option>
            <option value="sw">{t.kiswahili}</option>
          </select>
        </div>
      </div>
      <p className="onboarding-hint">{t.onboardingHint}</p>
      <div className="onboarding-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={!(farmSize > 0) || !(budget >= 0)}
          onClick={() => {
            if (!(farmSize > 0) || budget < 0) return;
            applyFarmProfile({ county, crop, farmSizeAcres: farmSize, budgetKsh: budget, locale });
            setOpen(false);
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            document.getElementById("tasks")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          }}
        >
          {t.useThisFarm}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            markOnboardingSkipped();
            setOpen(false);
          }}
        >
          {t.skipForNow}
        </button>
      </div>
    </section>
  );
}
