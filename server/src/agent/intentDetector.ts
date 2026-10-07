import type { AgentIntent, CropId, ExtractedEntities, FertilizerType, Locale } from "../shared/types.js";
import { COUNTIES, CROPS } from "../shared/crops.js";

export interface IntentDetectionResult {
  intents: AgentIntent[];
  primaryIntent: AgentIntent;
  entities: ExtractedEntities;
  locale: Locale;
}

const SWAHILI_MARKERS = [
  "bei",
  "mahindi",
  "maharagwe",
  "maharage",
  "viazi",
  "nyanya",
  "mazao",
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
  "shilingi",
  "inatosha",
  "ugonjwa"
];

const GREETING_WORDS = ["habari", "hello", "hi", "hey", "mambo", "salamu"];
const HELP_WORDS = ["help", "msaada", "how do", "unawezaje", "unaweza kunifanyia nini"];
const AVAILABILITY_WORDS = ["available", "availability", "stock", "iko", "kupata", "pata"];
const BUDGET_WORDS = ["budget", "bajeti", "panga", "plan", "gharama", "kupanga"];
const PRICE_WORDS = ["price", "prices", "bei", "cost", "gharama", "uzwa", "uzawa", "selling", "sells", "sold", "sell"];
const COMPARE_WORDS = ["cheapest", "cheaper", "rahisi", "compare", "linganisha", "comparison"];
const FERTILIZER_WORDS = ["fertilizer", "fertiliser", "mbolea"];

// A crop name is not evidence of distress. These are.
const DISTRESS_PHRASES = [
  "brown spots",
  "black spots",
  "yellow leaves",
  "spots on the leaves",
  "spots on leaves",
  "holes in the leaves",
  "holes in leaves",
  "leaves curling",
  "leaves are turning",
  "leaves turning",
  "turning yellow",
  "not growing",
  "poor growth",
  "falling over",
  "sick crop",
  "sick plant",
  "crop problem",
  "plant problem",
  "is sick",
  "are sick",
  "chemical dose",
  "exact dose",
  "majani ya njano",
  "majani yamekuwa ya njano",
  "madoa ya kahawia",
  "majani yana madoa",
  "ukuaji mbaya",
  "mmea mgonjwa",
  "mimea inakufa",
  "zao linakufa"
];

const DISTRESS_WORDS = [
  "dying",
  "die",
  "died",
  "dies",
  "dead",
  "wilting",
  "wilted",
  "wilt",
  "yellowing",
  "stunted",
  "rotting",
  "rotten",
  "infected",
  "infestation",
  "insects",
  "insect",
  "worms",
  "worm",
  "larvae",
  "larva",
  "attacked",
  "damaged",
  "pest",
  "pests",
  "disease",
  "diseases",
  "blight",
  "fungus",
  "mould",
  "mold",
  "mouldy",
  "moldy",
  "symptoms",
  "symptom",
  "pesticide",
  "pesticides",
  "insecticide",
  "herbicide",
  "fungicide",
  "dosage",
  "dose",
  "doses",
  "spray",
  "spraying",
  "dawa",
  "kipimo",
  "inakufa",
  "anakufa",
  "yanakufa",
  "linakufa",
  "zinakufa",
  "wanakufa",
  "kufa",
  "inanyauka",
  "kunyauka",
  "nyauka",
  "madoa",
  "wadudu",
  "funza",
  "ugonjwa",
  "magonjwa",
  "shambulio",
  "imeharibika",
  "imaharibika",
  "haikui",
  "haijakua"
];

const FERTILIZER_TYPE_PATTERNS: Array<[FertilizerType, RegExp]> = [
  ["DAP", /\bdap\b/i],
  ["NPK", /\bnpk\b/i],
  ["UREA", /\burea\b/i]
];

const ENGLISH_ACRE_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  an: 1
};

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
  kumi: 10,
  nusu: 0.5
};

// Distress is first because a crop name used to be enough to select a price
// list. "My maize is dying" is a safety question, not a market question.
const PRIORITY: AgentIntent[] = [
  "agricultural_distress",
  "unsupported_claim",
  "fertilizer_quantity",
  "budget_plan",
  "fertilizer_price",
  "fertilizer_availability",
  "crop_price",
  "help",
  "greeting",
  "unknown"
];

export function normalizeMessage(message: string): string {
  const lowered = message.toLowerCase().replace(/['’]/g, "");
  const withoutThousands = stripThousands(lowered);
  return withoutThousands
    .replace(/[-–—/]+/g, " ")
    .replace(/[^\p{L}\p{N}\s.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripThousands(text: string): string {
  let next = text;
  let previous = "";
  while (next !== previous) {
    previous = next;
    next = next.replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  }
  return next;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsAny(text: string, words: string[]): boolean {
  return words.some((word) => new RegExp(`\\b${escapeRegex(word)}\\b`, "i").test(text));
}

function includesPhrase(text: string, phrase: string): boolean {
  const pattern = phrase.split(/\s+/).map(escapeRegex).join("\\s+");
  return new RegExp(`(?:^|\\s)${pattern}(?:\\s|$)`).test(text);
}

export function detectAgriculturalDistress(text: string): boolean {
  return DISTRESS_PHRASES.some((phrase) => includesPhrase(text, phrase)) || containsAny(text, DISTRESS_WORDS);
}

export function detectUnsupportedClaim(text: string): boolean {
  return (
    /\bguarantees?\b/.test(text) ||
    /\bguaranteed\b/.test(text) ||
    /\bdefinitely\b/.test(text) ||
    /\bhigher yield\b/.test(text) ||
    /\bmost profit\b/.test(text) ||
    /\bmake me money\b/.test(text) ||
    /\bmake money\b/.test(text)
  );
}

function mentionsFertilizer(text: string, entities: ExtractedEntities): boolean {
  return containsAny(text, FERTILIZER_WORDS) || Boolean(entities.fertilizerType);
}

export function detectFertilizerQuantityIntent(text: string, entities: ExtractedEntities): boolean {
  if (/\bhow many bags?\b/.test(text)) return true;
  if (/\bhow much\b[\s\S]{0,80}\b(need|apply|use|should)\b/.test(text)) return true;
  if (/\b(should i use|should i apply|do i need)\b/.test(text) && mentionsFertilizer(text, entities)) return true;
  if (/\b(kiasi gani|mifuko mingapi|mifuko ngapi)\b/.test(text)) return true;
  if (/\b(nahitaji|ninahitaji)\b/.test(text) && /\b(kiasi|mifuko)\b/.test(text)) return true;
  if (/\b(fertili[sz]er|mbolea)\b[\s\S]{0,40}\brates?\b/.test(text)) return true;
  if (/\brates?\b[\s\S]{0,40}\b(fertili[sz]er|mbolea)\b/.test(text)) return true;
  return false;
}

export function detectBudgetIntent(text: string, entities: ExtractedEntities): boolean {
  if (containsAny(text, BUDGET_WORDS)) return true;
  if (entities.budgetKsh !== undefined && entities.farmSizeAcres !== undefined) return true;
  if (/\b(can i plant|can i afford|naweza kupanda|inatosha|only have)\b/.test(text)) return true;
  if (/\benough\b/.test(text) && (entities.budgetKsh !== undefined || /\b(acre|ekari)\b/.test(text))) return true;
  return false;
}

export function detectFertilizerPriceIntent(text: string, entities: ExtractedEntities): boolean {
  if (!mentionsFertilizer(text, entities)) return false;
  return containsAny(text, PRICE_WORDS) || containsAny(text, COMPARE_WORDS) || /\bhow much (?:is|are|does)\b/.test(text);
}

export function detectMarketPriceIntent(text: string, entities: ExtractedEntities): boolean {
  if (!entities.crop) return false;
  return containsAny(text, PRICE_WORDS) || /\bhow much (?:is|are)\b/.test(text) || /\bselling for\b/.test(text);
}

export function parseAcreage(text: string): number | undefined {
  if (/\bhalf(?:\s+an)?\s+acres?\b/.test(text) || /\bnusu\s+ekari\b/.test(text)) return 0.5;

  const english = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|an)\s+acres?\b/);
  if (english && ENGLISH_ACRE_WORDS[english[1]] !== undefined) return ENGLISH_ACRE_WORDS[english[1]];

  const digitBefore = text.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|ekari)\b/);
  if (digitBefore) return parseFloat(digitBefore[1]);

  const digitAfter = text.match(/\b(?:acre|acres|ekari)\s+(\d+(?:\.\d+)?)/);
  if (digitAfter) return parseFloat(digitAfter[1]);

  const wordAfter = text.match(/\bekari\s+([a-z]+)/);
  if (wordAfter && SWAHILI_NUMBER_WORDS[wordAfter[1]] !== undefined) return SWAHILI_NUMBER_WORDS[wordAfter[1]];

  return undefined;
}

export function missingBudgetFields(
  entities: ExtractedEntities
): Array<"crop" | "county" | "farmSizeAcres" | "budgetKsh"> {
  const missing: Array<"crop" | "county" | "farmSizeAcres" | "budgetKsh"> = [];
  if (!entities.crop) missing.push("crop");
  if (!entities.county) missing.push("county");
  if (entities.farmSizeAcres === undefined) missing.push("farmSizeAcres");
  if (entities.budgetKsh === undefined) missing.push("budgetKsh");
  return missing;
}

function exclusive(intent: AgentIntent): Pick<IntentDetectionResult, "intents" | "primaryIntent"> {
  return { intents: [intent], primaryIntent: intent };
}

export function classifyIntent(
  text: string,
  entities: ExtractedEntities
): Pick<IntentDetectionResult, "intents" | "primaryIntent"> {
  if (detectAgriculturalDistress(text)) return exclusive("agricultural_distress");
  if (detectUnsupportedClaim(text)) return exclusive("unsupported_claim");
  if (detectFertilizerQuantityIntent(text, entities)) return exclusive("fertilizer_quantity");

  const intents: AgentIntent[] = [];
  if (detectBudgetIntent(text, entities)) intents.push("budget_plan");
  if (detectFertilizerPriceIntent(text, entities)) intents.push("fertilizer_price");
  if (mentionsFertilizer(text, entities) && containsAny(text, AVAILABILITY_WORDS)) intents.push("fertilizer_availability");
  if (detectMarketPriceIntent(text, entities)) intents.push("crop_price");
  if (intents.length === 0 && containsAny(text, HELP_WORDS)) intents.push("help");
  if (intents.length === 0 && containsAny(text, GREETING_WORDS)) intents.push("greeting");
  if (intents.length === 0) intents.push("unknown");

  const primaryIntent = PRIORITY.find((intent) => intents.includes(intent)) ?? "unknown";
  return { intents, primaryIntent };
}

// "can" is an ordinary English word, so only read it as CAN fertilizer when it
// is capitalised, sits next to a fertilizer word, or the message is Kiswahili.
function mentionsCanFertilizer(message: string, locale: Locale): boolean {
  return (
    /\bCAN\b/.test(message) ||
    /\bcan\s+(?:fertili[sz]er|mbolea)\b/i.test(message) ||
    /\b(?:fertili[sz]er|mbolea)\s+(?:ya\s+)?can\b/i.test(message) ||
    (locale === "sw" && /\bcan\b/i.test(message))
  );
}

function detectLocale(message: string): Locale {
  const swMatches = SWAHILI_MARKERS.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(message)).length;
  return swMatches >= 1 ? "sw" : "en";
}

function extractCounty(text: string): string | undefined {
  return COUNTIES.find((county) => county.aliases.some((alias) => text.includes(alias)))?.value;
}

function extractCrop(text: string): CropId | undefined {
  let best: { crop: CropId; index: number } | undefined;
  for (const crop of CROPS) {
    for (const alias of crop.aliases) {
      const match = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i").exec(text);
      if (match && (!best || match.index < best.index)) best = { crop: crop.id, index: match.index };
    }
  }
  return best?.crop;
}

function extractBudget(text: string): number | undefined {
  const patterns = [
    /(?:ksh|kes|shilingi|sh\.?)\s*([\d,]+(?:\.\d+)?)/,
    /([\d,]+(?:\.\d+)?)\s*(?:ksh|kes|shilingi|bob)/,
    /budget of\s*([\d,]+)/,
    /budget\s*(?:ya|of)?\s*(?:ksh|shilingi)?\s*([\d,]+)/,
    /\b(?:only have)\s+([\d,]+(?:\.\d+)?)/,
    /\b([\d,]+(?:\.\d+)?)\s+(?:enough|inatosha)\b/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = parseFloat(match[1].replace(/,/g, ""));
    if (!Number.isNaN(value)) return value;
  }
  return undefined;
}

function extractFertilizerType(message: string, locale: Locale): FertilizerType | undefined {
  for (const [type, pattern] of FERTILIZER_TYPE_PATTERNS) {
    if (pattern.test(message)) return type;
  }
  return mentionsCanFertilizer(message, locale) ? "CAN" : undefined;
}

export function detectIntent(message: string, localeHint?: Locale): IntentDetectionResult {
  const normalized = normalizeMessage(message);
  const locale = localeHint ?? detectLocale(normalized);
  const entities: ExtractedEntities = {
    county: extractCounty(normalized),
    farmSizeAcres: parseAcreage(normalized),
    budgetKsh: extractBudget(normalized),
    fertilizerType: extractFertilizerType(message, locale),
    crop: extractCrop(normalized)
  };
  const { intents, primaryIntent } = classifyIntent(normalized, entities);
  return { intents, primaryIntent, entities, locale };
}
