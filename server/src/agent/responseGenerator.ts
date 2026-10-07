import type {
  AgentIntent,
  BudgetResult,
  CropId,
  ExtractedEntities,
  FertilizerListing,
  Locale,
  MarketPrice
} from "../shared/types.js";
import { DEMO_DATA_NOTICE, UI_STRINGS } from "../shared/i18n.js";
import { agronomicRateStatus, COUNTIES, getCrop } from "../shared/crops.js";
import { availabilityLabel, classificationLabel, cropName, formatUnitPriceLong } from "../shared/format.js";

export interface ResponseData {
  marketPrices?: MarketPrice[];
  fertilizerListings?: FertilizerListing[];
  budget?: BudgetResult;
  missingForBudget?: string[];
}

const MISSING_FIELD_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    crop: "which crop you are planning to grow",
    county: "which county you are farming in",
    farmSizeAcres: "how many acres you are planning",
    budgetKsh: "your budget in KSh",
    listing: "a fertilizer listing for that county"
  },
  sw: {
    crop: "zao unalopanga kupanda",
    county: "eneo/county unalolima (mfano Nakuru)",
    farmSizeAcres: "ekari ngapi unazopanga",
    budgetKsh: "bajeti yako kwa shilingi",
    listing: "bei ya mbolea kwa eneo hilo"
  }
};

function formatMarketPrices(prices: MarketPrice[], crop: CropId, county: string | undefined, locale: Locale): string {
  const name = cropName(crop, locale);
  if (prices.length === 0) {
    const where = county ? COUNTIES.find((c) => c.value === county)?.label ?? county : undefined;
    if (locale === "sw") {
      return where
        ? `Sina bei za ${name.toLowerCase()} kwa ${where} kwenye taarifa za mfano.`
        : `Sina bei za ${name.toLowerCase()} kwa sasa.`;
    }
    return where ? `I don't have ${name.toLowerCase()} prices for ${where} in the demo data.` : `I don't have ${name.toLowerCase()} prices yet.`;
  }
  const lines = prices.map((p) => `- ${p.market} (${p.county}): ${formatUnitPriceLong(p, locale)} (${classificationLabel(p.classification, locale)})`);
  const header = locale === "sw" ? `Bei za ${name.toLowerCase()}:` : `${name} prices:`;
  return [header, ...lines].join("\n");
}

function formatFertilizerListings(listings: FertilizerListing[], locale: Locale): string {
  if (listings.length === 0) {
    return locale === "sw" ? "Sina taarifa za mbolea kwa eneo hilo kwa sasa." : "I don't have fertilizer listings for that area yet.";
  }
  const lines = listings.map((f) =>
    locale === "sw"
      ? `- ${f.type} (${f.packageSizeKg}kg) kutoka ${f.supplier}: KSh ${f.pricePerBag.toLocaleString()} (${availabilityLabel(f.availability, locale)})`
      : `- ${f.type} (${f.packageSizeKg}kg) from ${f.supplier}: KSh ${f.pricePerBag.toLocaleString()} (${availabilityLabel(f.availability, locale)})`
  );
  const header = locale === "sw" ? "Bei za mbolea:" : "Fertilizer prices:";
  return [header, ...lines].join("\n");
}

function formatBudget(budget: BudgetResult, locale: Locale): string {
  const header = locale === "sw" ? "Mpango wa Bajeti:" : "Budget Plan:";
  const lines = budget.lineItems.map(
    (item) => `- ${item.label}: KSh ${item.amountKsh.toLocaleString()} (${item.detail})`
  );
  return [header, ...lines, "", ...budget.explanation, "", budget.disclaimer].join("\n");
}

function formatMissingFields(missing: string[], locale: Locale): string {
  if (missing.length === 1 && missing[0] === "crop") {
    return locale === "sw" ? "Unapanga kupanda zao gani?" : "Which crop are you planning to grow?";
  }
  const labels = missing.map((field) => MISSING_FIELD_LABELS[locale][field] ?? field);
  return locale === "sw"
    ? `Naweza kuangalia hilo. Bado nahitaji: ${labels.join(", ")}.`
    : `I can check that. I still need: ${labels.join(", ")}.`;
}

function cropLabel(entities: ExtractedEntities, locale: Locale): string {
  if (!entities.crop) return locale === "sw" ? "zao lako" : "your crop";
  const name = cropName(entities.crop, locale).toLowerCase();
  return locale === "sw" ? name : `your ${name}`;
}

function quantityReply(entities: ExtractedEntities, locale: Locale): string {
  const crop = entities.crop ? getCrop(entities.crop) : undefined;
  // Bag counts in the catalogue are illustrations. Only a rate marked verified
  // may be turned into an application amount.
  if (crop && agronomicRateStatus(crop) === "verified" && entities.farmSizeAcres) {
    const bags = Math.ceil(entities.farmSizeAcres * crop.budgetDefaults.fertilizerBagsPerAcre);
    return locale === "sw"
      ? `Kiwango kilichokubaliwa na mtaalamu ni mifuko ${bags} kwa ekari ${entities.farmSizeAcres}. Thibitisha na afisa ugani kabla ya kununua.`
      : `The reviewed rate is ${bags} bag(s) for ${entities.farmSizeAcres} acre(s). Confirm it still fits your field with an extension officer before you buy.`;
  }
  return UI_STRINGS[locale].unverifiedRate;
}

export function buildDeterministicReply(
  intents: AgentIntent[],
  entities: ExtractedEntities,
  locale: Locale,
  data: ResponseData
): string {
  const sections: string[] = [];

  if (intents.includes("agricultural_distress")) {
    sections.push(UI_STRINGS[locale].distress.replaceAll("{crop}", cropLabel(entities, locale)));
  } else if (intents.includes("unsupported_claim")) {
    sections.push(UI_STRINGS[locale].noGuarantee);
  } else if (intents.includes("fertilizer_quantity")) {
    sections.push(quantityReply(entities, locale));
  } else {
    if (intents.includes("greeting")) {
      sections.push(UI_STRINGS[locale].greeting);
    }
    if (intents.includes("help")) {
      sections.push(UI_STRINGS[locale].help);
    }
    if (intents.includes("crop_price") && data.marketPrices && entities.crop) {
      sections.push(formatMarketPrices(data.marketPrices, entities.crop, entities.county, locale));
    }
    if ((intents.includes("fertilizer_price") || intents.includes("fertilizer_availability")) && data.fertilizerListings) {
      sections.push(formatFertilizerListings(data.fertilizerListings, locale));
    }
    if (intents.includes("budget_plan")) {
      if (data.budget) {
        sections.push(formatBudget(data.budget, locale));
      } else if (data.missingForBudget && data.missingForBudget.length > 0) {
        sections.push(formatMissingFields(data.missingForBudget, locale));
      }
    }
    if (intents.includes("unknown")) {
      sections.push(UI_STRINGS[locale].clarify);
    }
  }

  sections.push(DEMO_DATA_NOTICE[locale]);

  return sections.filter(Boolean).join("\n\n");
}
