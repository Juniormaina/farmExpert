import { describe, expect, it } from "vitest";
import { detectIntent } from "../src/agent/intentDetector.js";

describe("detectIntent", () => {
  it("detects English maize price intent", () => {
    const result = detectIntent("What is the maize price in Nakuru?");
    expect(result.locale).toBe("en");
    expect(result.intents).toContain("maize_price");
    expect(result.entities.county).toBe("Nakuru");
  });

  it("detects Kiswahili maize price intent", () => {
    const result = detectIntent("Bei ya mahindi Nakuru ni ngapi?");
    expect(result.locale).toBe("sw");
    expect(result.intents).toContain("maize_price");
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
    expect(result.intents).toContain("maize_price");
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
});
