import type { BudgetAssumptions, BudgetInput, BudgetLineItem, BudgetResult, Locale } from "../shared/types.js";
import { getCheapestListing } from "./fertilizerService.js";
import { AGRONOMIC_DISCLAIMER } from "../shared/i18n.js";

export const DEFAULT_ASSUMPTIONS: BudgetAssumptions = {
  fertilizerBagsPerAcre: 2,
  seedCostPerAcre: 1500,
  laborCostPerAcre: 3000,
  landPrepCostPerAcre: 2500,
  includeSeed: true,
  includeLabor: true,
  includeLandPrep: true
};

export class FertilizerUnavailableError extends Error {
  constructor(type: string, county: string) {
    super(`No fertilizer listing found for ${type} in ${county}`);
    this.name = "FertilizerUnavailableError";
  }
}

export function calculateBudget(input: BudgetInput, locale: Locale = "en"): BudgetResult {
  if (input.farmSizeAcres <= 0) {
    throw new RangeError("farmSizeAcres must be greater than zero");
  }
  if (input.budgetKsh < 0) {
    throw new RangeError("budgetKsh cannot be negative");
  }

  const assumptions: BudgetAssumptions = { ...DEFAULT_ASSUMPTIONS, ...input.assumptions };

  const listing = getCheapestListing(input.fertilizerType, input.county);
  if (!listing) {
    throw new FertilizerUnavailableError(input.fertilizerType, input.county);
  }

  const fertilizerBagsNeeded = Math.ceil(input.farmSizeAcres * assumptions.fertilizerBagsPerAcre);
  const fertilizerCost = fertilizerBagsNeeded * listing.pricePerBag;

  const lineItems: BudgetLineItem[] = [
    {
      label: locale === "sw" ? "Mbolea" : "Fertilizer",
      amountKsh: fertilizerCost,
      detail:
        locale === "sw"
          ? `${fertilizerBagsNeeded} mfuko wa ${listing.type} (${listing.packageSizeKg}kg) kwa ${listing.pricePerBag} kila mfuko kutoka ${listing.supplier}`
          : `${fertilizerBagsNeeded} bag(s) of ${listing.type} (${listing.packageSizeKg}kg) at KSh ${listing.pricePerBag}/bag from ${listing.supplier}`
    }
  ];

  if (assumptions.includeSeed) {
    const seedCost = Math.round(assumptions.seedCostPerAcre * input.farmSizeAcres);
    lineItems.push({
      label: locale === "sw" ? "Mbegu" : "Seed",
      amountKsh: seedCost,
      detail:
        locale === "sw"
          ? `KSh ${assumptions.seedCostPerAcre} kwa ekari x ${input.farmSizeAcres} ekari`
          : `KSh ${assumptions.seedCostPerAcre}/acre x ${input.farmSizeAcres} acre(s)`
    });
  }

  if (assumptions.includeLabor) {
    const laborCost = Math.round(assumptions.laborCostPerAcre * input.farmSizeAcres);
    lineItems.push({
      label: locale === "sw" ? "Kibarua" : "Labor",
      amountKsh: laborCost,
      detail:
        locale === "sw"
          ? `KSh ${assumptions.laborCostPerAcre} kwa ekari x ${input.farmSizeAcres} ekari`
          : `KSh ${assumptions.laborCostPerAcre}/acre x ${input.farmSizeAcres} acre(s)`
    });
  }

  if (assumptions.includeLandPrep) {
    const landPrepCost = Math.round(assumptions.landPrepCostPerAcre * input.farmSizeAcres);
    lineItems.push({
      label: locale === "sw" ? "Kutayarisha Shamba" : "Land Preparation",
      amountKsh: landPrepCost,
      detail:
        locale === "sw"
          ? `KSh ${assumptions.landPrepCostPerAcre} kwa ekari x ${input.farmSizeAcres} ekari`
          : `KSh ${assumptions.landPrepCostPerAcre}/acre x ${input.farmSizeAcres} acre(s)`
    });
  }

  const totalEstimatedCostKsh = lineItems.reduce((sum, item) => sum + item.amountKsh, 0);
  const remainingBudgetKsh = input.budgetKsh - totalEstimatedCostKsh;
  const isShortfall = remainingBudgetKsh < 0;

  const explanation =
    locale === "sw"
      ? [
          `Kwa ekari ${input.farmSizeAcres} ya mahindi ${input.county}, tunakadiria mifuko ${fertilizerBagsNeeded} ya ${listing.type}.`,
          `Gharama zote zinazokadiriwa ni KSh ${totalEstimatedCostKsh.toLocaleString()}.`,
          isShortfall
            ? `Bajeti yako ya KSh ${input.budgetKsh.toLocaleString()} haitoshi kwa KSh ${Math.abs(remainingBudgetKsh).toLocaleString()}.`
            : `Utabakiwa na KSh ${remainingBudgetKsh.toLocaleString()} kutoka bajeti yako ya KSh ${input.budgetKsh.toLocaleString()}.`
        ]
      : [
          `For ${input.farmSizeAcres} acre(s) of maize in ${input.county}, we estimate ${fertilizerBagsNeeded} bag(s) of ${listing.type}.`,
          `Total estimated cost is KSh ${totalEstimatedCostKsh.toLocaleString()}.`,
          isShortfall
            ? `Your budget of KSh ${input.budgetKsh.toLocaleString()} falls short by KSh ${Math.abs(remainingBudgetKsh).toLocaleString()}.`
            : `You would have KSh ${remainingBudgetKsh.toLocaleString()} remaining from your KSh ${input.budgetKsh.toLocaleString()} budget.`
        ];

  return {
    input,
    assumptionsUsed: assumptions,
    fertilizerBagsNeeded,
    lineItems,
    totalEstimatedCostKsh,
    remainingBudgetKsh,
    isShortfall,
    explanation,
    disclaimer: AGRONOMIC_DISCLAIMER[locale]
  };
}
