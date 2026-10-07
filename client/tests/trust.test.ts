import { describe, expect, it } from "vitest";
import { trustLine } from "../src/trust";

describe("trustLine", () => {
  it("does not present a demo timestamp as a market collection date", () => {
    const line = trustLine(
      { source: "Farm Expert Demo Dataset", lastUpdated: "2026-10-07T08:00:00.000Z", freshness: "illustrative", isDemoData: true },
      "en"
    );
    expect(line).toContain("No market collection date");
    expect(line).toContain("Farm Expert Demo Dataset");
    expect(line).not.toContain("2026-10-07");
  });

  it("shows the source date when a record is verified and not demo data", () => {
    const line = trustLine(
      { source: "County market sheet", lastUpdated: "2026-03-01T00:00:00.000Z", freshness: "verified", isDemoData: false },
      "en"
    );
    expect(line).toContain("County market sheet");
    expect(line).toContain("2026-03-01");
  });
});
