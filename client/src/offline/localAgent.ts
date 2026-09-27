import { detectIntent } from "../../../server/src/agent/intentDetector";
import { buildDeterministicReply, type ResponseData } from "../../../server/src/agent/responseGenerator";
import { getCrop } from "../../../server/src/shared/crops";
import type { AgentResponse, Locale } from "../types";
import { LOCAL_FERTILIZER_LISTINGS, LOCAL_MARKET_PRICES } from "./localData";
import { calculateBudgetLocally } from "./localBudget";

const OFFLINE_NOTICE: Record<Locale, string> = {
  en: "You're offline. This is data saved on your device, not a live quote.",
  sw: "Uko nje ya mtandao. Hii ni taarifa iliyohifadhiwa kwenye kifaa chako, si bei ya moja kwa moja."
};

/**
 * Offline mirror of the server's agent, used only when the browser cannot
 * reach the backend. It runs the server's own intent detection and reply
 * templates against the on-device data, and never calls an AI provider.
 */
export function answerLocally(message: string, localeHint?: Locale): AgentResponse {
  const { intents, primaryIntent, entities, locale } = detectIntent(message, localeHint);
  const data: ResponseData = {};
  const inCounty = (county: string) => !entities.county || county === entities.county;

  if (intents.includes("crop_price") && entities.crop) {
    data.marketPrices = LOCAL_MARKET_PRICES.filter((p) => p.crop === entities.crop && inCounty(p.county));
  }
  if (intents.includes("fertilizer_price") || intents.includes("fertilizer_availability")) {
    data.fertilizerListings = LOCAL_FERTILIZER_LISTINGS.filter(
      (f) => (!entities.fertilizerType || f.type === entities.fertilizerType) && inCounty(f.county)
    );
  }
  if (intents.includes("budget_plan")) {
    const missing = (["county", "farmSizeAcres", "budgetKsh"] as const).filter((key) => entities[key] === undefined);
    if (missing.length > 0) {
      data.missingForBudget = [...missing];
    } else {
      const crop = entities.crop ?? "maize";
      try {
        data.budget = calculateBudgetLocally(
          {
            county: entities.county!,
            crop,
            farmSizeAcres: entities.farmSizeAcres!,
            budgetKsh: entities.budgetKsh!,
            fertilizerType: entities.fertilizerType ?? getCrop(crop).defaultFertilizer
          },
          locale
        );
      } catch {
        data.missingForBudget = ["fertilizerType"];
      }
    }
  }

  const reply = `${OFFLINE_NOTICE[locale]}\n\n${buildDeterministicReply(intents, entities, locale, data)}`;
  return {
    reply,
    locale,
    intent: primaryIntent,
    entities,
    data: { marketPrices: data.marketPrices, fertilizerListings: data.fertilizerListings, budget: data.budget },
    providerUsed: "deterministic"
  };
}
