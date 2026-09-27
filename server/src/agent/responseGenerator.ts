import type {
  AgentIntent,
  BudgetResult,
  ExtractedEntities,
  FertilizerListing,
  Locale,
  MarketPrice
} from "../shared/types.js";
import { DEMO_DATA_NOTICE, UI_STRINGS } from "../shared/i18n.js";

export interface ResponseData {
  marketPrices?: MarketPrice[];
  fertilizerListings?: FertilizerListing[];
  budget?: BudgetResult;
  missingForBudget?: string[];
}

const MISSING_FIELD_LABELS: Record<Locale, Record<string, string>> = {
  en: { county: "county (e.g. Nakuru)", farmSizeAcres: "farm size in acres", budgetKsh: "budget in KSh" },
  sw: { county: "eneo/county (mfano Nakuru)", farmSizeAcres: "ukubwa wa shamba kwa ekari", budgetKsh: "bajeti kwa shilingi" }
};

function formatMarketPrices(prices: MarketPrice[], locale: Locale): string {
  if (prices.length === 0) {
    return locale === "sw" ? "Sina bei za mahindi kwa eneo hilo kwa sasa." : "I don't have maize prices for that area yet.";
  }
  const lines = prices.map((p) =>
    locale === "sw"
      ? `- ${p.market} (${p.county}): KSh ${p.pricePerBag.toLocaleString()} kwa mfuko wa ${p.bagSizeKg}kg (${p.classification})`
      : `- ${p.market} (${p.county}): KSh ${p.pricePerBag.toLocaleString()} per ${p.bagSizeKg}kg bag (${p.classification})`
  );
  const header = locale === "sw" ? "Bei za mahindi:" : "Maize prices:";
  return [header, ...lines].join("\n");
}

function formatFertilizerListings(listings: FertilizerListing[], locale: Locale): string {
  if (listings.length === 0) {
    return locale === "sw" ? "Sina taarifa za mbolea kwa eneo hilo kwa sasa." : "I don't have fertilizer listings for that area yet.";
  }
  const availabilityLabel = (a: FertilizerListing["availability"], locale: Locale) => {
    const map: Record<string, Record<Locale, string>> = {
      in_stock: { en: "in stock", sw: "ipo" },
      low_stock: { en: "low stock", sw: "kidogo tu" },
      out_of_stock: { en: "out of stock", sw: "haipo" },
      unknown: { en: "unknown", sw: "haijulikani" }
    };
    return map[a][locale];
  };
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
  const labels = missing.map((m) => MISSING_FIELD_LABELS[locale][m] ?? m);
  return locale === "sw"
    ? `Ili nikusaidie kupanga bajeti, nihitaji: ${labels.join(", ")}.`
    : `To help you plan a budget, I need: ${labels.join(", ")}.`;
}

export function buildDeterministicReply(
  intents: AgentIntent[],
  entities: ExtractedEntities,
  locale: Locale,
  data: ResponseData
): string {
  const sections: string[] = [];

  if (intents.includes("greeting")) {
    sections.push(UI_STRINGS[locale].greeting);
  }
  if (intents.includes("help")) {
    sections.push(UI_STRINGS[locale].help);
  }
  if (intents.includes("maize_price") && data.marketPrices) {
    sections.push(formatMarketPrices(data.marketPrices, locale));
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
    sections.push(UI_STRINGS[locale].help);
  }

  sections.push(DEMO_DATA_NOTICE[locale]);

  return sections.filter(Boolean).join("\n\n");
}
