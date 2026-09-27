import type { AgentRequest, AgentResponse } from "../shared/types.js";
import { detectIntent } from "./intentDetector.js";
import { buildDeterministicReply, type ResponseData } from "./responseGenerator.js";
import { getMaizePrices } from "../agriculture/marketService.js";
import { getFertilizerListings } from "../agriculture/fertilizerService.js";
import { calculateBudget, FertilizerUnavailableError } from "../agriculture/budgetCalculator.js";
import { generateReply } from "../providers/providerManager.js";

const DEFAULT_BUDGET_FERTILIZER = "DAP" as const;

export async function handleAgentMessage(request: AgentRequest): Promise<AgentResponse> {
  const { intents, primaryIntent, entities, locale } = detectIntent(request.message, request.locale);

  const data: ResponseData = {};

  if (intents.includes("maize_price")) {
    data.marketPrices = getMaizePrices({ county: entities.county });
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
      try {
        data.budget = calculateBudget(
          {
            county: entities.county!,
            crop: "maize",
            farmSizeAcres: entities.farmSizeAcres!,
            budgetKsh: entities.budgetKsh!,
            fertilizerType: entities.fertilizerType ?? DEFAULT_BUDGET_FERTILIZER
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
