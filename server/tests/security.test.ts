import { describe, expect, it } from "vitest";
import { takeToken, type RateBucket } from "../src/api/security.js";

describe("takeToken", () => {
  it("allows requests up to the max and then blocks until the window resets", () => {
    const store = new Map<string, RateBucket>();
    expect(takeToken(store, "farmer", 2, 1000, 0)).toBe(true);
    expect(takeToken(store, "farmer", 2, 1000, 10)).toBe(true);
    expect(takeToken(store, "farmer", 2, 1000, 20)).toBe(false);
    expect(takeToken(store, "farmer", 2, 1000, 1000)).toBe(true);
  });

  it("keeps callers on separate counters", () => {
    const store = new Map<string, RateBucket>();
    expect(takeToken(store, "a", 1, 1000, 0)).toBe(true);
    expect(takeToken(store, "b", 1, 1000, 0)).toBe(true);
    expect(takeToken(store, "a", 1, 1000, 1)).toBe(false);
  });
});
