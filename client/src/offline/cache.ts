import type { FertilizerListing, MarketPrice, SystemStatus } from "../types";

const KEYS = {
  markets: "farmexpert:cache:markets",
  fertilizer: "farmexpert:cache:fertilizer",
  status: "farmexpert:cache:status",
  pendingMessages: "farmexpert:queue:messages"
} as const;

interface CachedEntry<T> {
  data: T;
  cachedAt: string;
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private browsing, quota, etc.): degrade silently.
  }
}

function safeGet<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function cacheMarketPrices(data: MarketPrice[]): void {
  safeSet(KEYS.markets, { data, cachedAt: new Date().toISOString() });
}

export function getCachedMarketPrices(): CachedEntry<MarketPrice[]> | undefined {
  return safeGet(KEYS.markets);
}

export function cacheFertilizerListings(data: FertilizerListing[]): void {
  safeSet(KEYS.fertilizer, { data, cachedAt: new Date().toISOString() });
}

export function getCachedFertilizerListings(): CachedEntry<FertilizerListing[]> | undefined {
  return safeGet(KEYS.fertilizer);
}

export function cacheStatus(data: SystemStatus): void {
  safeSet(KEYS.status, { data, cachedAt: new Date().toISOString() });
}

export function getCachedStatus(): CachedEntry<SystemStatus> | undefined {
  return safeGet(KEYS.status);
}

export interface PendingMessage {
  id: string;
  channel: "web" | "sms";
  sessionId?: string;
  text: string;
  locale?: string;
  queuedAt: string;
}

export function enqueuePendingMessage(message: Omit<PendingMessage, "id" | "queuedAt">): PendingMessage {
  const entry: PendingMessage = { ...message, id: crypto.randomUUID(), queuedAt: new Date().toISOString() };
  const pending = safeGet<PendingMessage[]>(KEYS.pendingMessages) ?? [];
  pending.push(entry);
  safeSet(KEYS.pendingMessages, pending);
  return entry;
}

export function getPendingMessages(): PendingMessage[] {
  return safeGet<PendingMessage[]>(KEYS.pendingMessages) ?? [];
}

export function clearPendingMessage(id: string): void {
  const pending = safeGet<PendingMessage[]>(KEYS.pendingMessages) ?? [];
  safeSet(KEYS.pendingMessages, pending.filter((m) => m.id !== id));
}
