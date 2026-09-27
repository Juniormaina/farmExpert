import { describe, expect, it } from "vitest";
import { cheapestAvailable, highestPrice, keyPointsFor, splitMoney } from "../src/insights";
import { LOCAL_FERTILIZER_LISTINGS, LOCAL_MARKET_PRICES } from "../src/offline/localData";
import { calculateBudgetLocally } from "../src/offline/localBudget";

describe("insights", () => {
  it("picks the highest maize price", () => {
    const nakuru = LOCAL_MARKET_PRICES.filter((p) => p.county === "Nakuru" && p.crop === "maize");
    expect(highestPrice(nakuru)?.pricePerUnit).toBe(3600);
  });

  it("never recommends an out-of-stock fertilizer, however cheap", () => {
    const eldoret = LOCAL_FERTILIZER_LISTINGS.filter((l) => l.county === "Uasin Gishu");
    const outOfStockCheap = { ...eldoret[0], type: "NPK" as const, pricePerBag: 100, availability: "out_of_stock" as const };
    const pick = cheapestAvailable([...eldoret, outOfStockCheap]);
    expect(pick?.availability).not.toBe("out_of_stock");
    expect(pick?.type).toBe("CAN");
  });

  it("returns undefined when everything is out of stock", () => {
    const listing = { ...LOCAL_FERTILIZER_LISTINGS[0], availability: "out_of_stock" as const };
    expect(cheapestAvailable([listing])).toBeUndefined();
  });

  it("builds key points for Mary's budget, flagging the shortfall", () => {
    const budget = calculateBudgetLocally({ county: "Nakuru", crop: "maize", farmSizeAcres: 1, budgetKsh: 12000, fertilizerType: "DAP" });
    const points = keyPointsFor(
      {
        marketPrices: LOCAL_MARKET_PRICES.filter((p) => p.county === "Nakuru" && p.crop === "maize"),
        fertilizerListings: LOCAL_FERTILIZER_LISTINGS.filter((l) => l.county === "Nakuru"),
        budget
      },
      "en"
    );
    expect(points.map((p) => p.id)).toEqual(["price", "fertilizer", "cost", "gap"]);
    expect(points.find((p) => p.id === "price")?.label).toBe("Highest price: Maize");
    expect(points.find((p) => p.id === "price")?.value).toBe("KSh 3,600 / 90kg bag");
    expect(points.find((p) => p.id === "fertilizer")?.value).toBe("CAN KSh 4,200");
    expect(points.find((p) => p.id === "cost")?.value).toBe("KSh 20,000");
    const gap = points.find((p) => p.id === "gap");
    expect(gap?.tone).toBe("bad");
    expect(gap?.value).toBe("KSh 8,000");
  });

  it("shows money left over in green when the budget is enough", () => {
    const budget = calculateBudgetLocally({ county: "Nakuru", crop: "maize", farmSizeAcres: 1, budgetKsh: 25000, fertilizerType: "DAP" });
    const gap = keyPointsFor({ budget }, "sw").find((p) => p.id === "gap");
    expect(gap?.tone).toBe("good");
    expect(gap?.label).toBe("Kilichobaki kwenye bajeti");
    expect(gap?.value).toBe("KSh 5,000");
  });

  it("returns no key points for a greeting with no data", () => {
    expect(keyPointsFor({}, "en")).toEqual([]);
    expect(keyPointsFor(undefined, "en")).toEqual([]);
  });

  it("splits out prices so they can be highlighted", () => {
    const parts = splitMoney("Maize: KSh 3,200 per bag, DAP KSh 6,500.");
    expect(parts.filter((p) => p.money).map((p) => p.text)).toEqual(["KSh 3,200", "KSh 6,500"]);
    expect(parts.map((p) => p.text).join("")).toBe("Maize: KSh 3,200 per bag, DAP KSh 6,500.");
  });
});

describe("insights for other crops", () => {
  it("names the crop and uses its selling unit", () => {
    const tomatoes = LOCAL_MARKET_PRICES.filter((p) => p.crop === "tomatoes");
    const [point] = keyPointsFor({ marketPrices: tomatoes }, "en");
    expect(point.label).toBe("Highest price: Tomatoes");
    expect(point.value).toBe("KSh 5,000 / 64kg crate");
    const [sw] = keyPointsFor({ marketPrices: tomatoes }, "sw");
    expect(sw.value).toBe("KSh 5,000 / kreti ya 64kg");
  });
});
