import type { AgentResponse, BudgetResult, ExtractedEntities, FertilizerType, Locale } from "../types";
import { LOCAL_FERTILIZER_LISTINGS, LOCAL_MARKET_PRICES } from "./localData";
import { calculateBudgetLocally } from "./localBudget";

const COUNTY_ALIASES: Record<string, string> = { nakuru: "Nakuru", eldoret: "Uasin Gishu", "uasin gishu": "Uasin Gishu" };
const SWAHILI_MARKERS = ["bei", "mahindi", "mbolea", "ekari", "bajeti", "habari", "ngapi", "nataka", "sokoni", "shilingi"];
const FERT_PATTERNS: Array<[FertilizerType, RegExp]> = [
  ["DAP", /\bdap\b/i],
  ["NPK", /\bnpk\b/i],
  ["UREA", /\burea\b/i],
  ["CAN", /\bcan\b/i]
];
const SWAHILI_NUMBERS: Record<string, number> = { moja: 1, mbili: 2, tatu: 3, nne: 4, tano: 5 };

function detectLocale(message: string): Locale {
  const lower = message.toLowerCase();
  return SWAHILI_MARKERS.some((w) => new RegExp(`\\b${w}\\b`).test(lower)) ? "sw" : "en";
}

function extractEntities(message: string): ExtractedEntities {
  const lower = message.toLowerCase();
  const entities: ExtractedEntities = {};

  for (const [alias, county] of Object.entries(COUNTY_ALIASES)) {
    if (lower.includes(alias)) {
      entities.county = county;
      break;
    }
  }
  for (const [type, pattern] of FERT_PATTERNS) {
    if (pattern.test(message)) {
      entities.fertilizerType = type;
      break;
    }
  }
  const digitFarm = lower.match(/(\d+(?:\.\d+)?)\s*(acre|acres|ekari)/);
  if (digitFarm) entities.farmSizeAcres = parseFloat(digitFarm[1]);
  else {
    const wordFarm = lower.match(/ekari\s+([a-z]+)/);
    if (wordFarm && SWAHILI_NUMBERS[wordFarm[1]] !== undefined) entities.farmSizeAcres = SWAHILI_NUMBERS[wordFarm[1]];
  }
  const budgetMatch = lower.match(/(?:ksh|shilingi|budget of|bajeti)\D{0,6}([\d,]{3,})/);
  if (budgetMatch) entities.budgetKsh = parseFloat(budgetMatch[1].replace(/,/g, ""));

  if (/maize|mahindi|corn/.test(lower)) entities.crop = "maize";
  return entities;
}

/**
 * Minimal offline mirror of the server's deterministic agent, used only when
 * the browser cannot reach the backend at all. Never calls any AI provider,
 * it is the last-resort "no model available" fallback the offline spec requires.
 */
export function answerLocally(message: string, localeHint?: Locale): AgentResponse {
  const locale = localeHint ?? detectLocale(message);
  const lower = message.toLowerCase();
  const entities = extractEntities(message);

  const wantsMaize = /maize|mahindi|corn/.test(lower);
  const wantsFertilizer = /fertilizer|mbolea/.test(lower) || Boolean(entities.fertilizerType);
  const wantsBudget = /budget|bajeti|panga|plan/.test(lower) || (entities.budgetKsh !== undefined && entities.farmSizeAcres !== undefined);

  const sections: string[] = [
    locale === "sw"
      ? "Uko nje ya mtandao. Hii ni taarifa iliyohifadhiwa kwenye kifaa chako, si bei ya moja kwa moja."
      : "You're offline. This is cached on-device data, not a live quote."
  ];

  const marketPrices = wantsMaize
    ? LOCAL_MARKET_PRICES.filter((p) => !entities.county || p.county === entities.county)
    : undefined;
  if (marketPrices) {
    sections.push(
      marketPrices
        .map((p) => `- ${p.market}: KSh ${p.pricePerBag.toLocaleString()}/${p.bagSizeKg}kg (${p.classification})`)
        .join("\n")
    );
  }

  const fertilizerListings = wantsFertilizer
    ? LOCAL_FERTILIZER_LISTINGS.filter(
        (f) => (!entities.fertilizerType || f.type === entities.fertilizerType) && (!entities.county || f.county === entities.county)
      )
    : undefined;
  if (fertilizerListings) {
    sections.push(
      fertilizerListings.map((f) => `- ${f.type}: KSh ${f.pricePerBag.toLocaleString()} (${f.availability})`).join("\n")
    );
  }

  let budget: BudgetResult | undefined;
  if (wantsBudget && entities.county && entities.farmSizeAcres !== undefined && entities.budgetKsh !== undefined) {
    try {
      budget = calculateBudgetLocally(
        {
          county: entities.county,
          farmSizeAcres: entities.farmSizeAcres,
          budgetKsh: entities.budgetKsh,
          fertilizerType: entities.fertilizerType ?? "DAP"
        },
        locale
      );
      sections.push(budget.explanation.join(" "));
    } catch {
      sections.push(locale === "sw" ? "Sikuweza kupanga bajeti nje ya mtandao kwa data hii." : "I couldn't compute an offline budget for this input.");
    }
  }

  return {
    reply: sections.join("\n\n"),
    locale,
    intent: wantsBudget ? "budget_plan" : wantsMaize ? "maize_price" : wantsFertilizer ? "fertilizer_price" : "unknown",
    entities,
    data: { marketPrices, fertilizerListings, budget },
    providerUsed: "deterministic"
  };
}
