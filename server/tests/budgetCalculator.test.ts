import { describe, expect, it } from "vitest";
import { calculateBudget, FertilizerUnavailableError, defaultAssumptions } from "../src/agriculture/budgetCalculator.js";

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
    const expectedFertilizerBags = Math.ceil(1 * defaultAssumptions(marysInput).fertilizerBagsPerAcre);
    expect(result.fertilizerBagsNeeded).toBe(expectedFertilizerBags);
    // Adding crops must not change Mary's demo numbers.
    expect(result.totalEstimatedCostKsh).toBe(20000);
    expect(result.remainingBudgetKsh).toBe(-8000);
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

  it("uses bean defaults: one bag of DAP and bean seed", () => {
    const result = calculateBudget({ ...marysInput, crop: "beans" });
    // 1 x 6,500 DAP + 4,000 seed + 3,000 labour + 2,500 land preparation
    expect(result.totalEstimatedCostKsh).toBe(16000);
    expect(result.explanation[0]).toContain("beans");
  });

  it("budgets for seed potatoes, the biggest cost of a potato crop", () => {
    const result = calculateBudget({ ...marysInput, crop: "potatoes" });
    // 4 x 6,500 DAP + 30,000 seed potatoes + 8,000 labour + 4,000 land preparation
    expect(result.totalEstimatedCostKsh).toBe(68000);
    expect(result.lineItems.map((i) => i.label)).toContain("Seed potatoes");
  });

  it("treats tea as upkeep of an established farm, with no planting or land preparation", () => {
    const result = calculateBudget({ ...marysInput, crop: "tea", county: "Kericho", fertilizerType: "NPK" });
    // 4 x 5,700 NPK + 15,000 labour
    expect(result.totalEstimatedCostKsh).toBe(37800);
    expect(result.lineItems.map((i) => i.label)).toEqual(["Fertilizer", "Labor"]);
    expect(result.explanation.join(" ")).toContain("established");
  });

  it("warns that the tomato budget leaves out spraying and staking", () => {
    const result = calculateBudget({ ...marysInput, crop: "tomatoes" }, "sw");
    expect(result.explanation.join(" ")).toContain("dawa");
  });
});
