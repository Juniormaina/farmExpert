import { useEffect, useState } from "react";
import { COUNTIES } from "../../../server/src/shared/crops";
import { cropName, formatUnitPrice } from "../../../server/src/shared/format";
import { getMarkets, type Sourced } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { highestPrice } from "../insights";
import type { MarketPrice } from "../types";
import { SourceTag } from "./SourceTag";

export function MarketCards() {
  const { locale, county, crop, demoResetKey } = useAppContext();
  const t = UI_STRINGS[locale];
  const [result, setResult] = useState<Sourced<MarketPrice[]> | undefined>(undefined);

  useEffect(() => {
    getMarkets({ crop, county }).then(setResult);
  }, [crop, county, demoResetKey]);

  if (!result) return null;
  const best = result.data.length > 1 ? highestPrice(result.data) : undefined;
  const name = cropName(crop, locale);
  const countyLabel = COUNTIES.find((c) => c.value === county)?.label ?? county;

  return (
    <section className="card">
      <h2>{t.marketsTitle.replace("{crop}", locale === "sw" ? name.toLowerCase() : name)}</h2>
      {result.data.length === 0 ? (
        <p className="empty-state">{t.noPricesHere.replace("{crop}", name.toLowerCase()).replace("{county}", countyLabel)}</p>
      ) : (
        <div className="data-grid">
          {result.data.map((p) => {
            const isBest = p === best;
            return (
              <article className={`data-tile ${isBest ? "highlight" : ""}`} key={`${p.market}-${p.classification}`}>
                {isBest && <span className="tile-flag">{t.bestPrice}</span>}
                <div className="tile-title">{p.market}</div>
                <div className="tile-price">{formatUnitPrice(p, locale)}</div>
                <div className="tile-meta">
                  {p.county} · {p.classification}
                </div>
                <span className="badge demo">{locale === "sw" ? "MFANO" : "DEMO"}</span>
              </article>
            );
          })}
        </div>
      )}
      <p className="demo-notice">{t.demoDataNotice}</p>
      <SourceTag source={result.source} cachedAt={result.cachedAt} locale={locale} />
    </section>
  );
}
