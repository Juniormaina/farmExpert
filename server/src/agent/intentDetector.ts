import type { AgentIntent, ExtractedEntities, FertilizerType, Locale } from "../shared/types.js";

export interface IntentDetectionResult {
  intents: AgentIntent[];
  primaryIntent: AgentIntent;
  entities: ExtractedEntities;
  locale: Locale;
}

const COUNTY_ALIASES: Record<string, string> = {
  nakuru: "Nakuru",
  eldoret: "Uasin Gishu",
  "uasin gishu": "Uasin Gishu"
};

const SWAHILI_MARKERS = [
  "bei",
  "mahindi",
  "mbolea",
  "shamba",
  "ekari",
  "bajeti",
  "habari",
  "ngapi",
  "nataka",
  "naweza",
  "kupanda",
  "sokoni",
  "nini",
  "asante",
  "tafadhali",
  "kuna",
  "iko",
  "pesa",
  "shilingi"
];

const GREETING_WORDS = ["habari", "hello", "hi", "hey", "mambo", "salamu"];
const HELP_WORDS = ["help", "msaada", "how do", "unawezaje", "unaweza kunifanyia nini"];
const AVAILABILITY_WORDS = ["available", "availability", "stock", "iko", "kupata", "pata"];
const BUDGET_WORDS = ["budget", "bajeti", "panga", "plan", "gharama", "kupanga"];
const MAIZE_WORDS = ["maize", "mahindi", "corn"];
const PRICE_WORDS = ["price", "bei", "cost", "gharama", "uzwa", "uzawa"];
const FERTILIZER_WORDS = ["fertilizer", "mbolea"];

const FERTILIZER_TYPE_PATTERNS: Array<[FertilizerType, RegExp]> = [
  ["DAP", /\bdap\b/i],
  ["NPK", /\bnpk\b/i],
  ["UREA", /\burea\b/i],
  ["CAN", /\bcan\b/i]
];

function detectLocale(message: string): Locale {
  const lower = message.toLowerCase();
  const swMatches = SWAHILI_MARKERS.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(lower)).length;
  return swMatches >= 1 ? "sw" : "en";
}

function extractCounty(lower: string): string | undefined {
  for (const [alias, county] of Object.entries(COUNTY_ALIASES)) {
    if (lower.includes(alias)) return county;
  }
  return undefined;
}

const SWAHILI_NUMBER_WORDS: Record<string, number> = {
  moja: 1,
  mbili: 2,
  tatu: 3,
  nne: 4,
  tano: 5,
  sita: 6,
  saba: 7,
  nane: 8,
  tisa: 9,
  kumi: 10
};

function extractFarmSize(lower: string): number | undefined {
  const digitBefore = lower.match(/(\d+(?:\.\d+)?)\s*(acre|acres|ekari)/);
  if (digitBefore) return parseFloat(digitBefore[1]);

  const digitAfter = lower.match(/(?:acre|acres|ekari)\s*(\d+(?:\.\d+)?)/);
  if (digitAfter) return parseFloat(digitAfter[1]);

  const wordAfter = lower.match(/ekari\s+([a-z]+)/);
  if (wordAfter && SWAHILI_NUMBER_WORDS[wordAfter[1]] !== undefined) {
    return SWAHILI_NUMBER_WORDS[wordAfter[1]];
  }

  return undefined;
}

function extractBudget(lower: string): number | undefined {
  const patterns = [
    /(?:ksh|kes|shilingi|sh\.?)\s*([\d,]+(?:\.\d+)?)/,
    /([\d,]+(?:\.\d+)?)\s*(?:ksh|kes|shilingi|bob)/,
    /budget of\s*([\d,]+)/,
    /budget\s*(?:ya|of)?\s*(?:ksh|shilingi)?\s*([\d,]+)/
  ];
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!Number.isNaN(value)) return value;
    }
  }
  return undefined;
}

function extractFertilizerType(message: string): FertilizerType | undefined {
  for (const [type, pattern] of FERTILIZER_TYPE_PATTERNS) {
    if (pattern.test(message)) return type;
  }
  return undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsAny(lower: string, words: string[]): boolean {
  return words.some((w) => new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(lower));
}

export function detectIntent(message: string, localeHint?: Locale): IntentDetectionResult {
  const lower = message.toLowerCase();
  const locale = localeHint ?? detectLocale(message);

  const entities: ExtractedEntities = {
    county: extractCounty(lower),
    farmSizeAcres: extractFarmSize(lower),
    budgetKsh: extractBudget(lower),
    fertilizerType: extractFertilizerType(message)
  };

  const mentionsMaize = containsAny(lower, MAIZE_WORDS);
  const mentionsFertilizer = containsAny(lower, FERTILIZER_WORDS) || Boolean(entities.fertilizerType);
  const mentionsPrice = containsAny(lower, PRICE_WORDS);
  const mentionsAvailability = containsAny(lower, AVAILABILITY_WORDS);
  const mentionsBudget =
    containsAny(lower, BUDGET_WORDS) || (entities.budgetKsh !== undefined && entities.farmSizeAcres !== undefined);
  const mentionsHelp = containsAny(lower, HELP_WORDS);
  const mentionsGreeting = containsAny(lower, GREETING_WORDS);

  if (mentionsMaize) entities.crop = "maize";

  const intents: AgentIntent[] = [];

  if (mentionsMaize && (mentionsPrice || !mentionsFertilizer)) {
    intents.push("maize_price");
  }
  if (mentionsFertilizer && mentionsAvailability) {
    intents.push("fertilizer_availability");
  }
  if (mentionsFertilizer && (mentionsPrice || !mentionsAvailability)) {
    intents.push("fertilizer_price");
  }
  if (mentionsBudget) {
    intents.push("budget_plan");
  }
  if (intents.length === 0 && mentionsHelp) {
    intents.push("help");
  }
  if (intents.length === 0 && mentionsGreeting) {
    intents.push("greeting");
  }
  if (intents.length === 0) {
    intents.push("unknown");
  }

  const priority: AgentIntent[] = [
    "budget_plan",
    "maize_price",
    "fertilizer_price",
    "fertilizer_availability",
    "help",
    "greeting",
    "unknown"
  ];
  const primaryIntent =
    priority.find((intent) => intents.includes(intent)) ?? "unknown";

  return { intents, primaryIntent, entities, locale };
}
