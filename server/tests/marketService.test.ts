import { describe, expect, it } from "vitest";
import { getMaizePrices, listCounties } from "../src/agriculture/marketService.js";

describe("marketService", () => {
  it("returns demo maize prices for Nakuru", () => {
    const prices = getMaizePrices({ county: "Nakuru" });
    expect(prices.length).toBeGreaterThan(0);
    for (const p of prices) {
      expect(p.county).toBe("Nakuru");
      expect(p.isDemoData).toBe(true);
      expect(p.freshness).toBe("illustrative");
      expect(p.source).toContain("Demo");
      expect(new Date(p.lastUpdated).toString()).not.toBe("Invalid Date");
    }
  });

  it("returns demo maize prices for Eldoret/Uasin Gishu", () => {
    const prices = getMaizePrices({ county: "Uasin Gishu" });
    expect(prices.length).toBeGreaterThan(0);
  });

  it("returns an empty array for an unknown county", () => {
    const prices = getMaizePrices({ county: "Nonexistent County" });
    expect(prices).toEqual([]);
  });

  it("lists at least two demo counties", () => {
    const counties = listCounties();
    expect(counties).toContain("Nakuru");
    expect(counties).toContain("Uasin Gishu");
  });
});
