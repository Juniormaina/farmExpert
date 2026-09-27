import type { AgentIntent, ExtractedEntities, Locale, ProviderName } from "../shared/types.js";

export interface GenerationContext {
  rawMessage: string;
  locale: Locale;
  intents: AgentIntent[];
  entities: ExtractedEntities;
  baseReply: string;
}

export interface AIProvider {
  readonly name: ProviderName;
  isAvailable(): Promise<boolean>;
  generateReply(context: GenerationContext): Promise<string>;
}
