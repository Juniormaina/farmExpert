import type { AgentRequest, AgentResponse } from "../shared/types.js";
import { detectIntent } from "./intentDetector.js";
import { buildDeterministicReply, type ResponseData } from "./responseGenerator.js";
import { getCropPrices } from "../agriculture/marketService.js";
import { getFertilizerListings } from "../agriculture/fertilizerService.js";
import { calculateBudget, FertilizerUnavailableError } from "../agriculture/budgetCalculator.js";
import { generateReply } from "../providers/providerManager.js";
import { getCrop } from "../shared/crops.js";

// A budget question that names no crop is about maize, the most common crop.
const DEFAULT_BUDGET_CROP = "maize" as const;

export async function handleAgentMessage(request: AgentRequest): Promise<AgentResponse> {
  const { intents, primaryIntent, entities, locale } = detectIntent(request.message, request.locale);

  const data: ResponseData = {};

  if (intents.includes("crop_price") && entities.crop) {
    data.marketPrices = getCropPrices({ crop: entities.crop, county: entities.county });
  }

  if (intents.includes("fertilizer_price") || intents.includes("fertilizer_availability")) {
    data.fertilizerListings = getFertilizerListings({ type: entities.fertilizerType, county: entities.county });
  }

  if (intents.includes("budget_plan")) {
    const missing: string[] = [];
    if (!entities.county) missing.push("county");
    if (entities.farmSizeAcres === undefined) missing.push("farmSizeAcres");
    if (entities.budgetKsh === undefined) missing.push("budgetKsh");

    if (missing.length > 0) {
      data.missingForBudget = missing;
    } else {
      const crop = entities.crop ?? DEFAULT_BUDGET_CROP;
      try {
        data.budget = calculateBudget(
          {
            county: entities.county!,
            crop,
            farmSizeAcres: entities.farmSizeAcres!,
            budgetKsh: entities.budgetKsh!,
            fertilizerType: entities.fertilizerType ?? getCrop(crop).defaultFertilizer
          },
          locale
        );
      } catch (err) {
        if (err instanceof FertilizerUnavailableError) {
          data.missingForBudget = ["fertilizerType"];
        } else {
          throw err;
        }
      }
    }
  }

  const baseReply = buildDeterministicReply(intents, entities, locale, data);

  const { text, providerUsed } = await generateReply({
    rawMessage: request.message,
    locale,
    intents,
    entities,
    baseReply
  });

  return {
    reply: text,
    locale,
    intent: primaryIntent,
    entities,
    data: {
      marketPrices: data.marketPrices,
      fertilizerListings: data.fertilizerListings,
      budget: data.budget
    },
    providerUsed
  };
}
