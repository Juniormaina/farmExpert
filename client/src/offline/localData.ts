import type { FertilizerListing, MarketPrice } from "../types";

// Bundled with the app shell so maize/fertilizer lookups and budget math keep
// working even when the browser has never reached the backend (first-run
// offline, e.g. a fresh PWA install with no connectivity yet). This mirrors
// server/src/data/sampleData.ts: same numbers, same "illustrative" labeling.
const BUNDLED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const LOCAL_MARKET_PRICES: MarketPrice[] = [
  {
    market: "Nakuru Municipal Market",
    county: "Nakuru",
    crop: "maize",
    pricePerBag: 3200,
    bagSizeKg: 90,
    classification: "wholesale",
    source: "Bundled offline dataset (illustrative)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true
  },
  {
    market: "Nakuru Retail Market",
    county: "Nakuru",
    crop: "maize",
    pricePerBag: 3600,
    bagSizeKg: 90,
    classification: "retail",
    source: "Bundled offline dataset (illustrative)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true
  },
  {
    market: "Eldoret Municipal Market",
    county: "Uasin Gishu",
    crop: "maize",
    pricePerBag: 3000,
    bagSizeKg: 90,
    classification: "wholesale",
    source: "Bundled offline dataset (illustrative)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true
  },
  {
    market: "Eldoret Farm-gate",
    county: "Uasin Gishu",
    crop: "maize",
    pricePerBag: 2800,
    bagSizeKg: 90,
    classification: "farm-gate",
    source: "Bundled offline dataset (illustrative)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true
  }
];

export const LOCAL_FERTILIZER_LISTINGS: FertilizerListing[] = [
  {
    type: "DAP",
    packageSizeKg: 50,
    pricePerBag: 6500,
    supplier: "Nakuru Agrovet Co. (fictional demo supplier)",
    county: "Nakuru",
    availability: "in_stock",
    source: "Bundled offline dataset (fictional listing)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  },
  {
    type: "NPK",
    packageSizeKg: 50,
    pricePerBag: 5800,
    supplier: "Nakuru Agrovet Co. (fictional demo supplier)",
    county: "Nakuru",
    availability: "in_stock",
    source: "Bundled offline dataset (fictional listing)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  },
  {
    type: "UREA",
    packageSizeKg: 50,
    pricePerBag: 5200,
    supplier: "Rift Valley Farm Inputs Ltd. (fictional demo supplier)",
    county: "Nakuru",
    availability: "low_stock",
    source: "Bundled offline dataset (fictional listing)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  },
  {
    type: "CAN",
    packageSizeKg: 50,
    pricePerBag: 4200,
    supplier: "Rift Valley Farm Inputs Ltd. (fictional demo supplier)",
    county: "Nakuru",
    availability: "in_stock",
    source: "Bundled offline dataset (fictional listing)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  },
  {
    type: "DAP",
    packageSizeKg: 50,
    pricePerBag: 6300,
    supplier: "Eldoret Farmers Depot (fictional demo supplier)",
    county: "Uasin Gishu",
    availability: "in_stock",
    source: "Bundled offline dataset (fictional listing)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  },
  {
    type: "NPK",
    packageSizeKg: 50,
    pricePerBag: 5600,
    supplier: "Eldoret Farmers Depot (fictional demo supplier)",
    county: "Uasin Gishu",
    availability: "out_of_stock",
    source: "Bundled offline dataset (fictional listing)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  },
  {
    type: "UREA",
    packageSizeKg: 50,
    pricePerBag: 5000,
    supplier: "Eldoret Farmers Depot (fictional demo supplier)",
    county: "Uasin Gishu",
    availability: "in_stock",
    source: "Bundled offline dataset (fictional listing)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  },
  {
    type: "CAN",
    packageSizeKg: 50,
    pricePerBag: 4100,
    supplier: "Eldoret Farmers Depot (fictional demo supplier)",
    county: "Uasin Gishu",
    availability: "in_stock",
    source: "Bundled offline dataset (fictional listing)",
    lastUpdated: BUNDLED_TIMESTAMP,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  }
];

export const LOCAL_DEMO_PROFILE = {
  name: "Mary Wanjiku",
  county: "Nakuru",
  crop: "maize" as const,
  farmSizeAcres: 1,
  budgetKsh: 12000,
  preferredLocale: "sw" as const,
  sampleQuery:
    "Habari, nataka kupanda mahindi kwa ekari moja Nakuru. Bei ya mbolea ni ngapi, na mahindi yanauzwa bei gani sokoni? Nina budget ya shilingi 12,000. Naweza kupanga aje?"
};
