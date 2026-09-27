import { cheapestListing, computeBudget } from "../../../server/src/agriculture/budgetMath";
import type { BudgetInput } from "../../../server/src/shared/types";
import type { BudgetResult, Locale } from "../types";
import { LOCAL_FERTILIZER_LISTINGS } from "./localData";

// Offline budget: the server's own arithmetic, fed from the on-device copy of
// the fertilizer prices, so offline and online answers always match.
export function calculateBudgetLocally(input: BudgetInput, locale: Locale = "en"): BudgetResult {
  const listing = cheapestListing(LOCAL_FERTILIZER_LISTINGS, input);
  if (!listing) {
    throw new Error(`No offline fertilizer listing for ${input.fertilizerType} in ${input.county}`);
  }
  return computeBudget(input, listing, locale);
}
