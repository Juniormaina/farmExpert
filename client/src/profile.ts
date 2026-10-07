import { COUNTIES, CROP_IDS, isCropId } from "../../server/src/shared/crops";
import type { CropId, Locale } from "./types";

const PROFILE_KEY = "farmexpert:profile";
const ONBOARD_KEY = "farmexpert:onboarded";

export interface FarmProfile {
  county: string;
  crop: CropId;
  farmSizeAcres: number;
  budgetKsh: number;
  locale: Locale;
}

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "sw";
}

export function parseFarmProfile(value: unknown): FarmProfile | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.county !== "string" || !COUNTIES.some((c) => c.value === record.county)) return undefined;
  if (!isCropId(record.crop)) return undefined;
  if (typeof record.farmSizeAcres !== "number" || !Number.isFinite(record.farmSizeAcres) || record.farmSizeAcres <= 0 || record.farmSizeAcres > 10_000) {
    return undefined;
  }
  if (typeof record.budgetKsh !== "number" || !Number.isFinite(record.budgetKsh) || record.budgetKsh < 0 || record.budgetKsh > 1_000_000_000) {
    return undefined;
  }
  if (!isLocale(record.locale)) return undefined;
  return {
    county: record.county,
    crop: record.crop,
    farmSizeAcres: record.farmSizeAcres,
    budgetKsh: record.budgetKsh,
    locale: record.locale
  };
}

export function loadFarmProfile(): FarmProfile | undefined {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return undefined;
    return parseFarmProfile(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export function saveFarmProfile(profile: FarmProfile): void {
  const parsed = parseFarmProfile(profile);
  if (!parsed) throw new Error("Invalid farm profile");
  localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
  localStorage.setItem(ONBOARD_KEY, "1");
}

export function clearFarmProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ONBOARD_KEY);
}

export function markOnboardingSkipped(): void {
  localStorage.setItem(ONBOARD_KEY, "1");
}

export function onboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARD_KEY) === "1" || loadFarmProfile() !== undefined;
  } catch {
    return true;
  }
}

export const PROFILE_CROP_IDS = CROP_IDS;
