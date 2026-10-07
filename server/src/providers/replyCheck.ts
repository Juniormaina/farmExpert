// Scratchpad openers. Valid output is English or Kiswahili prose, so an English
// planning sentence at the start means the model is showing its work.
const REASONING_LEAK =
  /^\s*(?:the user|we need to|we must|i need to|i must|i should|let's|let me|first,?\s*i\b|okay,?\s*i\b|to rephrase|to answer|my task|my plan|here'?s my (?:plan|thinking|approach|reasoning)|step \d|fac(?:ts)?\s*:)/i;

function normalizeNumbers(text: string): Set<string> {
  const found = new Set<string>();
  for (const match of text.match(/\d[\d,]*/g) ?? []) {
    found.add(match.replace(/,/g, "").replace(/\.0+$/, ""));
  }
  return found;
}

export class ReplyRejectedError extends Error {}

// Models often answer in markdown, which phones and the chat show as raw
// symbols. Strip the common forms, keeping the words.
export function toPlainText(reply: string): string {
  return reply
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`([^`]*)`/g, "$1")
    .trim();
}

const CLAIM_PATTERNS: Array<[string, RegExp]> = [
  ["today", /\btodays?\b/],
  ["current", /\bcurrent\b/],
  ["verified", /\bverified\b/],
  ["official", /\bofficial(?:ly)?\b/],
  ["guarantee", /\bguarantees?\b|\bguaranteed\b/],
  ["live", /\blive\b/]
];

const DOSAGE = /\b(\d+(?:\.\d+)?\s*)?(?:mg|ml|millilitres?|milliliters?|dosage)\b/i;

// The demo disclaimer uses "verified" and "live" only to say the prices are
// not those things. Repeating that sentence is fine. A new claim is not.
function scrubAuthorizedPhrases(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/demo data: illustrative prices, not a verified live market quote\.?/g, " ")
    .replace(/taarifa ya mfano: bei za mfano, si bei halisi ya sokoni kwa sasa\.?/g, " ")
    .replace(/not a verified|not verified|is not verified|isn't verified/g, " ")
    .replace(/cannot guarantee|can't guarantee|can not guarantee/g, " ")
    .replace(/haiwezi kuhakikisha/g, " ")
    .replace(/don't have a verified|do not have a verified|sina kiwango/g, " ");
}

function claimWords(text: string): string[] {
  const scrubbed = scrubAuthorizedPhrases(text);
  return CLAIM_PATTERNS.filter(([, pattern]) => pattern.test(scrubbed)).map(([name]) => name);
}

export function assertReplyIsTrustworthy(reply: string, baseReply: string): void {
  if (REASONING_LEAK.test(reply)) {
    throw new ReplyRejectedError("reply leaked the model's reasoning instead of answering");
  }
  // Numbers are an allowlist from the deterministic reply. An added figure is
  // not "close enough"; it is a new factual claim.
  const baseNumbers = normalizeNumbers(baseReply);
  const replyNumbers = normalizeNumbers(reply);
  const missing = [...baseNumbers].filter((n) => !replyNumbers.has(n));
  if (missing.length > 0) {
    throw new ReplyRejectedError(`reply dropped numbers: ${missing.join(", ")}`);
  }
  const extra = [...replyNumbers].filter((n) => !baseNumbers.has(n));
  if (extra.length > 0) {
    throw new ReplyRejectedError(`reply added numbers: ${extra.join(", ")}`);
  }
  const baseClaims = new Set(claimWords(baseReply));
  const addedClaims = claimWords(reply).filter((word) => !baseClaims.has(word));
  if (addedClaims.length > 0) {
    throw new ReplyRejectedError(`reply added unsupported claims: ${addedClaims.join(", ")}`);
  }
  if (DOSAGE.test(reply) && !DOSAGE.test(baseReply)) {
    throw new ReplyRejectedError("reply added a dosage the source did not state");
  }
}
