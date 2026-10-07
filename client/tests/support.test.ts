import { describe, expect, it } from "vitest";
import { supportPresentation } from "../src/support";

describe("support contact", () => {
  it("stays empty until a real contact is configured", () => {
    expect(supportPresentation(undefined)).toEqual({ kind: "missing" });
    expect(supportPresentation("  ")).toEqual({ kind: "missing" });
  });

  it("links an email or a phone number and leaves other wording as text", () => {
    expect(supportPresentation("help@farm.example")).toEqual({
      kind: "link",
      href: "mailto:help@farm.example",
      label: "help@farm.example"
    });
    expect(supportPresentation("+254700000000")).toEqual({
      kind: "link",
      href: "tel:+254700000000",
      label: "+254700000000"
    });
    expect(supportPresentation("Ask the facilitator at the Nakuru office")).toEqual({
      kind: "text",
      label: "Ask the facilitator at the Nakuru office"
    });
  });
});