import { afterEach, describe, expect, it, vi } from "vitest";
import { generateReply, getSystemStatus } from "../src/providers/providerManager.js";
import { HostedProvider } from "../src/providers/hostedProvider.js";
import { OllamaProvider } from "../src/providers/ollamaProvider.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("providerManager", () => {
  it("falls back to the deterministic provider when Ollama and hosted are unavailable", async () => {
    const status = await getSystemStatus();
    expect(status.activeProvider).toBe("deterministic");
    expect(status.online).toBe(false);
  });

  it("always returns a reply even with no AI backend configured", async () => {
    const result = await generateReply({
      rawMessage: "test",
      locale: "en",
      intents: ["greeting"],
      entities: {},
      baseReply: "Hello from the deterministic template."
    });
    expect(result.providerUsed).toBe("deterministic");
    expect(result.text).toBe("Hello from the deterministic template.");
  });

  it("rejects a local Ollama reply that changes a price", async () => {
    vi.spyOn(OllamaProvider.prototype, "isAvailable").mockResolvedValue(true);
    vi.spyOn(OllamaProvider.prototype, "generateReply").mockResolvedValue("Maize sells for KSh 5,000 per bag.");

    const result = await generateReply({
      rawMessage: "test",
      locale: "en",
      intents: ["maize_price"],
      entities: {},
      baseReply: "Maize: KSh 3,200."
    });

    expect(result.providerUsed).toBe("deterministic");
    expect(result.text).toBe("Maize: KSh 3,200.");
  });

  it("rejects a local Ollama reply that adds a number", async () => {
    vi.spyOn(OllamaProvider.prototype, "isAvailable").mockResolvedValue(true);
    vi.spyOn(OllamaProvider.prototype, "generateReply").mockResolvedValue(
      "Maize is KSh 3,200. The verified price today is also KSh 99,999."
    );

    const result = await generateReply({
      rawMessage: "test",
      locale: "en",
      intents: ["crop_price"],
      entities: {},
      baseReply: "Maize: KSh 3,200."
    });

    expect(result.providerUsed).toBe("deterministic");
    expect(result.text).toBe("Maize: KSh 3,200.");
  });

  it("accepts a local Ollama reply that keeps every number", async () => {
    vi.spyOn(OllamaProvider.prototype, "isAvailable").mockResolvedValue(true);
    vi.spyOn(OllamaProvider.prototype, "generateReply").mockResolvedValue("Good news: maize is KSh 3,200 a bag.");

    const result = await generateReply({
      rawMessage: "test",
      locale: "en",
      intents: ["maize_price"],
      entities: {},
      baseReply: "Maize: KSh 3,200."
    });

    expect(result.providerUsed).toBe("ollama");
  });

  it("answers with the deterministic reply when the hosted model is too slow", async () => {
    vi.spyOn(HostedProvider.prototype, "isAvailable").mockResolvedValue(true);
    vi.spyOn(HostedProvider.prototype, "generateReply").mockImplementation(() => new Promise(() => {}));

    const started = Date.now();
    const result = await generateReply({
      rawMessage: "test",
      locale: "en",
      intents: ["maize_price"],
      entities: {},
      baseReply: "Maize: KSh 3,200."
    });

    expect(result.providerUsed).toBe("deterministic");
    expect(result.text).toBe("Maize: KSh 3,200.");
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
