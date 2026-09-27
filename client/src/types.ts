// Shared data types come straight from the server so the two can't drift apart.
export type {
  AgentIntent,
  AgentResponse,
  BudgetAssumptions,
  BudgetLineItem,
  BudgetResult,
  CropId,
  DataFreshness,
  ExtractedEntities,
  FertilizerListing,
  FertilizerType,
  Locale,
  MarketPrice,
  PriceUnit,
  ProviderName,
  ProviderStatus,
  SystemStatus
} from "../../server/src/shared/types";

import type { CropId, Locale } from "../../server/src/shared/types";

export type Channel = "web" | "sms" | "ussd";

export interface SmsMessage {
  sessionId: string;
  from: "farmer" | "agent";
  text: string;
  timestamp: string;
}

export interface DemoProfile {
  name: string;
  county: string;
  crop: CropId;
  farmSizeAcres: number;
  budgetKsh: number;
  preferredLocale: Locale;
  sampleQuery: string;
}
