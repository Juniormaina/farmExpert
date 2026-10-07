import { COUNTIES, CROPS } from "../../../server/src/shared/crops";
import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

export function PriceFilters() {
  const { county, setCounty, crop, setCrop, locale } = useAppContext();
  const t = UI_STRINGS[locale];
  return (
    <div className="price-filters" id="crops" tabIndex={-1}>
      <div className="filter-row" role="group" aria-label={t.crop}>
        <span className="filter-label">{t.crop}</span>
        {CROPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`segment ${crop === c.id ? "active" : ""}`}
            aria-pressed={crop === c.id}
            onClick={() => setCrop(c.id)}
          >
            {c.shortName[locale]}
          </button>
        ))}
      </div>
      <div className="filter-row" role="group" aria-label={t.pricesFor}>
        <span className="filter-label">{t.pricesFor}</span>
        {COUNTIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`segment ${county === c.value ? "active" : ""}`}
            aria-pressed={county === c.value}
            onClick={() => setCounty(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
