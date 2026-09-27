import type { BudgetInput, BudgetResult, Locale } from "../shared/types.js";
import { getFertilizerListings } from "./fertilizerService.js";
import { cheapestListing, computeBudget, validateBudgetInput } from "./budgetMath.js";

export { defaultAssumptions } from "./budgetMath.js";

export class FertilizerUnavailableError extends Error {
  constructor(type: string, county: string) {
    super(`No fertilizer listing found for ${type} in ${county}`);
    this.name = "FertilizerUnavailableError";
  }
}

export function calculateBudget(input: BudgetInput, locale: Locale = "en"): BudgetResult {
  validateBudgetInput(input);
  const listing = cheapestListing(getFertilizerListings({ type: input.fertilizerType, county: input.county }), input);
  if (!listing) {
    throw new FertilizerUnavailableError(input.fertilizerType, input.county);
  }
  return computeBudget(input, listing, locale);
}
