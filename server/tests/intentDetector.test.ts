import { describe, expect, it } from "vitest";
import { detectIntent } from "../src/agent/intentDetector.js";

describe("detectIntent", () => {
  it("detects English maize price intent", () => {
    const result = detectIntent("What is the maize price in Nakuru?");
    expect(result.locale).toBe("en");
    expect(result.intents).toContain("crop_price");
    expect(result.entities.county).toBe("Nakuru");
  });

  it("detects Kiswahili maize price intent", () => {
    const result = detectIntent("Bei ya mahindi Nakuru ni ngapi?");
    expect(result.locale).toBe("sw");
    expect(result.intents).toContain("crop_price");
    expect(result.entities.county).toBe("Nakuru");
  });

  it("detects fertilizer price intent and type", () => {
    const result = detectIntent("How much does DAP fertilizer cost?");
    expect(result.intents).toContain("fertilizer_price");
    expect(result.entities.fertilizerType).toBe("DAP");
  });

  it("detects fertilizer availability intent", () => {
    const result = detectIntent("Is CAN fertilizer available in Eldoret?");
    expect(result.intents).toContain("fertilizer_availability");
    expect(result.entities.fertilizerType).toBe("CAN");
    expect(result.entities.county).toBe("Uasin Gishu");
  });

  it("detects budget planning intent with entities", () => {
    const result = detectIntent("I have a budget of 12000 for 1 acre in Nakuru, help me plan");
    expect(result.intents).toContain("budget_plan");
    expect(result.entities.budgetKsh).toBe(12000);
    expect(result.entities.farmSizeAcres).toBe(1);
    expect(result.entities.county).toBe("Nakuru");
  });

  it("detects the full mixed-language demo query with multiple intents", () => {
    const query =
      "Habari, nataka kupanda mahindi kwa ekari moja Nakuru. Bei ya mbolea ni ngapi, na mahindi yanauzwa bei gani sokoni? Nina budget ya shilingi 12,000. Naweza kupanga aje?";
    const result = detectIntent(query);
    expect(result.locale).toBe("sw");
    expect(result.intents).toContain("crop_price");
    expect(result.intents).toContain("fertilizer_price");
    expect(result.intents).toContain("budget_plan");
    expect(result.entities.county).toBe("Nakuru");
    expect(result.entities.farmSizeAcres).toBe(1);
    expect(result.entities.budgetKsh).toBe(12000);
  });

  it("falls back to unknown intent for unrelated text", () => {
    const result = detectIntent("What is the capital of Kenya?");
    expect(result.intents).toContain("unknown");
  });

  it("detects a greeting", () => {
    const result = detectIntent("Hello there");
    expect(result.intents).toContain("greeting");
  });

  it.each([
    ["What is the price of beans in Nakuru?", "beans", "en"],
    ["Bei ya maharagwe Eldoret?", "beans", "sw"],
    ["Irish potato prices in Nakuru", "potatoes", "en"],
    ["Bei ya viazi Molo ni ngapi?", "potatoes", "sw"],
    ["How much are tomatoes selling for in Eldoret?", "tomatoes", "en"],
    ["Nyanya zinauzwa bei gani Nakuru?", "tomatoes", "sw"],
    ["Green leaf tea price in Kericho", "tea", "en"],
    ["Bei ya majani chai Kericho?", "tea", "sw"],
    ["Sukuma wiki price in Nakuru", "kale", "en"],
    ["Bei ya sukuma Eldoret?", "kale", "sw"]
  ])("detects crop prices in %s", (message, crop, locale) => {
    const result = detectIntent(message);
    expect(result.entities.crop).toBe(crop);
    expect(result.intents).toContain("crop_price");
    expect(result.locale).toBe(locale);
  });

  it("reads Molo as Nakuru and Kericho as its own county", () => {
    expect(detectIntent("viazi Molo").entities.county).toBe("Nakuru");
    expect(detectIntent("tea in Kericho").entities.county).toBe("Kericho");
  });

  it("takes the first crop mentioned as the subject", () => {
    expect(detectIntent("Tomatoes or maize, which sells better in Nakuru?").entities.crop).toBe("tomatoes");
  });

  it("finds the crop in a budget question", () => {
    const result = detectIntent("I have KSh 40,000 for 1 acre of potatoes in Nakuru");
    expect(result.intents).toContain("budget_plan");
    expect(result.entities).toMatchObject({ crop: "potatoes", budgetKsh: 40000, farmSizeAcres: 1, county: "Nakuru" });
  });

  it("does not read the English word 'can' as CAN fertilizer", () => {
    const result = detectIntent("How can I plan my beans budget? I have KSh 10,000 for 1 acre in Nakuru");
    expect(result.entities.fertilizerType).toBeUndefined();
    expect(result.intents).not.toContain("fertilizer_price");
  });

  it("still recognises CAN fertilizer when it is meant", () => {
    expect(detectIntent("Price of CAN in Nakuru?").entities.fertilizerType).toBe("CAN");
    expect(detectIntent("how much is can fertilizer").entities.fertilizerType).toBe("CAN");
    expect(detectIntent("bei ya can Nakuru").entities.fertilizerType).toBe("CAN");
  });

  it("does not treat a crop disease question as a price", () => {
    const english = detectIntent("My maize has blight");
    expect(english.intents).toEqual(["agricultural_distress"]);
    expect(english.intents).not.toContain("crop_price");

    const swahili = detectIntent("Mahindi yangu yana ugonjwa");
    expect(swahili.intents).toEqual(["agricultural_distress"]);
    expect(swahili.intents).not.toContain("crop_price");
  });
});
