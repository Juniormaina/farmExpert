import type { Locale } from "./types";

export interface TrustRecord {
  source: string;
  lastUpdated: string;
  freshness: string;
  isDemoData?: boolean;
}

export function trustLine(record: TrustRecord, locale: Locale): string {
  if (record.isDemoData || record.freshness === "illustrative" || record.freshness === "unknown") {
    return locale === "sw"
      ? `Makadirio ya mfano. Chanzo: ${record.source}. Hakuna tarehe ya ukusanyaji wa bei sokoni.`
      : `Demo estimate. Source: ${record.source}. No market collection date is on file.`;
  }
  const parsed = new Date(record.lastUpdated);
  const when = Number.isNaN(parsed.getTime()) ? record.lastUpdated : parsed.toISOString().slice(0, 10);
  return locale === "sw"
    ? `Chanzo: ${record.source}. Ilisasishwa: ${when}.`
    : `Source: ${record.source}. Updated: ${when}.`;
}
