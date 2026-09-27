import { describe, expect, it } from "vitest";
import { answerLocally } from "../src/offline/localAgent";

describe("answerLocally (offline chat fallback, no network/AI provider)", () => {
  it("detects locale and extracts entities from Mary's mixed-language demo query", () => {
    const query =
      "Habari, nataka kupanda mahindi kwa ekari moja Nakuru. Bei ya mbolea ni ngapi, na mahindi yanauzwa bei gani sokoni? Nina budget ya shilingi 12,000. Naweza kupanga aje?";
    const result = answerLocally(query);
    expect(result.locale).toBe("sw");
    expect(result.entities.county).toBe("Nakuru");
    expect(result.entities.farmSizeAcres).toBe(1);
    expect(result.entities.budgetKsh).toBe(12000);
    expect(result.providerUsed).toBe("deterministic");
    expect(result.data?.marketPrices?.length).toBeGreaterThan(0);
    expect(result.data?.fertilizerListings?.length).toBeGreaterThan(0);
    expect(result.data?.budget).toBeDefined();
  });

  it("labels the reply as offline/cached data", () => {
    const result = answerLocally("What is the maize price in Nakuru?");
    expect(result.reply.toLowerCase()).toContain("offline");
  });

  it("returns maize prices for an English query", () => {
    const result = answerLocally("Maize price in Nakuru?");
    expect(result.data?.marketPrices?.every((p) => p.county === "Nakuru")).toBe(true);
  });

  it("answers about other crops offline, in the question's language", () => {
    const result = answerLocally("Bei ya viazi Nakuru?");
    expect(result.locale).toBe("sw");
    expect(result.data?.marketPrices?.every((p) => p.crop === "potatoes" && p.county === "Nakuru")).toBe(true);
    expect(result.reply).toContain("Bei za viazi:");
    expect(result.reply).toContain("kwa gunia la 50kg");
  });

  it("plans a tea budget offline with tea's defaults", () => {
    const result = answerLocally("I have KSh 40,000 for 1 acre of tea in Kericho");
    expect(result.data?.budget?.input).toMatchObject({ crop: "tea", fertilizerType: "NPK" });
    expect(result.data?.budget?.totalEstimatedCostKsh).toBe(37800);
  });
});
