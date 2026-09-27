export type Locale = "en" | "sw";
export type Channel = "web" | "sms" | "ussd";
export type FertilizerType = "DAP" | "NPK" | "UREA" | "CAN";
export type DataFreshness = "verified" | "cached" | "illustrative" | "unknown";
export type ProviderName = "ollama" | "hosted" | "deterministic";

export interface MarketPrice {
  market: string;
  county: string;
  crop: "maize";
  pricePerBag: number;
  bagSizeKg: number;
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

export interface BudgetLineItem {
  label: string;
  amountKsh: number;
  detail: string;
}

export interface BudgetAssumptions {
  fertilizerBagsPerAcre: number;
  seedCostPerAcre: number;
  laborCostPerAcre: number;
  landPrepCostPerAcre: number;
  includeSeed: boolean;
  includeLabor: boolean;
  includeLandPrep: boolean;
}

export interface BudgetResult {
  input: {
    county: string;
    crop: "maize";
    farmSizeAcres: number;
    budgetKsh: number;
    fertilizerType: FertilizerType;
  };
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
  | "maize_price"
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
  crop?: "maize";
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
}

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

export interface SmsMessage {
  sessionId: string;
  from: "farmer" | "agent";
  text: string;
  timestamp: string;
}

export interface DemoProfile {
  name: string;
  county: string;
  crop: "maize";
  farmSizeAcres: number;
  budgetKsh: number;
  preferredLocale: Locale;
  sampleQuery: string;
}
