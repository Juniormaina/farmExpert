import { describe, expect, it } from "vitest";
import { toPlainText } from "../src/providers/replyCheck.js";

describe("toPlainText", () => {
  it("removes markdown that phones and the chat would show as symbols", () => {
    const reply = "## Prices\n- **Nakuru Municipal Market**: KSh 3,200\n- __Retail__: `KSh 3,600`";
    expect(toPlainText(reply)).toBe("Prices\n- Nakuru Municipal Market: KSh 3,200\n- Retail: KSh 3,600");
  });

  it("leaves plain text and USSD codes alone", () => {
    expect(toPlainText("Dial *384*99# for prices.")).toBe("Dial *384*99# for prices.");
  });
});
