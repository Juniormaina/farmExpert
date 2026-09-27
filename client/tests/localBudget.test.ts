import { describe, expect, it } from "vitest";
import { calculateBudgetLocally, DEFAULT_ASSUMPTIONS } from "../src/offline/localBudget";

describe("calculateBudgetLocally (offline mirror of the server calculator)", () => {
  const marysInput = { county: "Nakuru", farmSizeAcres: 1, budgetKsh: 12000, fertilizerType: "DAP" as const };

  it("matches the server's default assumptions and totals for Mary's scenario", () => {
    const result = calculateBudgetLocally(marysInput);
    expect(result.fertilizerBagsNeeded).toBe(Math.ceil(1 * DEFAULT_ASSUMPTIONS.fertilizerBagsPerAcre));
    expect(result.totalEstimatedCostKsh).toBe(result.lineItems.reduce((sum, i) => sum + i.amountKsh, 0));
    expect(result.remainingBudgetKsh).toBe(marysInput.budgetKsh - result.totalEstimatedCostKsh);
    expect(result.isShortfall).toBe(result.remainingBudgetKsh < 0);
  });

  it("flags a shortfall for Mary's KSh 12,000 budget against 1 acre of DAP", () => {
    const result = calculateBudgetLocally(marysInput);
    expect(result.isShortfall).toBe(true);
  });

  it("throws for an unsupported county/fertilizer combination", () => {
    expect(() => calculateBudgetLocally({ ...marysInput, county: "Mombasa" })).toThrow();
  });

  it("throws for non-positive farm size", () => {
    expect(() => calculateBudgetLocally({ ...marysInput, farmSizeAcres: 0 })).toThrow(RangeError);
  });

  it("produces Kiswahili line item labels when locale is sw", () => {
    const result = calculateBudgetLocally(marysInput, "sw");
    expect(result.lineItems[0].label).toBe("Mbolea");
  });
});
