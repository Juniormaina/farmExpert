// Pure budget arithmetic with no database access. The server wraps it with a
// fertilizer price lookup; the web client imports it directly for offline use,
// so both always produce the same numbers.
import type { BudgetAssumptions, BudgetInput, BudgetLineItem, BudgetResult, FertilizerListing, Locale } from "../shared/types.js";
import { getCrop } from "../shared/crops.js";
import { AGRONOMIC_DISCLAIMER } from "../shared/i18n.js";
import { formatKsh } from "../shared/format.js";

export function defaultAssumptions(input: Pick<BudgetInput, "crop">): BudgetAssumptions {
  return { ...getCrop(input.crop).budgetDefaults };
}

export function validateBudgetInput(input: Pick<BudgetInput, "farmSizeAcres" | "budgetKsh">): void {
  if (input.farmSizeAcres <= 0) {
    throw new RangeError("farmSizeAcres must be greater than zero");
  }
  if (input.budgetKsh < 0) {
    throw new RangeError("budgetKsh cannot be negative");
  }
}

export function computeBudget(input: BudgetInput, listing: FertilizerListing, locale: Locale = "en"): BudgetResult {
  validateBudgetInput(input);

  const crop = getCrop(input.crop);
  const assumptions: BudgetAssumptions = { ...crop.budgetDefaults, ...input.assumptions };
  const acres = input.farmSizeAcres;
  const perAcre = (rate: number) => (locale === "sw" ? `KSh ${rate} kwa ekari x ${acres} ekari` : `KSh ${rate}/acre x ${acres} acre(s)`);

  const fertilizerBagsNeeded = Math.ceil(acres * assumptions.fertilizerBagsPerAcre);
  const lineItems: BudgetLineItem[] = [
    {
      label: locale === "sw" ? "Mbolea" : "Fertilizer",
      amountKsh: fertilizerBagsNeeded * listing.pricePerBag,
      detail:
        locale === "sw"
          ? `${fertilizerBagsNeeded} mfuko wa ${listing.type} (${listing.packageSizeKg}kg) kwa ${listing.pricePerBag} kila mfuko kutoka ${listing.supplier}`
          : `${fertilizerBagsNeeded} bag(s) of ${listing.type} (${listing.packageSizeKg}kg) at KSh ${listing.pricePerBag}/bag from ${listing.supplier}`
    }
  ];

  if (assumptions.includeSeed) {
    lineItems.push({
      label: crop.seedLabel[locale],
      amountKsh: Math.round(assumptions.seedCostPerAcre * acres),
      detail: perAcre(assumptions.seedCostPerAcre)
    });
  }
  if (assumptions.includeLabor) {
    lineItems.push({
      label: locale === "sw" ? "Kibarua" : "Labor",
      amountKsh: Math.round(assumptions.laborCostPerAcre * acres),
      detail: perAcre(assumptions.laborCostPerAcre)
    });
  }
  if (assumptions.includeLandPrep) {
    lineItems.push({
      label: locale === "sw" ? "Kutayarisha Shamba" : "Land Preparation",
      amountKsh: Math.round(assumptions.landPrepCostPerAcre * acres),
      detail: perAcre(assumptions.landPrepCostPerAcre)
    });
  }

  const totalEstimatedCostKsh = lineItems.reduce((sum, item) => sum + item.amountKsh, 0);
  const remainingBudgetKsh = input.budgetKsh - totalEstimatedCostKsh;
  const isShortfall = remainingBudgetKsh < 0;
  const cropWord = crop.name[locale].toLowerCase();

  const explanation =
    locale === "sw"
      ? [
          `Kwa ekari ${acres} ya ${cropWord} ${input.county}, tunakadiria mifuko ${fertilizerBagsNeeded} ya ${listing.type}.`,
          `Gharama zote zinazokadiriwa ni ${formatKsh(totalEstimatedCostKsh)}.`,
          isShortfall
            ? `Bajeti yako ya ${formatKsh(input.budgetKsh)} haitoshi kwa ${formatKsh(Math.abs(remainingBudgetKsh))}.`
            : `Utabakiwa na ${formatKsh(remainingBudgetKsh)} kutoka bajeti yako ya ${formatKsh(input.budgetKsh)}.`
        ]
      : [
          `For ${acres} acre(s) of ${cropWord} in ${input.county}, we estimate ${fertilizerBagsNeeded} bag(s) of ${listing.type}.`,
          `Total estimated cost is ${formatKsh(totalEstimatedCostKsh)}.`,
          isShortfall
            ? `Your budget of ${formatKsh(input.budgetKsh)} falls short by ${formatKsh(Math.abs(remainingBudgetKsh))}.`
            : `You would have ${formatKsh(remainingBudgetKsh)} remaining from your ${formatKsh(input.budgetKsh)} budget.`
        ];
  if (crop.budgetNote) explanation.push(crop.budgetNote[locale]);

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

// Cheapest listing of the requested fertilizer in the county. Shared by the
// server's database lookup and the client's offline lookup.
export function cheapestListing(listings: FertilizerListing[], input: Pick<BudgetInput, "fertilizerType" | "county">) {
  return listings
    .filter((l) => l.type === input.fertilizerType && l.county.toLowerCase().includes(input.county.toLowerCase()))
    .sort((a, b) => a.pricePerBag - b.pricePerBag)[0];
}
