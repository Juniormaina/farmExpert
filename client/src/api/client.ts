import type {
  AgentResponse,
  BudgetAssumptions,
  DemoProfile,
  FertilizerListing,
  FertilizerType,
  Locale,
  MarketPrice,
  SmsMessage,
  SystemStatus
} from "../types";
import {
  cacheFertilizerListings,
  cacheMarketPrices,
  cacheStatus,
  enqueuePendingMessage,
  getCachedFertilizerListings,
  getCachedMarketPrices,
  getCachedStatus,
  getPendingMessages,
  clearPendingMessage
} from "../offline/cache";
import { answerLocally } from "../offline/localAgent";
import { calculateBudgetLocally } from "../offline/localBudget";
import { LOCAL_DEMO_PROFILE, LOCAL_FERTILIZER_LISTINGS, LOCAL_MARKET_PRICES } from "../offline/localData";

const TIMEOUT_MS = 4000;
// Chat/SMS may go through a hosted LLM round trip on the server, which can
// legitimately take several seconds, so a short timeout here would make the
// client "go offline" on every AI-phrased reply even though the server is fine.
const CHAT_TIMEOUT_MS = 15000;

export interface Sourced<T> {
  data: T;
  source: "live" | "cache" | "bundled";
  cachedAt?: string;
}

export class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// A 4xx means the server is up and rejected the input, so it must be shown
// rather than hidden behind an offline fallback. A 5xx can be the dev proxy
// reporting that the backend is down, which is a genuine offline case.
function isRejectedInput(err: unknown): err is HttpError {
  return err instanceof HttpError && err.status >= 400 && err.status < 500;
}

async function fetchJson<T>(path: string, options?: RequestInit, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, { ...options, signal: controller.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new HttpError(body?.error ?? `Request failed with ${res.status}`, res.status);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getStatus(): Promise<Sourced<SystemStatus>> {
  try {
    const status = await fetchJson<SystemStatus>("/api/status");
    cacheStatus(status);
    return { data: status, source: "live" };
  } catch {
    const cached = getCachedStatus();
    if (cached) return { data: cached.data, source: "cache", cachedAt: cached.cachedAt };
    return {
      data: { online: false, providers: [], activeProvider: "deterministic", dataMode: "demo", serverTime: new Date().toISOString() },
      source: "bundled"
    };
  }
}

// Both lookups fetch and cache the full dataset, then filter on the device, so
// the offline cache covers every county rather than only the last one viewed.
export async function getMarkets(county?: string): Promise<Sourced<MarketPrice[]>> {
  const filter = (prices: MarketPrice[]) => (county ? prices.filter((p) => p.county === county) : prices);
  try {
    const res = await fetchJson<{ prices: MarketPrice[] }>("/api/markets");
    cacheMarketPrices(res.prices);
    return { data: filter(res.prices), source: "live" };
  } catch {
    const cached = getCachedMarketPrices();
    if (cached) return { data: filter(cached.data), source: "cache", cachedAt: cached.cachedAt };
    return { data: filter(LOCAL_MARKET_PRICES), source: "bundled" };
  }
}

export async function getFertilizer(type?: FertilizerType, county?: string): Promise<Sourced<FertilizerListing[]>> {
  const filter = (listings: FertilizerListing[]) =>
    listings.filter((l) => (!type || l.type === type) && (!county || l.county === county));
  try {
    const res = await fetchJson<{ listings: FertilizerListing[] }>("/api/fertilizer");
    cacheFertilizerListings(res.listings);
    return { data: filter(res.listings), source: "live" };
  } catch {
    const cached = getCachedFertilizerListings();
    if (cached) return { data: filter(cached.data), source: "cache", cachedAt: cached.cachedAt };
    return { data: filter(LOCAL_FERTILIZER_LISTINGS), source: "bundled" };
  }
}

export async function calculateBudget(input: {
  county: string;
  farmSizeAcres: number;
  budgetKsh: number;
  fertilizerType: FertilizerType;
  assumptions?: Partial<BudgetAssumptions>;
  locale?: Locale;
}) {
  try {
    return {
      data: await fetchJson<ReturnType<typeof calculateBudgetLocally>>("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      }),
      source: "live" as const
    };
  } catch (err) {
    if (isRejectedInput(err)) throw err;
    return { data: calculateBudgetLocally(input, input.locale), source: "bundled" as const };
  }
}

export async function sendChatMessage(message: string, locale?: Locale): Promise<Sourced<AgentResponse>> {
  try {
    const data = await fetchJson<AgentResponse>(
      "/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, locale })
      },
      CHAT_TIMEOUT_MS
    );
    return { data, source: "live" };
  } catch {
    enqueuePendingMessage({ channel: "web", text: message, locale });
    return { data: answerLocally(message, locale), source: "bundled" };
  }
}

export async function sendSms(sessionId: string, text: string, locale?: Locale) {
  try {
    const data = await fetchJson<{ agentText: string; history: SmsMessage[]; response: AgentResponse }>(
      "/api/sms",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text, locale })
      },
      CHAT_TIMEOUT_MS
    );
    return { data, source: "live" as const };
  } catch {
    enqueuePendingMessage({ channel: "sms", sessionId, text, locale });
    const response = answerLocally(text, locale);
    return {
      data: {
        agentText: response.reply,
        history: [] as SmsMessage[],
        response
      },
      source: "bundled" as const
    };
  }
}

export async function getSmsHistory(sessionId: string): Promise<SmsMessage[]> {
  try {
    const res = await fetchJson<{ history: SmsMessage[] }>(`/api/sms/${sessionId}/history`);
    return res.history;
  } catch {
    return [];
  }
}

export async function ussdStart(sessionId: string, locale: Locale) {
  return fetchJson<{ text: string; done: boolean }>("/api/ussd/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, locale })
  });
}

export async function ussdInput(sessionId: string, input: string) {
  return fetchJson<{ text: string; done: boolean }>(`/api/ussd/${sessionId}/input`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input })
  });
}

export async function getDemoProfile(): Promise<DemoProfile> {
  try {
    return await fetchJson<DemoProfile>("/api/demo/profile");
  } catch {
    return LOCAL_DEMO_PROFILE;
  }
}

export async function resetDemo(): Promise<boolean> {
  try {
    await fetchJson("/api/demo/reset", { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

export async function syncPendingMessages(): Promise<number> {
  const pending = getPendingMessages();
  let synced = 0;
  for (const message of pending) {
    try {
      if (message.channel === "sms" && message.sessionId) {
        await fetchJson("/api/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: message.sessionId, text: message.text, locale: message.locale })
        });
      } else {
        await fetchJson("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message.text, locale: message.locale })
        });
      }
      clearPendingMessage(message.id);
      synced += 1;
    } catch {
      break;
    }
  }
  return synced;
}
