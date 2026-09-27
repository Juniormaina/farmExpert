import { describe, expect, it } from "vitest";
import { getCropPrices, listCounties } from "../src/agriculture/marketService.js";
import { CROP_IDS } from "../src/shared/crops.js";

describe("marketService", () => {
  it("returns demo maize prices for Nakuru", () => {
    const prices = getCropPrices({ crop: "maize", county: "Nakuru" });
    expect(prices.map((p) => p.pricePerUnit)).toEqual([3200, 3600]);
    for (const p of prices) {
      expect(p.county).toBe("Nakuru");
      expect(p.crop).toBe("maize");
      expect(p.unit).toBe("bag");
      expect(p.unitKg).toBe(90);
      expect(p.isDemoData).toBe(true);
      expect(p.freshness).toBe("illustrative");
      expect(p.source).toContain("Demo");
      expect(new Date(p.lastUpdated).toString()).not.toBe("Invalid Date");
    }
  });

  it("has demo prices for every crop somewhere", () => {
    for (const crop of CROP_IDS) {
      expect(getCropPrices({ crop }).length, crop).toBeGreaterThan(0);
    }
  });

  it("uses the right selling unit for each crop", () => {
    expect(getCropPrices({ crop: "potatoes" })[0]).toMatchObject({ unit: "bag", unitKg: 50 });
    expect(getCropPrices({ crop: "tomatoes" })[0]).toMatchObject({ unit: "crate", unitKg: 64 });
    expect(getCropPrices({ crop: "tea" })[0]).toMatchObject({ unit: "kg", unitKg: 1 });
  });

  it("only has tea prices in Kericho, where tea is grown", () => {
    expect(getCropPrices({ crop: "tea" }).every((p) => p.county === "Kericho")).toBe(true);
    expect(getCropPrices({ crop: "tea", county: "Nakuru" })).toEqual([]);
  });

  it("returns an empty array for an unknown county", () => {
    expect(getCropPrices({ crop: "maize", county: "Nonexistent County" })).toEqual([]);
  });

  it("lists the three demo counties", () => {
    expect(listCounties()).toEqual(["Kericho", "Nakuru", "Uasin Gishu"]);
  });
});
