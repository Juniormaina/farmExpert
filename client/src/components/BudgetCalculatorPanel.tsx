import { useEffect, useRef, useState } from "react";
import { calculateBudget } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { userFacingError } from "../errors";
import { UI_STRINGS } from "../i18n";
import { formatKsh } from "../insights";
import { COUNTIES, CROPS, getCrop } from "../../../server/src/shared/crops";
import { loadFarmProfile } from "../profile";
import type { BudgetAssumptions, BudgetResult, CropId, FertilizerType } from "../types";

const FERTILIZER_TYPES: FertilizerType[] = ["DAP", "NPK", "UREA", "CAN"];
const RECALC_DELAY_MS = 350;

type CostKey = "seedCostPerAcre" | "laborCostPerAcre" | "landPrepCostPerAcre";
type IncludeKey = "includeSeed" | "includeLabor" | "includeLandPrep";

export function BudgetCalculatorPanel() {
  const { locale, demoProfile, county, setCounty, crop, setCrop } = useAppContext();
  const t = UI_STRINGS[locale];
  const savedFarm = loadFarmProfile();

  const [farmSize, setFarmSize] = useState(savedFarm?.farmSizeAcres ?? demoProfile.farmSizeAcres);
  const [budget, setBudget] = useState(savedFarm?.budgetKsh ?? demoProfile.budgetKsh);
  const [fertilizerType, setFertilizerType] = useState<FertilizerType>(getCrop(crop).defaultFertilizer);
  const [assumptions, setAssumptions] = useState<BudgetAssumptions>(getCrop(crop).budgetDefaults);
  const [assumptionsCrop, setAssumptionsCrop] = useState<CropId>(crop);

  // A new crop brings its own seed, labour and fertilizer defaults. Adjusting
  // state during render (rather than in an effect) avoids one budget request
  // going out with the previous crop's numbers.
  if (assumptionsCrop !== crop) {
    setAssumptionsCrop(crop);
    setAssumptions(getCrop(crop).budgetDefaults);
    setFertilizerType(getCrop(crop).defaultFertilizer);
  }
  const [result, setResult] = useState<{ data: BudgetResult; source: string } | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [updating, setUpdating] = useState(false);
  const requestId = useRef(0);

  const inputsValid = farmSize > 0 && budget >= 0 && assumptions.fertilizerBagsPerAcre >= 0;

  useEffect(() => {
    if (!inputsValid) {
      setError(t.invalidInput);
      return;
    }
    setError(undefined);
    setUpdating(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await calculateBudget({ county, crop, farmSizeAcres: farmSize, budgetKsh: budget, fertilizerType, assumptions, locale });
        // A slower earlier request must not overwrite the answer to a newer one.
        if (id === requestId.current) setResult(res);
      } catch (err) {
        if (id === requestId.current) setError(userFacingError(err, t.serviceError));
      } finally {
        if (id === requestId.current) setUpdating(false);
      }
    }, RECALC_DELAY_MS);
    return () => clearTimeout(timer);
  }, [county, crop, farmSize, budget, fertilizerType, assumptions, locale, inputsValid, t.invalidInput, t.serviceError]);

  function adjustFarm(delta: number) {
    setFarmSize((current) => Math.max(0.5, Math.round((current + delta) * 10) / 10));
  }

  function setCost(key: CostKey, value: number) {
    setAssumptions((a) => ({ ...a, [key]: Math.max(0, value) }));
  }
  function toggle(key: IncludeKey) {
    setAssumptions((a) => ({ ...a, [key]: !a[key] }));
  }

  const data = result?.data;
  const coverage = data && data.totalEstimatedCostKsh > 0 ? Math.min(100, Math.round((budget / data.totalEstimatedCostKsh) * 100)) : 100;
  const biggest = data?.lineItems.reduce((max, item) => (item.amountKsh > max.amountKsh ? item : max), data.lineItems[0]);

  const costRows: Array<{ cost: CostKey; include: IncludeKey; label: string }> = [
    { cost: "seedCostPerAcre", include: "includeSeed", label: t.seedCost },
    { cost: "laborCostPerAcre", include: "includeLabor", label: t.laborCost },
    { cost: "landPrepCostPerAcre", include: "includeLandPrep", label: t.landPrepCost }
  ];

  return (
    <section className="card" id="budget" tabIndex={-1}>
      <div className="card-heading">
        <h2>{t.budgetTitle}</h2>
        <p className="basis-line">
          {t.basedOn
            .replace("{size}", `${farmSize} ${farmSize === 1 ? t.acre : t.acres}`)
            .replace("{budget}", formatKsh(budget))}
        </p>
        {updating && <span className="updating">{t.updating}</span>}
      </div>

      <div className="budget-body">
        <div className="budget-inputs">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="budget-crop">{t.crop}</label>
              <select id="budget-crop" value={crop} onChange={(e) => setCrop(e.target.value as CropId)}>
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[locale]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="budget-county">{t.county}</label>
              <select id="budget-county" value={county} onChange={(e) => setCounty(e.target.value)}>
                {COUNTIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label === c.value ? c.label : `${c.label} (${c.value})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="budget-farm">{t.farmSize}</label>
              <div className="stepper">
                <button type="button" className="stepper-btn" onClick={() => adjustFarm(-0.5)} aria-label={t.decreaseSize}>
                  −
                </button>
                <input
                  id="budget-farm"
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={farmSize}
                  onChange={(e) => setFarmSize(parseFloat(e.target.value) || 0)}
                />
                <span className="stepper-unit">{farmSize === 1 ? t.acre : t.acres}</span>
                <button type="button" className="stepper-btn" onClick={() => adjustFarm(0.5)} aria-label={t.increaseSize}>
                  +
                </button>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="budget-amount">{t.budget}</label>
              <input
                id="budget-amount"
                type="number"
                min={0}
                step={500}
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="budget-fertilizer">{t.fertilizer}</label>
              <select id="budget-fertilizer" value={fertilizerType} onChange={(e) => setFertilizerType(e.target.value as FertilizerType)}>
                {FERTILIZER_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <details className="assumptions">
            <summary>{t.assumptions}</summary>
            <div className="assumption-row">
              <label htmlFor="bags-per-acre">{t.bagsPerAcre}</label>
              <input
                id="bags-per-acre"
                type="number"
                min={0}
                step={0.5}
                value={assumptions.fertilizerBagsPerAcre}
                onChange={(e) => setAssumptions((a) => ({ ...a, fertilizerBagsPerAcre: Math.max(0, parseFloat(e.target.value) || 0) }))}
              />
            </div>
            {costRows.map((row) => (
              <div className="assumption-row" key={row.cost}>
                <label className="assumption-check">
                  <input type="checkbox" checked={assumptions[row.include]} onChange={() => toggle(row.include)} aria-label={`${t.include}: ${row.label}`} />
                  {row.label}
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={assumptions[row.cost]}
                  disabled={!assumptions[row.include]}
                  onChange={(e) => setCost(row.cost, parseFloat(e.target.value) || 0)}
                  aria-label={row.label}
                />
              </div>
            ))}
          </details>
        </div>

        <div className="budget-output">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {!data && !error && (
            <p className="loading-state" role="status">
              {t.thinking}
            </p>
          )}

          {data && !error && (
            <div className={`budget-result ${updating ? "stale" : ""}`}>
              <div className={`budget-hero ${data.isShortfall ? "bad" : "good"}`}>
                <span className="budget-hero-label">
                  {data.isShortfall
                    ? t.overPlan.replace("{amount}", formatKsh(Math.abs(data.remainingBudgetKsh)))
                    : t.withinPlan.replace("{amount}", formatKsh(data.remainingBudgetKsh))}
                </span>
                <span className="budget-hero-value">{formatKsh(Math.abs(data.remainingBudgetKsh))}</span>
              </div>

              <div className="coverage">
                <div className="coverage-bar" role="progressbar" aria-valuenow={coverage} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`coverage-fill ${data.isShortfall ? "bad" : "good"}`} style={{ width: `${coverage}%` }} />
                </div>
                <div className="coverage-text">
                  {t.coverage.replace("{pct}", String(coverage))} ({formatKsh(budget)} / {formatKsh(data.totalEstimatedCostKsh)})
                </div>
              </div>

              {getCrop(data.input.crop).budgetNote && <p className="budget-note">{getCrop(data.input.crop).budgetNote![locale]}</p>}

              <table className="budget-table">
                <caption className="sr-only">{t.budgetTableCaption}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t.itemColumn}</th>
                    <th scope="col">{t.costColumn}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lineItems.map((item) => {
                    const isBiggest = item === biggest && data.lineItems.length > 1;
                    return (
                      <tr key={item.label}>
                        <th scope="row">
                          {item.label}
                          {isBiggest && <span className="tile-flag inline">{t.biggestCost}</span>}
                          <span className="line-item-detail">{item.detail}</span>
                        </th>
                        <td>{formatKsh(item.amountKsh)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">{t.total}</th>
                    <td>{formatKsh(data.totalEstimatedCostKsh)}</td>
                  </tr>
                </tfoot>
              </table>

              <p className="demo-notice">{data.disclaimer}</p>
              <p className="source-tag">{result.source === "live" ? t.calculatedHere : t.calculatedOffline}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
