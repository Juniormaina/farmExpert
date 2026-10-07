import { useEffect, useState } from "react";
import { COUNTIES } from "../../../server/src/shared/crops";
import { classificationLabel, cropName, formatUnitPrice } from "../../../server/src/shared/format";
import { getMarkets, type Sourced } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { highestPrice } from "../insights";
import type { MarketPrice } from "../types";
import { SourceTag } from "./SourceTag";
import { trustLine } from "../trust";

export function MarketCards() {
  const { locale, county, crop, demoResetKey } = useAppContext();
  const t = UI_STRINGS[locale];
  const [result, setResult] = useState<Sourced<MarketPrice[]> | undefined>(undefined);

  useEffect(() => {
    getMarkets({ crop, county }).then(setResult);
  }, [crop, county, demoResetKey]);

  if (!result) {
    return (
      <section className="card" id="markets" tabIndex={-1} aria-busy="true">
        <h2>{t.marketsTitle.replace("{crop}", locale === "sw" ? cropName(crop, locale).toLowerCase() : cropName(crop, locale))}</h2>
        <p className="loading-state" role="status">
          {t.thinking}
        </p>
      </section>
    );
  }
  const best = result.data.length > 1 ? highestPrice(result.data) : undefined;
  const name = cropName(crop, locale);
  const countyLabel = COUNTIES.find((c) => c.value === county)?.label ?? county;

  return (
    <section className="card" id="markets" tabIndex={-1}>
      <h2>{t.marketsTitle.replace("{crop}", locale === "sw" ? name.toLowerCase() : name)}</h2>
      {result.data.length === 0 ? (
        <p className="empty-state">{t.noPricesHere.replace("{crop}", name.toLowerCase()).replace("{county}", countyLabel)}</p>
      ) : (
        <>
          {best && (
            <div className="price-feature">
              <p className="eyebrow">{name}</p>
              <p className="price-feature-kicker">{t.demoEstimate}</p>
              <p className="price-feature-value">{formatUnitPrice(best, locale)}</p>
              <p className="price-feature-meta">
                {best.market} · {countyLabel} · {classificationLabel(best.classification, locale)}
              </p>
            </div>
          )}
          <div className="data-grid">
          {result.data.map((p) => {
            const isBest = p === best;
            return (
              <article className={`data-tile ${isBest ? "highlight" : ""}`} key={`${p.market}-${p.classification}`}>
                {isBest && <span className="tile-flag">{t.bestPrice}</span>}
                <div className="tile-title">{p.market}</div>
                <div className="tile-price">{formatUnitPrice(p, locale)}</div>
                <div className="tile-meta">
                  {p.county} · {classificationLabel(p.classification, locale)}
                </div>
                <span className="badge demo">{locale === "sw" ? "MFANO" : "DEMO"}</span>
              </article>
            );
          })}
        </div>
        </>
      )}
      <p className="trust-line">{result.data[0] ? trustLine(result.data[0], locale) : t.demoDataNotice}</p>
      <p className="demo-notice">{t.demoDataNotice}</p>
      <SourceTag source={result.source} cachedAt={result.cachedAt} locale={locale} />
    </section>
  );
}
