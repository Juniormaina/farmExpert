import { useEffect, useState } from "react";
import { getMarkets, type Sourced } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";
import { highestMaizePrice } from "../insights";
import type { MarketPrice } from "../types";
import { SourceTag } from "./SourceTag";

export function MarketCards() {
  const { locale, county, demoResetKey } = useAppContext();
  const t = UI_STRINGS[locale];
  const [result, setResult] = useState<Sourced<MarketPrice[]> | undefined>(undefined);

  useEffect(() => {
    getMarkets(county).then(setResult);
  }, [county, demoResetKey]);

  if (!result) return null;
  const best = result.data.length > 1 ? highestMaizePrice(result.data) : undefined;

  return (
    <section className="card">
      <h2>{t.marketsTitle}</h2>
      <div className="data-grid">
        {result.data.map((p) => {
          const isBest = p === best;
          return (
            <article className={`data-tile ${isBest ? "highlight" : ""}`} key={`${p.market}-${p.classification}`}>
              {isBest && <span className="tile-flag">{t.bestPrice}</span>}
              <div className="tile-title">{p.market}</div>
              <div className="tile-price">
                KSh {p.pricePerBag.toLocaleString()} / {p.bagSizeKg}kg
              </div>
              <div className="tile-meta">
                {p.county} · {p.classification}
              </div>
              <span className="badge demo">{locale === "sw" ? "MFANO" : "DEMO"}</span>
            </article>
          );
        })}
      </div>
      <p className="demo-notice">{t.demoDataNotice}</p>
      <SourceTag source={result.source} cachedAt={result.cachedAt} locale={locale} />
    </section>
  );
}
