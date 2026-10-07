import { describe, expect, it } from "vitest";
import { detectIntent } from "../../server/src/agent/intentDetector";
import { COUNTIES, CROP_IDS } from "../../server/src/shared/crops";
import { starterQuestions } from "../src/suggestions";
import type { Locale } from "../src/types";

describe("starter questions", () => {
  it("offers a fertilizer, price, budget, and cheapest-fertilizer question", () => {
    const questions = starterQuestions("maize", "Nakuru", 12000, "en");
    expect(questions).toHaveLength(4);
    expect(questions[0]).toContain("fertilizer");
    expect(questions[1]).toContain("maize price");
    expect(questions[2]).toContain("budget");
    expect(questions[3]).toContain("cheapest");
  });

  it("asks only questions the assistant can understand", () => {
    let checked = 0;
    for (const locale of ["en", "sw"] as Locale[]) {
      for (const crop of CROP_IDS) {
        for (const county of COUNTIES) {
          const [fertilizer, price, budget, cheapest] = starterQuestions(crop, county.value, 12000, locale);
          const fertilizerIntent = detectIntent(fertilizer);
          expect(fertilizerIntent.locale, fertilizer).toBe(locale);
          expect(fertilizerIntent.primaryIntent, fertilizer).toBe("fertilizer_quantity");
          expect(fertilizerIntent.intents, fertilizer).not.toContain("fertilizer_price");
          expect(fertilizerIntent.entities, fertilizer).toMatchObject({
            crop,
            county: county.value,
            farmSizeAcres: 1,
            budgetKsh: 12000
          });

          const priceIntent = detectIntent(price);
          expect(priceIntent.locale, price).toBe(locale);
          expect(priceIntent.intents, price).toContain("crop_price");
          expect(priceIntent.entities.crop, price).toBe(crop);
          expect(priceIntent.entities.county, price).toBe(county.value);

          const budgetIntent = detectIntent(budget);
          expect(budgetIntent.locale, budget).toBe(locale);
          expect(budgetIntent.intents, budget).toContain("budget_plan");
          expect(budgetIntent.entities, budget).toMatchObject({
            crop,
            county: county.value,
            farmSizeAcres: 1,
            budgetKsh: 12000
          });

          const cheapestIntent = detectIntent(cheapest);
          expect(cheapestIntent.locale, cheapest).toBe(locale);
          expect(cheapestIntent.intents, cheapest).toContain("fertilizer_price");
          expect(cheapestIntent.entities.county, cheapest).toBe(county.value);
          checked++;
        }
      }
    }
    expect(checked).toBe(2 * 6 * 3);
  });
});
