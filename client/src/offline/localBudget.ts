import type { BudgetAssumptions, BudgetResult, FertilizerType, Locale } from "../types";
import { LOCAL_FERTILIZER_LISTINGS } from "./localData";

// Mirrors server/src/agriculture/budgetCalculator.ts exactly, so the same
// formula produces the same numbers whether the backend is reachable or not.
export const DEFAULT_ASSUMPTIONS: BudgetAssumptions = {
  fertilizerBagsPerAcre: 2,
  seedCostPerAcre: 1500,
  laborCostPerAcre: 3000,
  landPrepCostPerAcre: 2500,
  includeSeed: true,
  includeLabor: true,
  includeLandPrep: true
};

const AGRONOMIC_DISCLAIMER: Record<Locale, string> = {
  en: "These fertilizer application rates are illustrative, not universal agronomic advice. Confirm actual rates with a soil test or your local agricultural extension officer.",
  sw: "Kiwango cha mbolea kilichotajwa ni cha mfano tu, si ushauri wa kilimo unaofaa kila shamba. Thibitisha kiwango sahihi kwa kupima udongo au kushauriana na afisa ugani."
};

export function calculateBudgetLocally(
  input: {
    county: string;
    farmSizeAcres: number;
    budgetKsh: number;
    fertilizerType: FertilizerType;
    assumptions?: Partial<BudgetAssumptions>;
  },
  locale: Locale = "en"
): BudgetResult {
  if (input.farmSizeAcres <= 0) throw new RangeError("farmSizeAcres must be greater than zero");
  if (input.budgetKsh < 0) throw new RangeError("budgetKsh cannot be negative");

  const assumptions: BudgetAssumptions = { ...DEFAULT_ASSUMPTIONS, ...input.assumptions };
  const candidates = LOCAL_FERTILIZER_LISTINGS.filter(
    (l) => l.type === input.fertilizerType && l.county.toLowerCase().includes(input.county.toLowerCase())
  ).sort((a, b) => a.pricePerBag - b.pricePerBag);
  const listing = candidates[0];
  if (!listing) {
    throw new Error(`No offline fertilizer listing for ${input.fertilizerType} in ${input.county}`);
  }

  const fertilizerBagsNeeded = Math.ceil(input.farmSizeAcres * assumptions.fertilizerBagsPerAcre);
  const fertilizerCost = fertilizerBagsNeeded * listing.pricePerBag;

  const lineItems = [
    {
      label: locale === "sw" ? "Mbolea" : "Fertilizer",
      amountKsh: fertilizerCost,
      detail:
        locale === "sw"
          ? `${fertilizerBagsNeeded} mfuko wa ${listing.type} (${listing.packageSizeKg}kg) kwa ${listing.pricePerBag} kila mfuko`
          : `${fertilizerBagsNeeded} bag(s) of ${listing.type} (${listing.packageSizeKg}kg) at KSh ${listing.pricePerBag}/bag`
    }
  ];

  if (assumptions.includeSeed) {
    lineItems.push({
      label: locale === "sw" ? "Mbegu" : "Seed",
      amountKsh: Math.round(assumptions.seedCostPerAcre * input.farmSizeAcres),
      detail: locale === "sw" ? `KSh ${assumptions.seedCostPerAcre} kwa ekari` : `KSh ${assumptions.seedCostPerAcre}/acre`
    });
  }
  if (assumptions.includeLabor) {
    lineItems.push({
      label: locale === "sw" ? "Kibarua" : "Labor",
      amountKsh: Math.round(assumptions.laborCostPerAcre * input.farmSizeAcres),
      detail: locale === "sw" ? `KSh ${assumptions.laborCostPerAcre} kwa ekari` : `KSh ${assumptions.laborCostPerAcre}/acre`
    });
  }
  if (assumptions.includeLandPrep) {
    lineItems.push({
      label: locale === "sw" ? "Kutayarisha Shamba" : "Land Preparation",
      amountKsh: Math.round(assumptions.landPrepCostPerAcre * input.farmSizeAcres),
      detail:
        locale === "sw" ? `KSh ${assumptions.landPrepCostPerAcre} kwa ekari` : `KSh ${assumptions.landPrepCostPerAcre}/acre`
    });
  }

  const totalEstimatedCostKsh = lineItems.reduce((sum, item) => sum + item.amountKsh, 0);
  const remainingBudgetKsh = input.budgetKsh - totalEstimatedCostKsh;
  const isShortfall = remainingBudgetKsh < 0;

  const explanation =
    locale === "sw"
      ? [
          `Kwa ekari ${input.farmSizeAcres}, tunakadiria mifuko ${fertilizerBagsNeeded} ya ${listing.type} (bei za nakala ya nje-mtandao).`,
          `Gharama zote zinazokadiriwa ni KSh ${totalEstimatedCostKsh.toLocaleString()}.`,
          isShortfall
            ? `Bajeti yako haitoshi kwa KSh ${Math.abs(remainingBudgetKsh).toLocaleString()}.`
            : `Utabakiwa na KSh ${remainingBudgetKsh.toLocaleString()}.`
        ]
      : [
          `For ${input.farmSizeAcres} acre(s), we estimate ${fertilizerBagsNeeded} bag(s) of ${listing.type} (offline cached prices).`,
          `Total estimated cost is KSh ${totalEstimatedCostKsh.toLocaleString()}.`,
          isShortfall
            ? `Your budget falls short by KSh ${Math.abs(remainingBudgetKsh).toLocaleString()}.`
            : `You would have KSh ${remainingBudgetKsh.toLocaleString()} remaining.`
        ];

  return {
    input: { county: input.county, crop: "maize", farmSizeAcres: input.farmSizeAcres, budgetKsh: input.budgetKsh, fertilizerType: input.fertilizerType },
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
