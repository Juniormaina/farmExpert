import { describe, expect, it } from "vitest";
import { assertReplyIsTrustworthy, ReplyRejectedError, toPlainText } from "../src/providers/replyCheck.js";

describe("toPlainText", () => {
  it("removes markdown that phones and the chat would show as symbols", () => {
    const reply = "## Prices\n- **Nakuru Municipal Market**: KSh 3,200\n- __Retail__: `KSh 3,600`";
    expect(toPlainText(reply)).toBe("Prices\n- Nakuru Municipal Market: KSh 3,200\n- Retail: KSh 3,600");
  });

  it("leaves plain text and USSD codes alone", () => {
    expect(toPlainText("Dial *384*99# for prices.")).toBe("Dial *384*99# for prices.");
  });
});

describe("assertReplyIsTrustworthy", () => {
  const base = "Maize: KSh 3,200.\n\nDEMO DATA: Illustrative prices, not a verified live market quote.";

  it("accepts a rephrase that keeps the source numbers and the demo disclaimer", () => {
    expect(() =>
      assertReplyIsTrustworthy("Maize is KSh 3,200 a bag. DEMO DATA: Illustrative prices, not a verified live market quote.", base)
    ).not.toThrow();
  });

  it("rejects a number that was not in the source", () => {
    expect(() => assertReplyIsTrustworthy("Maize is KSh 3,200. Also KSh 99,999.", base)).toThrow(ReplyRejectedError);
  });

  it("rejects a dropped source number", () => {
    expect(() => assertReplyIsTrustworthy("Maize is available. DEMO DATA: Illustrative prices, not a verified live market quote.", base)).toThrow(
      /dropped numbers/
    );
  });

  it("rejects today, current, official, and an affirmative verified claim", () => {
    expect(() => assertReplyIsTrustworthy("The current official price today is KSh 3,200.", base)).toThrow(/unsupported claims/);
    expect(() => assertReplyIsTrustworthy("This is a verified price of KSh 3,200.", base)).toThrow(/unsupported claims/);
  });

  it("rejects a dosage the source did not state", () => {
    expect(() => assertReplyIsTrustworthy("Maize is KSh 3,200. Spray 5 ml.", base)).toThrow(ReplyRejectedError);
  });
});
