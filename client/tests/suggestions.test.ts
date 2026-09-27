import { describe, expect, it } from "vitest";
import { detectIntent } from "../../server/src/agent/intentDetector";
import { COUNTIES, CROP_IDS } from "../../server/src/shared/crops";
import { suggestionsFor } from "../src/suggestions";
import type { AgentIntent, Locale } from "../src/types";

const EXPECTED: Record<string, AgentIntent> = { price: "crop_price", budget: "budget_plan", fertilizer: "fertilizer_price" };

describe("smart suggestions", () => {
  it("offers only two suggestions", () => {
    expect(suggestionsFor(undefined, "maize", "Nakuru", 12000, "en")).toHaveLength(2);
  });

  it("follows the crop and county being viewed", () => {
    expect(suggestionsFor(undefined, "tomatoes", "Uasin Gishu", 12000, "en")[0]).toBe("Price of tomatoes in Eldoret?");
  });

  it("suggests the natural next step after each kind of answer", () => {
    expect(suggestionsFor("crop_price", "maize", "Nakuru", 12000, "en")[0]).toContain("Plan my budget");
    expect(suggestionsFor("budget_plan", "maize", "Nakuru", 12000, "en")).toEqual([
      "Price of maize in Nakuru?",
      "Fertilizer prices in Nakuru?"
    ]);
  });

  it("every suggestion it can make is understood correctly by the assistant", () => {
    const steps: Array<AgentIntent | undefined> = [undefined, "crop_price", "fertilizer_price", "budget_plan"];
    let checked = 0;
    for (const locale of ["en", "sw"] as Locale[]) {
      for (const crop of CROP_IDS) {
        for (const county of COUNTIES) {
          for (const step of steps) {
            for (const text of suggestionsFor(step, crop, county.value, 12000, locale)) {
              const kind = text.match(/budget|bajeti/i) ? "budget" : text.match(/fertilizer|mbolea/i) ? "fertilizer" : "price";
              const result = detectIntent(text);
              expect(result.locale, text).toBe(locale);
              expect(result.intents, text).toContain(EXPECTED[kind]);
              expect(result.entities.county, text).toBe(county.value);
              if (kind !== "fertilizer") expect(result.entities.crop, text).toBe(crop);
              if (kind === "budget") expect(result.entities, text).toMatchObject({ farmSizeAcres: 1, budgetKsh: 12000 });
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBe(2 * 6 * 3 * 4 * 2);
  });
});
