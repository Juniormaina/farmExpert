import { beforeEach, describe, expect, it } from "vitest";
import { clearFarmProfile, loadFarmProfile, onboardingComplete, parseFarmProfile, saveFarmProfile } from "../src/profile";

describe("farm profile", () => {
  beforeEach(() => localStorage.clear());

  it("saves and reloads a farm without a name", () => {
    saveFarmProfile({ county: "Kericho", crop: "tea", farmSizeAcres: 2, budgetKsh: 40000, locale: "sw" });
    expect(loadFarmProfile()).toEqual({ county: "Kericho", crop: "tea", farmSizeAcres: 2, budgetKsh: 40000, locale: "sw" });
    expect(onboardingComplete()).toBe(true);
  });

  it("rejects an unknown county and a non-positive farm size", () => {
    expect(parseFarmProfile({ county: "Nairobi", crop: "maize", farmSizeAcres: 1, budgetKsh: 1000, locale: "en" })).toBeUndefined();
    expect(parseFarmProfile({ county: "Nakuru", crop: "maize", farmSizeAcres: 0, budgetKsh: 1000, locale: "en" })).toBeUndefined();
  });

  it("deletes the profile from this browser", () => {
    saveFarmProfile({ county: "Nakuru", crop: "maize", farmSizeAcres: 1, budgetKsh: 12000, locale: "en" });
    clearFarmProfile();
    expect(loadFarmProfile()).toBeUndefined();
    expect(onboardingComplete()).toBe(false);
  });
});
