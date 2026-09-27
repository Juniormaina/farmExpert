import { describe, expect, it } from "vitest";
import { getFertilizerListings, getCheapestListing, FERTILIZER_TYPES } from "../src/agriculture/fertilizerService.js";

describe("fertilizerService", () => {
  it("supports DAP, NPK, UREA, and CAN", () => {
    expect(FERTILIZER_TYPES).toEqual(["DAP", "NPK", "UREA", "CAN"]);
  });

  it("returns listings labeled as demo and fictional supplier", () => {
    const listings = getFertilizerListings({ type: "DAP", county: "Nakuru" });
    expect(listings.length).toBeGreaterThan(0);
    for (const l of listings) {
      expect(l.isDemoData).toBe(true);
      expect(l.isFictionalSupplier).toBe(true);
      expect(["in_stock", "low_stock", "out_of_stock", "unknown"]).toContain(l.availability);
    }
  });

  it("finds the cheapest listing for a type/county", () => {
    const cheapest = getCheapestListing("DAP", "Nakuru");
    expect(cheapest).toBeDefined();
    const all = getFertilizerListings({ type: "DAP", county: "Nakuru" });
    const minPrice = Math.min(...all.map((l) => l.pricePerBag));
    expect(cheapest?.pricePerBag).toBe(minPrice);
  });

  it("returns undefined for a fertilizer/county combination with no listings", () => {
    const cheapest = getCheapestListing("DAP", "Mombasa");
    expect(cheapest).toBeUndefined();
  });
});
