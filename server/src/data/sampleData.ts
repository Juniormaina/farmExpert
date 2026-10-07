import type { FertilizerListing, FertilizerType, MarketPrice } from "../shared/types.js";

// Every price here is illustrative demo data, not a market quote. The client
// imports this file for its offline copy, so edit prices in one place only.

type SamplePrice = Omit<MarketPrice, "isDemoData" | "source" | "lastUpdated" | "freshness">;
type SampleListing = Omit<FertilizerListing, "isDemoData" | "isFictionalSupplier" | "source" | "lastUpdated" | "freshness">;

const PRICE_SOURCE = "Farm Expert Demo Dataset (illustrative, modeled on public reporting patterns)";
const LISTING_SOURCE = "Farm Expert Demo Dataset (fictional listing for demonstration)";

const bag90 = { unit: "bag" as const, unitKg: 90 };
const bag50 = { unit: "bag" as const, unitKg: 50 };
const crate64 = { unit: "crate" as const, unitKg: 64 };
const perKg = { unit: "kg" as const, unitKg: 1 };

export const SAMPLE_PRICE_ROWS: SamplePrice[] = [
  // Nakuru
  { crop: "maize", market: "Nakuru Municipal Market", county: "Nakuru", classification: "wholesale", pricePerUnit: 3200, ...bag90 },
  { crop: "maize", market: "Nakuru Retail Market", county: "Nakuru", classification: "retail", pricePerUnit: 3600, ...bag90 },
  { crop: "beans", market: "Nakuru Municipal Market", county: "Nakuru", classification: "wholesale", pricePerUnit: 9000, ...bag90 },
  { crop: "beans", market: "Nakuru Retail Market", county: "Nakuru", classification: "retail", pricePerUnit: 9800, ...bag90 },
  { crop: "potatoes", market: "Molo Farm-gate", county: "Nakuru", classification: "farm-gate", pricePerUnit: 1800, ...bag50 },
  { crop: "potatoes", market: "Nakuru Wakulima Market", county: "Nakuru", classification: "wholesale", pricePerUnit: 2600, ...bag50 },
  { crop: "tomatoes", market: "Nakuru Wakulima Market", county: "Nakuru", classification: "wholesale", pricePerUnit: 4500, ...crate64 },
  { crop: "kale", market: "Nakuru Wakulima Market", county: "Nakuru", classification: "wholesale", pricePerUnit: 30, ...perKg },

  // Uasin Gishu (Eldoret)
  { crop: "maize", market: "Eldoret Municipal Market", county: "Uasin Gishu", classification: "wholesale", pricePerUnit: 3000, ...bag90 },
  { crop: "maize", market: "Eldoret Farm-gate", county: "Uasin Gishu", classification: "farm-gate", pricePerUnit: 2800, ...bag90 },
  { crop: "beans", market: "Eldoret Municipal Market", county: "Uasin Gishu", classification: "wholesale", pricePerUnit: 8500, ...bag90 },
  { crop: "potatoes", market: "Eldoret Municipal Market", county: "Uasin Gishu", classification: "wholesale", pricePerUnit: 2400, ...bag50 },
  { crop: "tomatoes", market: "Eldoret Municipal Market", county: "Uasin Gishu", classification: "wholesale", pricePerUnit: 5000, ...crate64 },
  { crop: "kale", market: "Eldoret Municipal Market", county: "Uasin Gishu", classification: "wholesale", pricePerUnit: 35, ...perKg },

  // Kericho
  { crop: "tea", market: "Kericho Green Leaf Buying Centre", county: "Kericho", classification: "farm-gate", pricePerUnit: 24, ...perKg },
  { crop: "maize", market: "Kericho Town Market", county: "Kericho", classification: "wholesale", pricePerUnit: 3300, ...bag90 },
  { crop: "beans", market: "Kericho Town Market", county: "Kericho", classification: "wholesale", pricePerUnit: 9200, ...bag90 },
  { crop: "tomatoes", market: "Kericho Town Market", county: "Kericho", classification: "wholesale", pricePerUnit: 4800, ...crate64 },
  { crop: "kale", market: "Kericho Town Market", county: "Kericho", classification: "wholesale", pricePerUnit: 30, ...perKg }
];

function listing(
  type: FertilizerType,
  pricePerBag: number,
  supplier: string,
  county: string,
  availability: FertilizerListing["availability"]
): SampleListing {
  return { type, packageSizeKg: 50, pricePerBag, supplier: `${supplier} (fictional demo supplier)`, county, availability };
}

export const SAMPLE_LISTING_ROWS: SampleListing[] = [
  listing("DAP", 6500, "Nakuru Agrovet Co.", "Nakuru", "in_stock"),
  listing("NPK", 5800, "Nakuru Agrovet Co.", "Nakuru", "in_stock"),
  listing("UREA", 5200, "Rift Valley Farm Inputs Ltd.", "Nakuru", "low_stock"),
  listing("CAN", 4200, "Rift Valley Farm Inputs Ltd.", "Nakuru", "in_stock"),
  listing("DAP", 6300, "Eldoret Farmers Depot", "Uasin Gishu", "in_stock"),
  listing("NPK", 5600, "Eldoret Farmers Depot", "Uasin Gishu", "out_of_stock"),
  listing("UREA", 5000, "Eldoret Farmers Depot", "Uasin Gishu", "in_stock"),
  listing("CAN", 4100, "Eldoret Farmers Depot", "Uasin Gishu", "in_stock"),
  listing("DAP", 6400, "Kericho Highlands Agrovet", "Kericho", "in_stock"),
  listing("NPK", 5700, "Kericho Highlands Agrovet", "Kericho", "in_stock"),
  listing("UREA", 5100, "Kericho Highlands Agrovet", "Kericho", "in_stock"),
  listing("CAN", 4150, "Kericho Highlands Agrovet", "Kericho", "low_stock")
];

export function samplePrices(lastUpdated: string, source = PRICE_SOURCE): MarketPrice[] {
  return SAMPLE_PRICE_ROWS.map((row) => ({ ...row, source, lastUpdated, freshness: "illustrative", isDemoData: true }));
}

export function sampleListings(lastUpdated: string, source = LISTING_SOURCE): FertilizerListing[] {
  return SAMPLE_LISTING_ROWS.map((row) => ({
    ...row,
    source,
    lastUpdated,
    freshness: "illustrative",
    isDemoData: true,
    isFictionalSupplier: true
  }));
}

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
