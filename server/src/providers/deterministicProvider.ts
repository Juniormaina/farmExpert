import type { AIProvider, GenerationContext } from "./types.js";

export class DeterministicProvider implements AIProvider {
  readonly name = "deterministic" as const;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateReply(context: GenerationContext): Promise<string> {
    return context.baseReply;
  }
}
