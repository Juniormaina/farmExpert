import type { AIProvider, GenerationContext } from "./types.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const HEALTH_TIMEOUT_MS = 800;
const GENERATE_TIMEOUT_MS = 8000;

function buildSystemPrompt(context: GenerationContext): string {
  return [
    "You are ShambaAI, an assistant for Kenyan smallholder farmers.",
    "You must NOT invent any prices, availability, or numbers.",
    "Below are FACTS already computed by deterministic services. Rephrase them warmly and clearly",
    `in ${context.locale === "sw" ? "Kiswahili" : "English"}, keeping every number and label exactly as given.`,
    "Do not add new numeric claims that are not in the FACTS.",
    "Write plain text only: no markdown, no asterisks, no headings.",
    "",
    "FACTS:",
    context.baseReply
  ].join("\n");
}

// Ollama lists models with a tag, e.g. "llama3.2:latest" for "llama3.2".
function isInstalled(installed: string[], model: string): boolean {
  const wanted = model.includes(":") ? model : `${model}:latest`;
  return installed.includes(wanted);
}

export class OllamaProvider implements AIProvider {
  readonly name = "ollama" as const;
  readonly model = OLLAMA_MODEL;

  // Ollama running is not enough: the configured model must be downloaded too,
  // otherwise the app would report a local AI that fails on every request.
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return false;
      const json = (await res.json()) as { models?: Array<{ name?: string }> };
      const installed = (json.models ?? []).map((m) => m.name ?? "");
      return isInstalled(installed, OLLAMA_MODEL);
    } catch {
      return false;
    }
  }

  async generateReply(context: GenerationContext): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
    try {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: buildSystemPrompt(context),
          stream: false
        }),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);
      const json = (await res.json()) as { response?: string };
      const text = json.response?.trim();
      if (!text) throw new Error("Ollama returned empty response");
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }
}
