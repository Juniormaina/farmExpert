import { getCrop } from "./crops.js";
import type { CropId, Locale, MarketPrice } from "./types.js";

export function formatKsh(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString("en-US")}`;
}

export function cropName(crop: CropId, locale: Locale): string {
  return getCrop(crop).name[locale];
}

// Short form for cards, key points and USSD: "KSh 3,200 / 90kg bag", "KSh 24 / kg".
export function formatUnitPrice(p: MarketPrice, locale: Locale): string {
  if (p.unit === "kg") return `${formatKsh(p.pricePerUnit)} / ${locale === "sw" ? "kilo" : "kg"}`;
  if (locale === "sw") {
    return p.unit === "bag" ? `${formatKsh(p.pricePerUnit)} / gunia la ${p.unitKg}kg` : `${formatKsh(p.pricePerUnit)} / kreti ya ${p.unitKg}kg`;
  }
  return `${formatKsh(p.pricePerUnit)} / ${p.unitKg}kg ${p.unit}`;
}

// Sentence form for chat and SMS replies.
export function formatUnitPriceLong(p: MarketPrice, locale: Locale): string {
  if (locale === "sw") {
    if (p.unit === "kg") return `${formatKsh(p.pricePerUnit)} kwa kilo`;
    return p.unit === "bag"
      ? `${formatKsh(p.pricePerUnit)} kwa gunia la ${p.unitKg}kg`
      : `${formatKsh(p.pricePerUnit)} kwa kreti ya ${p.unitKg}kg`;
  }
  if (p.unit === "kg") return `${formatKsh(p.pricePerUnit)} per kg`;
  return `${formatKsh(p.pricePerUnit)} per ${p.unitKg}kg ${p.unit}`;
}
