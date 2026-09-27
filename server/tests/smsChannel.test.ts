import { describe, expect, it, vi } from "vitest";
import { formatForSms, handleSmsMessage } from "../src/channels/smsChannel.js";
import { HostedProvider } from "../src/providers/hostedProvider.js";
import { DEMO_DATA_NOTICE } from "../src/shared/i18n.js";

describe("formatForSms", () => {
  it("keeps the demo label even when the reply is far longer than one SMS", () => {
    const longReply = `${"Bei za mbolea: DAP KSh 6,500. ".repeat(30)}\n\n${DEMO_DATA_NOTICE.sw}`;
    const sms = formatForSms(longReply, "sw");
    expect(sms.length).toBeLessThanOrEqual(612);
    expect(sms.startsWith("ShambaAI (TAARIFA YA MFANO")).toBe(true);
    expect(sms.endsWith("...")).toBe(true);
  });

  it("does not repeat the full notice when the label is already the prefix", () => {
    const sms = formatForSms(`Maize prices: KSh 3,200.\n\n${DEMO_DATA_NOTICE.en}`, "en");
    expect(sms).toBe("ShambaAI (DEMO DATA, not live prices): Maize prices: KSh 3,200.");
  });
});

describe("SMS replies", () => {
  it("never go through the AI, so they stay short and factual", async () => {
    vi.spyOn(HostedProvider.prototype, "isAvailable").mockResolvedValue(true);
    const reword = vi.spyOn(HostedProvider.prototype, "generateReply").mockResolvedValue("Hello farmer! ...");
    const result = await handleSmsMessage("sms-no-ai", "Bei ya mahindi Nakuru?");
    expect(reword).not.toHaveBeenCalled();
    expect(result.response.providerUsed).toBe("deterministic");
    expect(result.agentText).toContain("KSh 3,200");
    vi.restoreAllMocks();
  });
});
