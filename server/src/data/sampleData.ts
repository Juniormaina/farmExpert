import type { FertilizerListing, MarketPrice } from "../shared/types.js";

const now = () => new Date().toISOString();

export const SAMPLE_MARKET_PRICES: Omit<MarketPrice, "isDemoData">[] = [
  {
    market: "Nakuru Municipal Market",
    county: "Nakuru",
    crop: "maize",
    pricePerBag: 3200,
    bagSizeKg: 90,
    classification: "wholesale",
    source: "ShambaAI Demo Dataset (illustrative, modeled on public reporting patterns)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    market: "Nakuru Retail Market",
    county: "Nakuru",
    crop: "maize",
    pricePerBag: 3600,
    bagSizeKg: 90,
    classification: "retail",
    source: "ShambaAI Demo Dataset (illustrative, modeled on public reporting patterns)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    market: "Eldoret Municipal Market",
    county: "Uasin Gishu",
    crop: "maize",
    pricePerBag: 3000,
    bagSizeKg: 90,
    classification: "wholesale",
    source: "ShambaAI Demo Dataset (illustrative, modeled on public reporting patterns)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    market: "Eldoret Farm-gate",
    county: "Uasin Gishu",
    crop: "maize",
    pricePerBag: 2800,
    bagSizeKg: 90,
    classification: "farm-gate",
    source: "ShambaAI Demo Dataset (illustrative, modeled on public reporting patterns)",
    lastUpdated: now(),
    freshness: "illustrative"
  }
];

export const SAMPLE_FERTILIZER_LISTINGS: Omit<FertilizerListing, "isDemoData" | "isFictionalSupplier">[] = [
  {
    type: "DAP",
    packageSizeKg: 50,
    pricePerBag: 6500,
    supplier: "Nakuru Agrovet Co. (fictional demo supplier)",
    county: "Nakuru",
    availability: "in_stock",
    source: "ShambaAI Demo Dataset (fictional listing for demonstration)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    type: "NPK",
    packageSizeKg: 50,
    pricePerBag: 5800,
    supplier: "Nakuru Agrovet Co. (fictional demo supplier)",
    county: "Nakuru",
    availability: "in_stock",
    source: "ShambaAI Demo Dataset (fictional listing for demonstration)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    type: "UREA",
    packageSizeKg: 50,
    pricePerBag: 5200,
    supplier: "Rift Valley Farm Inputs Ltd. (fictional demo supplier)",
    county: "Nakuru",
    availability: "low_stock",
    source: "ShambaAI Demo Dataset (fictional listing for demonstration)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    type: "CAN",
    packageSizeKg: 50,
    pricePerBag: 4200,
    supplier: "Rift Valley Farm Inputs Ltd. (fictional demo supplier)",
    county: "Nakuru",
    availability: "in_stock",
    source: "ShambaAI Demo Dataset (fictional listing for demonstration)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    type: "DAP",
    packageSizeKg: 50,
    pricePerBag: 6300,
    supplier: "Eldoret Farmers Depot (fictional demo supplier)",
    county: "Uasin Gishu",
    availability: "in_stock",
    source: "ShambaAI Demo Dataset (fictional listing for demonstration)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    type: "NPK",
    packageSizeKg: 50,
    pricePerBag: 5600,
    supplier: "Eldoret Farmers Depot (fictional demo supplier)",
    county: "Uasin Gishu",
    availability: "out_of_stock",
    source: "ShambaAI Demo Dataset (fictional listing for demonstration)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    type: "UREA",
    packageSizeKg: 50,
    pricePerBag: 5000,
    supplier: "Eldoret Farmers Depot (fictional demo supplier)",
    county: "Uasin Gishu",
    availability: "in_stock",
    source: "ShambaAI Demo Dataset (fictional listing for demonstration)",
    lastUpdated: now(),
    freshness: "illustrative"
  },
  {
    type: "CAN",
    packageSizeKg: 50,
    pricePerBag: 4100,
    supplier: "Eldoret Farmers Depot (fictional demo supplier)",
    county: "Uasin Gishu",
    availability: "in_stock",
    source: "ShambaAI Demo Dataset (fictional listing for demonstration)",
    lastUpdated: now(),
    freshness: "illustrative"
  }
];

export const DEMO_FARMER_PROFILE = {
  name: "Mary Wanjiku",
  county: "Nakuru",
  crop: "maize" as const,
  farmSizeAcres: 1,
  budgetKsh: 12000,
  preferredLocale: "sw" as const,
  sampleQuery:
    "Habari, nataka kupanda mahindi kwa ekari moja Nakuru. Bei ya mbolea ni ngapi, na mahindi yanauzwa bei gani sokoni? Nina budget ya shilingi 12,000. Naweza kupanga aje?"
};
