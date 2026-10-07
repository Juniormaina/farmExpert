import { describe, expect, it } from "vitest";
import { HttpError } from "../src/api/client";
import { userFacingError } from "../src/errors";

const fallback = "We couldn't reach the Farm Expert service.";

describe("user facing errors", () => {
  it("keeps a validation message from the server", () => {
    const err = new HttpError("Enter a farm size above 0.", 400);
    expect(userFacingError(err, fallback)).toBe("Enter a farm size above 0.");
  });

  it("shows a server reference and hides other failures", () => {
    expect(userFacingError(new HttpError("Something went wrong. Reference: FE-AB12CD", 500), fallback)).toBe(
      "Something went wrong. Reference: FE-AB12CD"
    );
  });

  it("hides a network failure behind the farmer-facing sentence", () => {
    expect(userFacingError(new TypeError("Failed to fetch"), fallback)).toBe(fallback);
    expect(userFacingError(new HttpError("Request failed with 503", 503), fallback)).toBe(fallback);
  });
});
