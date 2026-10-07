import { COUNTIES, getCrop } from "../../server/src/shared/crops";
import type { AgentIntent, CropId, Locale } from "./types";

type Kind = "price" | "budget" | "fertilizer";

// What to suggest next, given what the farmer just asked about.
const NEXT: Partial<Record<AgentIntent, [Kind, Kind]>> = {
  crop_price: ["budget", "fertilizer"],
  fertilizer_price: ["budget", "price"],
  fertilizer_availability: ["budget", "price"],
  budget_plan: ["price", "fertilizer"]
};

function question(kind: Kind, crop: CropId, county: string, budgetKsh: number, locale: Locale): string {
  const cropName = getCrop(crop).shortName[locale];
  const place = COUNTIES.find((c) => c.value === county)?.label ?? county;
  const amount = budgetKsh.toLocaleString("en-US");
  if (locale === "sw") {
    if (kind === "price") return `Bei ya ${cropName.toLowerCase()} ${place}?`;
    if (kind === "fertilizer") return `Bei ya mbolea ${place}?`;
    return `Panga bajeti: ekari 1 ya ${cropName.toLowerCase()} ${place}, shilingi ${amount}`;
  }
  if (kind === "price") return `Price of ${cropName.toLowerCase()} in ${place}?`;
  if (kind === "fertilizer") return `Fertilizer prices in ${place}?`;
  return `Plan my budget: 1 acre of ${cropName.toLowerCase()} in ${place} with KSh ${amount}`;
}

/**
 * Opening questions a farmer can tap before the conversation starts.
 * Each one names a crop, place, or amount the assistant can actually answer.
 */
export function starterQuestions(crop: CropId, county: string, budgetKsh: number, locale: Locale): string[] {
  const cropName = getCrop(crop).shortName[locale].toLowerCase();
  const place = COUNTIES.find((c) => c.value === county)?.label ?? county;
  const amount = budgetKsh.toLocaleString("en-US");
  if (locale === "sw") {
    return [
      `Nahitaji mbolea kiasi gani kwa ekari 1 ya ${cropName} ${place}, shilingi ${amount}?`,
      `Bei ya ${cropName} ${place}?`,
      `Panga bajeti: ekari 1 ya ${cropName} ${place}, shilingi ${amount}`,
      `Mbolea ipi ni rahisi zaidi ${place}?`
    ];
  }
  return [
    `How much fertilizer do I need for 1 acre of ${cropName} in ${place} with KSh ${amount}?`,
    `What is the ${cropName} price in ${place}?`,
    `Plan my farm budget: 1 acre of ${cropName} in ${place} with KSh ${amount}`,
    `Which fertilizer is cheapest in ${place}?`
  ];
}

/**
 * Two suggestions that follow the crop and county the farmer is looking at,
 * and the natural next step after their last question.
 */
export function suggestionsFor(
  lastIntent: AgentIntent | undefined,
  crop: CropId,
  county: string,
  budgetKsh: number,
  locale: Locale
): string[] {
  const kinds = (lastIntent && NEXT[lastIntent]) ?? (["price", "budget"] as [Kind, Kind]);
  return kinds.map((kind) => question(kind, crop, county, budgetKsh, locale));
}
