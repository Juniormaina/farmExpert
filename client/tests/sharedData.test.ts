import { describe, expect, it } from "vitest";
import { SAMPLE_LISTING_ROWS, SAMPLE_PRICE_ROWS } from "../../server/src/data/sampleData";
import { LOCAL_FERTILIZER_LISTINGS, LOCAL_MARKET_PRICES } from "../src/offline/localData";

describe("on-device data", () => {
  it("has exactly the server's prices, so offline answers match online ones", () => {
    const strip = ({ source, lastUpdated, freshness, isDemoData, ...row }: (typeof LOCAL_MARKET_PRICES)[number]) => row;
    expect(LOCAL_MARKET_PRICES.map(strip)).toEqual(SAMPLE_PRICE_ROWS);
  });

  it("has exactly the server's fertilizer listings", () => {
    const strip = ({ source, lastUpdated, freshness, isDemoData, isFictionalSupplier, ...row }: (typeof LOCAL_FERTILIZER_LISTINGS)[number]) => row;
    expect(LOCAL_FERTILIZER_LISTINGS.map(strip)).toEqual(SAMPLE_LISTING_ROWS);
  });

  it("is labelled as the on-device copy and as demo data", () => {
    expect(LOCAL_MARKET_PRICES.every((p) => p.source.startsWith("Bundled offline") && p.isDemoData)).toBe(true);
  });
});
