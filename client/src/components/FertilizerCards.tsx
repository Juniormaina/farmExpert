import { useEffect, useState } from "react";
import { getFertilizer, type Sourced } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { cheapestAvailable, formatKsh, savingVersusDearest } from "../insights";
import type { FertilizerListing } from "../types";
import { SourceTag } from "./SourceTag";
import { trustLine } from "../trust";

const AVAILABILITY_LABEL: Record<FertilizerListing["availability"], { en: string; sw: string }> = {
  in_stock: { en: "In stock", sw: "Ipo" },
  low_stock: { en: "Low stock", sw: "Kidogo tu" },
  out_of_stock: { en: "Out of stock", sw: "Haipo" },
  unknown: { en: "Unknown", sw: "Haijulikani" }
};

export function FertilizerCards() {
  const { locale, county, demoResetKey } = useAppContext();
  const t = UI_STRINGS[locale];
  const [result, setResult] = useState<Sourced<FertilizerListing[]> | undefined>(undefined);

  useEffect(() => {
    getFertilizer(undefined, county).then(setResult);
  }, [county, demoResetKey]);

  if (!result) {
    return (
      <section className="card" id="fertilizer" tabIndex={-1} aria-busy="true">
        <h2>{t.fertilizerTitle}</h2>
        <p className="loading-state" role="status">
          {t.thinking}
        </p>
      </section>
    );
  }
  const sorted = result.data.slice().sort((a, b) => a.pricePerBag - b.pricePerBag);
  const cheapest = cheapestAvailable(sorted);
  const saving = savingVersusDearest(sorted);

  return (
    <section className="card" id="fertilizer" tabIndex={-1}>
      <h2>{t.fertilizerTitle}</h2>
      {sorted.length === 0 ? (
        <p className="empty-state">{t.noPricesHere.replace("{crop}", t.fertilizer.toLowerCase()).replace("{county}", county)}</p>
      ) : (
        <>
          {cheapest && (
            <div className="best-option">
              <p className="best-option-kicker">{t.cheapest}</p>
              <p className="best-option-name">{cheapest.type}</p>
              <p className="best-option-price">KSh {cheapest.pricePerBag.toLocaleString()}</p>
              {saving !== undefined && <p className="best-option-saving">{t.savingVsDearest.replace("{amount}", formatKsh(saving))}</p>}
            </div>
          )}
          <div className="data-grid">
        {sorted.map((f) => {
          const isCheapest = f === cheapest;
          const unavailable = f.availability === "out_of_stock";
          return (
            <article
              className={`data-tile ${isCheapest ? "highlight" : ""} ${unavailable ? "unavailable" : ""}`}
              key={`${f.type}-${f.supplier}`}
            >
              {isCheapest && <span className="tile-flag">{t.cheapest}</span>}
              <div className="tile-title">
                {f.type} ({f.packageSizeKg}kg)
              </div>
              <div className="tile-price">KSh {f.pricePerBag.toLocaleString()}</div>
              <div className="tile-meta">{f.supplier}</div>
              <span className={`badge ${f.availability}`}>{AVAILABILITY_LABEL[f.availability][locale]}</span>
            </article>
          );
        })}
          </div>
        </>
      )}
      <p className="trust-line">{result.data[0] ? trustLine(result.data[0], locale) : null}</p>
      <p className="demo-notice">
        {locale === "sw"
          ? "Wasambazaji hapa ni wa mfano tu kwa madhumuni ya onyesho."
          : "Suppliers shown here are fictional, for demonstration purposes only."}
      </p>
      <SourceTag source={result.source} cachedAt={result.cachedAt} locale={locale} />
    </section>
  );
}
