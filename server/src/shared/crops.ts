// The one crop catalogue for the whole app. The web client imports this file
// directly, so the server and the offline client can never disagree about a
// crop's names, units or budget defaults. Keep it free of runtime imports.

export type CropId = "maize" | "beans" | "potatoes" | "tomatoes" | "tea" | "kale";
export type FertilizerType = "DAP" | "NPK" | "UREA" | "CAN";
export type PriceUnit = "bag" | "crate" | "kg";

export interface CropBudgetDefaults {
  fertilizerBagsPerAcre: number;
  seedCostPerAcre: number;
  laborCostPerAcre: number;
  landPrepCostPerAcre: number;
  includeSeed: boolean;
  includeLabor: boolean;
  includeLandPrep: boolean;
}

export interface CropInfo {
  id: CropId;
  name: { en: string; sw: string };
  // Compact label for buttons and pickers where space is tight.
  shortName: { en: string; sw: string };
  // Lowercase words or phrases a farmer might use, in English or Kiswahili.
  aliases: string[];
  seedLabel: { en: string; sw: string };
  defaultFertilizer: FertilizerType;
  budgetDefaults: CropBudgetDefaults;
  budgetNote?: { en: string; sw: string };
  // Omitted means the bag rate is an illustration. Set "verified" only after the
  // sign-off in docs/AGRONOMIC_REVIEW.md. Do not set it to make the product look finished.
  rateStatus?: "illustrative" | "verified";
}

export type AgronomicRateStatus = "illustrative" | "verified";

export function agronomicRateStatus(crop: CropInfo): AgronomicRateStatus {
  return crop.rateStatus ?? "illustrative";
}

// All budget figures are illustrative per-acre estimates for the demo, not
// agronomic recommendations.
export const CROPS: CropInfo[] = [
  {
    id: "maize",
    name: { en: "Maize", sw: "Mahindi" },
    shortName: { en: "Maize", sw: "Mahindi" },
    aliases: ["maize", "corn", "mahindi"],
    seedLabel: { en: "Seed", sw: "Mbegu" },
    defaultFertilizer: "DAP",
    budgetDefaults: {
      fertilizerBagsPerAcre: 2,
      seedCostPerAcre: 1500,
      laborCostPerAcre: 3000,
      landPrepCostPerAcre: 2500,
      includeSeed: true,
      includeLabor: true,
      includeLandPrep: true
    }
  },
  {
    id: "beans",
    name: { en: "Beans", sw: "Maharagwe" },
    shortName: { en: "Beans", sw: "Maharagwe" },
    aliases: ["beans", "bean", "maharagwe", "maharage"],
    seedLabel: { en: "Seed", sw: "Mbegu" },
    defaultFertilizer: "DAP",
    budgetDefaults: {
      fertilizerBagsPerAcre: 1,
      seedCostPerAcre: 4000,
      laborCostPerAcre: 3000,
      landPrepCostPerAcre: 2500,
      includeSeed: true,
      includeLabor: true,
      includeLandPrep: true
    }
  },
  {
    id: "potatoes",
    name: { en: "Irish potatoes", sw: "Viazi" },
    shortName: { en: "Potatoes", sw: "Viazi" },
    aliases: ["irish potatoes", "irish potato", "potatoes", "potato", "viazi", "waru"],
    seedLabel: { en: "Seed potatoes", sw: "Mbegu za viazi" },
    defaultFertilizer: "DAP",
    budgetDefaults: {
      fertilizerBagsPerAcre: 4,
      seedCostPerAcre: 30000,
      laborCostPerAcre: 8000,
      landPrepCostPerAcre: 4000,
      includeSeed: true,
      includeLabor: true,
      includeLandPrep: true
    }
  },
  {
    id: "tomatoes",
    name: { en: "Tomatoes", sw: "Nyanya" },
    shortName: { en: "Tomatoes", sw: "Nyanya" },
    aliases: ["tomatoes", "tomato", "nyanya"],
    seedLabel: { en: "Seed and seedlings", sw: "Mbegu na miche" },
    defaultFertilizer: "DAP",
    budgetDefaults: {
      fertilizerBagsPerAcre: 3,
      seedCostPerAcre: 6000,
      laborCostPerAcre: 12000,
      landPrepCostPerAcre: 4000,
      includeSeed: true,
      includeLabor: true,
      includeLandPrep: true
    },
    budgetNote: {
      en: "Tomatoes also need spraying and staking, which are not included here.",
      sw: "Nyanya pia zinahitaji dawa na miti ya kuegemeza, ambazo hazijajumuishwa hapa."
    }
  },
  {
    id: "tea",
    name: { en: "Tea", sw: "Majani chai" },
    shortName: { en: "Tea", sw: "Chai" },
    aliases: ["tea", "green leaf", "majani chai", "chai"],
    seedLabel: { en: "Planting material", sw: "Miche" },
    defaultFertilizer: "NPK",
    budgetDefaults: {
      fertilizerBagsPerAcre: 4,
      seedCostPerAcre: 0,
      laborCostPerAcre: 15000,
      landPrepCostPerAcre: 0,
      includeSeed: false,
      includeLabor: true,
      includeLandPrep: false
    },
    budgetNote: {
      en: "For tea this is one season's upkeep of established bushes, with labour mainly for plucking.",
      sw: "Kwa chai hii ni gharama ya msimu mmoja kwa miti iliyokwisha kupandwa, kibarua hasa cha kuchuma."
    }
  },
  {
    id: "kale",
    name: { en: "Sukuma wiki (kale)", sw: "Sukuma wiki" },
    shortName: { en: "Sukuma wiki", sw: "Sukuma wiki" },
    aliases: ["sukuma wiki", "sukuma", "kale", "collards", "collard greens"],
    seedLabel: { en: "Seed", sw: "Mbegu" },
    defaultFertilizer: "DAP",
    budgetDefaults: {
      fertilizerBagsPerAcre: 2,
      seedCostPerAcre: 1000,
      laborCostPerAcre: 4000,
      landPrepCostPerAcre: 2500,
      includeSeed: true,
      includeLabor: true,
      includeLandPrep: true
    }
  }
];

export const CROP_IDS: CropId[] = CROPS.map((c) => c.id);

export function getCrop(id: CropId): CropInfo {
  const crop = CROPS.find((c) => c.id === id);
  if (!crop) throw new Error(`Unknown crop: ${id}`);
  return crop;
}

export function isCropId(value: unknown): value is CropId {
  return typeof value === "string" && (CROP_IDS as string[]).includes(value);
}

export interface CountyInfo {
  value: string;
  label: string;
  aliases: string[];
}

export const COUNTIES: CountyInfo[] = [
  { value: "Nakuru", label: "Nakuru", aliases: ["nakuru", "molo"] },
  { value: "Uasin Gishu", label: "Eldoret", aliases: ["uasin gishu", "eldoret"] },
  { value: "Kericho", label: "Kericho", aliases: ["kericho"] }
];
