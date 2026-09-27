import type { AgentResponse, Locale } from "../shared/types.js";
import { handleAgentMessage } from "../agent/index.js";
import { DEMO_DATA_NOTICE } from "../shared/i18n.js";

const SMS_MAX_LENGTH = 320;

const SMS_DEMO_PREFIX: Record<Locale, string> = {
  en: "ShambaAI (DEMO DATA, not live prices): ",
  sw: "ShambaAI (TAARIFA YA MFANO, si bei halisi): "
};

export interface SmsMessage {
  sessionId: string;
  from: "farmer" | "agent";
  text: string;
  timestamp: string;
}

const smsHistory = new Map<string, SmsMessage[]>();

// The demo label goes first so truncation can never cut it off.
export function formatForSms(reply: string, locale: Locale): string {
  const prefix = SMS_DEMO_PREFIX[locale];
  const body = reply.replace(DEMO_DATA_NOTICE.en, "").replace(DEMO_DATA_NOTICE.sw, "").trim();
  const room = SMS_MAX_LENGTH - prefix.length;
  const trimmedBody = body.length <= room ? body : `${body.slice(0, room - 3)}...`;
  return prefix + trimmedBody;
}

export async function handleSmsMessage(
  sessionId: string,
  text: string,
  locale?: Locale
): Promise<{ agentText: string; history: SmsMessage[]; response: AgentResponse }> {
  const history = smsHistory.get(sessionId) ?? [];
  const now = new Date().toISOString();

  history.push({ sessionId, from: "farmer", text, timestamp: now });

  const response = await handleAgentMessage({ message: text, locale, channel: "sms", sessionId });
  const agentText = formatForSms(response.reply, response.locale);

  history.push({ sessionId, from: "agent", text: agentText, timestamp: new Date().toISOString() });
  smsHistory.set(sessionId, history);

  return { agentText, history, response };
}

export function getSmsHistory(sessionId: string): SmsMessage[] {
  return smsHistory.get(sessionId) ?? [];
}

export function resetSmsHistory(sessionId?: string): void {
  if (sessionId) smsHistory.delete(sessionId);
  else smsHistory.clear();
}
