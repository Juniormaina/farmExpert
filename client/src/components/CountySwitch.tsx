import { useAppContext } from "../context/AppContext";
import { UI_STRINGS } from "../i18n";

const COUNTIES = [
  { value: "Nakuru", label: "Nakuru" },
  { value: "Uasin Gishu", label: "Eldoret" }
];

export function CountySwitch() {
  const { county, setCounty, locale } = useAppContext();
  return (
    <div className="county-switch" role="group" aria-label={UI_STRINGS[locale].pricesFor}>
      <span className="county-switch-label">{UI_STRINGS[locale].pricesFor}</span>
      {COUNTIES.map((c) => (
        <button
          key={c.value}
          className={`segment ${county === c.value ? "active" : ""}`}
          aria-pressed={county === c.value}
          onClick={() => setCounty(c.value)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
