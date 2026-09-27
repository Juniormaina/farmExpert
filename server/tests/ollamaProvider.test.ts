import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaProvider } from "../src/providers/ollamaProvider.js";

function ollamaListing(models: string[]) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: models.map((name) => ({ name })) }), { status: 200 }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OllamaProvider", () => {
  it("uses Llama 3.2 by default", () => {
    expect(new OllamaProvider().model).toBe("llama3.2");
  });

  it("is not available when Ollama runs but Llama 3.2 is not downloaded", async () => {
    vi.stubGlobal("fetch", ollamaListing(["qwen3:latest", "nomic-embed-text:latest"]));
    expect(await new OllamaProvider().isAvailable()).toBe(false);
  });

  it("is available once Llama 3.2 is downloaded", async () => {
    vi.stubGlobal("fetch", ollamaListing(["qwen3:latest", "llama3.2:latest"]));
    expect(await new OllamaProvider().isAvailable()).toBe(true);
  });

  it("does not mistake a different Llama size for the configured model", async () => {
    vi.stubGlobal("fetch", ollamaListing(["llama3.2:1b"]));
    expect(await new OllamaProvider().isAvailable()).toBe(false);
  });

  it("is not available when Ollama is not running", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));
    expect(await new OllamaProvider().isAvailable()).toBe(false);
  });
});
