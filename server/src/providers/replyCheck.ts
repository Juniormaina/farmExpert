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

export function assertReplyIsTrustworthy(reply: string, baseReply: string): void {
  if (REASONING_LEAK.test(reply)) {
    throw new ReplyRejectedError("reply leaked the model's reasoning instead of answering");
  }
  // The deterministic services already computed the numbers. A rephrase that
  // drops or alters one is worse than no rephrase, so fall back rather than mislead.
  const replyNumbers = normalizeNumbers(reply);
  const missing = [...normalizeNumbers(baseReply)].filter((n) => !replyNumbers.has(n));
  if (missing.length > 0) {
    throw new ReplyRejectedError(`reply dropped numbers: ${missing.join(", ")}`);
  }
}
