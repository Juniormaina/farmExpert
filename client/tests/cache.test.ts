import { beforeEach, describe, expect, it } from "vitest";
import {
  cacheMarketPrices,
  getCachedMarketPrices,
  enqueuePendingMessage,
  getPendingMessages,
  clearPendingMessage
} from "../src/offline/cache";
import type { MarketPrice } from "../src/types";

const sample: MarketPrice = {
  market: "Nakuru Municipal Market",
  county: "Nakuru",
  crop: "maize",
  pricePerBag: 3200,
  bagSizeKg: 90,
  classification: "wholesale",
  source: "test",
  lastUpdated: new Date().toISOString(),
  freshness: "illustrative",
  isDemoData: true
};

describe("offline cache (localStorage-backed)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips cached market prices with a timestamp", () => {
    cacheMarketPrices([sample]);
    const cached = getCachedMarketPrices();
    expect(cached?.data).toEqual([sample]);
    expect(new Date(cached!.cachedAt).toString()).not.toBe("Invalid Date");
  });

  it("returns undefined when nothing has been cached yet", () => {
    expect(getCachedMarketPrices()).toBeUndefined();
  });

  it("queues and clears pending offline messages", () => {
    const entry = enqueuePendingMessage({ channel: "web", text: "Bei ya mahindi Nakuru?" });
    expect(getPendingMessages()).toHaveLength(1);
    clearPendingMessage(entry.id);
    expect(getPendingMessages()).toHaveLength(0);
  });
});
