import type { CropBudgetDefaults, CropId, FertilizerType, PriceUnit } from "./crops.js";

export type { CropId, FertilizerType, PriceUnit } from "./crops.js";

export type Locale = "en" | "sw";

export type DataFreshness = "verified" | "cached" | "illustrative" | "unknown";

export interface MarketPrice {
  market: string;
  county: string;
  crop: CropId;
  pricePerUnit: number;
  unit: PriceUnit;
  // Weight of one selling unit, e.g. 90 for a 90kg bag, 1 for per-kg prices.
  unitKg: number;
  classification: "wholesale" | "retail" | "farm-gate";
  source: string;
  lastUpdated: string;
  freshness: DataFreshness;
  isDemoData: true;
}

export interface FertilizerListing {
  type: FertilizerType;
  packageSizeKg: number;
  pricePerBag: number;
  supplier: string;
  county: string;
  availability: "in_stock" | "low_stock" | "out_of_stock" | "unknown";
  source: string;
  lastUpdated: string;
  freshness: DataFreshness;
  isDemoData: true;
  isFictionalSupplier: true;
}

export interface BudgetInput {
  county: string;
  crop: CropId;
  farmSizeAcres: number;
  budgetKsh: number;
  fertilizerType: FertilizerType;
  assumptions?: Partial<BudgetAssumptions>;
}

export type BudgetAssumptions = CropBudgetDefaults;

export interface BudgetLineItem {
  label: string;
  amountKsh: number;
  detail: string;
}

export interface BudgetResult {
  input: BudgetInput;
  assumptionsUsed: BudgetAssumptions;
  fertilizerBagsNeeded: number;
  lineItems: BudgetLineItem[];
  totalEstimatedCostKsh: number;
  remainingBudgetKsh: number;
  isShortfall: boolean;
  explanation: string[];
  disclaimer: string;
}

export type AgentIntent =
  | "greeting"
  | "crop_price"
  | "fertilizer_price"
  | "fertilizer_availability"
  | "budget_plan"
  | "help"
  | "unknown";

export interface ExtractedEntities {
  county?: string;
  market?: string;
  farmSizeAcres?: number;
  budgetKsh?: number;
  fertilizerType?: FertilizerType;
  crop?: CropId;
}

export interface AgentRequest {
  message: string;
  locale?: Locale;
  channel: "web" | "sms" | "ussd";
  sessionId?: string;
}

export interface AgentResponse {
  reply: string;
  locale: Locale;
  intent: AgentIntent;
  entities: ExtractedEntities;
  data?: {
    marketPrices?: MarketPrice[];
    fertilizerListings?: FertilizerListing[];
    budget?: BudgetResult;
  };
  providerUsed: ProviderName;
  disclaimer?: string;
}

export type ProviderName = "ollama" | "hosted" | "deterministic";

export interface ProviderStatus {
  name: ProviderName;
  available: boolean;
  detail: string;
}

export interface SystemStatus {
  online: boolean;
  providers: ProviderStatus[];
  activeProvider: ProviderName;
  dataMode: "demo";
  serverTime: string;
}
