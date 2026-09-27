import { DEMO_FARMER_PROFILE, sampleListings, samplePrices } from "../../../server/src/data/sampleData";
import type { DemoProfile, FertilizerListing, MarketPrice } from "../types";

// Bundled with the app shell so price lookups and budget maths keep working
// even when the browser has never reached the backend. Built from the server's
// own dataset, relabelled so it's clear this is the on-device copy.
const BUNDLED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const LOCAL_MARKET_PRICES: MarketPrice[] = samplePrices(BUNDLED_TIMESTAMP, "Bundled offline dataset (illustrative)");

export const LOCAL_FERTILIZER_LISTINGS: FertilizerListing[] = sampleListings(
  BUNDLED_TIMESTAMP,
  "Bundled offline dataset (fictional listing)"
);

export const LOCAL_DEMO_PROFILE: DemoProfile = DEMO_FARMER_PROFILE;
