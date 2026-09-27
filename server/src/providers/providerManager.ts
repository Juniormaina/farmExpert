import type { ProviderName, ProviderStatus, SystemStatus } from "../shared/types.js";
import type { AIProvider, GenerationContext } from "./types.js";
import { DeterministicProvider } from "./deterministicProvider.js";
import { OllamaProvider } from "./ollamaProvider.js";
import { HostedProvider } from "./hostedProvider.js";
import { assertReplyIsTrustworthy } from "./replyCheck.js";

const deterministic = new DeterministicProvider();
const ollama = new OllamaProvider();
const hosted = new HostedProvider();

const PRIORITY: AIProvider[] = [hosted, ollama, deterministic];

export interface GenerationResult {
  text: string;
  providerUsed: ProviderName;
}

async function checkAll(): Promise<ProviderStatus[]> {
  const results = await Promise.all(
    PRIORITY.map(async (provider) => {
      let available = false;
      try {
        available = await provider.isAvailable();
      } catch {
        available = false;
      }
      const detail = describeProvider(provider.name, available);
      return { name: provider.name, available, detail };
    })
  );
  return results;
}

function describeProvider(name: ProviderName, available: boolean): string {
  if (name === "hosted") {
    return available ? "Hosted model configured and reachable" : "Hosted model not configured (no API key)";
  }
  if (name === "ollama") {
    return available ? "Local Ollama model reachable" : "Local Ollama not reachable at configured host";
  }
  return "Deterministic template fallback always available";
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const statuses = await checkAll();
  const active = statuses.find((s) => s.available)?.name ?? "deterministic";
  return {
    online: statuses.find((s) => s.name === "hosted")?.available ?? false,
    providers: statuses,
    activeProvider: active,
    dataMode: "demo",
    serverTime: new Date().toISOString()
  };
}

// Total time allowed for AI phrasing across all providers. The deterministic
// reply carries the same facts, so past this point a farmer is better served
// by it than by waiting; it must also stay under the web client's timeout.
const AI_REPLY_BUDGET_MS = Number(process.env.AI_REPLY_BUDGET_MS ?? 10000);

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no reply within the ${AI_REPLY_BUDGET_MS}ms AI budget`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function generateReply(context: GenerationContext): Promise<GenerationResult> {
  const deadline = Date.now() + AI_REPLY_BUDGET_MS;
  for (const provider of PRIORITY) {
    if (provider === deterministic) break;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    try {
      const available = await withDeadline(provider.isAvailable(), remaining);
      if (!available) continue;
      const text = await withDeadline(provider.generateReply(context), deadline - Date.now());
      assertReplyIsTrustworthy(text, context.baseReply);
      return { text, providerUsed: provider.name };
    } catch (err) {
      // A rejected reply is a normal outcome (timeout, truncated reasoning,
      // dropped numbers), so fall through to the next provider rather than fail.
      const reason = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(`[shambaai] ${provider.name} provider rejected, falling back: ${reason}`);
      continue;
    }
  }
  const text = await deterministic.generateReply(context);
  return { text, providerUsed: "deterministic" };
}
