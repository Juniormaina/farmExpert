import { describe, expect, it } from "vitest";
import { calculateBudget, FertilizerUnavailableError, DEFAULT_ASSUMPTIONS } from "../src/agriculture/budgetCalculator.js";

describe("calculateBudget", () => {
  const marysInput = {
    county: "Nakuru",
    crop: "maize" as const,
    farmSizeAcres: 1,
    budgetKsh: 12000,
    fertilizerType: "DAP" as const
  };

  it("computes a deterministic total for Mary's demo scenario", () => {
    const result = calculateBudget(marysInput);
    const expectedFertilizerBags = Math.ceil(1 * DEFAULT_ASSUMPTIONS.fertilizerBagsPerAcre);
    expect(result.fertilizerBagsNeeded).toBe(expectedFertilizerBags);
    expect(result.totalEstimatedCostKsh).toBe(
      result.lineItems.reduce((sum, item) => sum + item.amountKsh, 0)
    );
    expect(result.remainingBudgetKsh).toBe(marysInput.budgetKsh - result.totalEstimatedCostKsh);
    expect(result.isShortfall).toBe(result.remainingBudgetKsh < 0);
    expect(result.disclaimer.length).toBeGreaterThan(0);
  });

  it("flags a shortfall when the budget is insufficient", () => {
    const result = calculateBudget({ ...marysInput, budgetKsh: 100 });
    expect(result.isShortfall).toBe(true);
    expect(result.remainingBudgetKsh).toBeLessThan(0);
  });

  it("respects editable assumptions", () => {
    const result = calculateBudget({
      ...marysInput,
      assumptions: { includeSeed: false, includeLabor: false, includeLandPrep: false }
    });
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].label.toLowerCase()).toContain("fertilizer");
  });

  it("scales linearly with farm size", () => {
    const oneAcre = calculateBudget(marysInput);
    const twoAcres = calculateBudget({ ...marysInput, farmSizeAcres: 2 });
    expect(twoAcres.fertilizerBagsNeeded).toBe(oneAcre.fertilizerBagsNeeded * 2);
  });

  it("throws for zero or negative farm size", () => {
    expect(() => calculateBudget({ ...marysInput, farmSizeAcres: 0 })).toThrow(RangeError);
    expect(() => calculateBudget({ ...marysInput, farmSizeAcres: -1 })).toThrow(RangeError);
  });

  it("throws for negative budget", () => {
    expect(() => calculateBudget({ ...marysInput, budgetKsh: -500 })).toThrow(RangeError);
  });

  it("throws FertilizerUnavailableError for a county with no listing", () => {
    expect(() => calculateBudget({ ...marysInput, county: "Mombasa" })).toThrow(FertilizerUnavailableError);
  });

  it("produces localized Kiswahili explanations", () => {
    const result = calculateBudget(marysInput, "sw");
    expect(result.lineItems[0].label).toBe("Mbolea");
    expect(result.explanation.join(" ")).toMatch(/bajeti|ekari/i);
  });
});
