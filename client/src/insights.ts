import type { AgentResponse, FertilizerListing, Locale, MarketPrice } from "./types";

export interface KeyPoint {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone: "good" | "bad" | "neutral";
}

export function formatKsh(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString("en-US")}`;
}

export function highestMaizePrice(prices: MarketPrice[]): MarketPrice | undefined {
  return prices.reduce<MarketPrice | undefined>((best, p) => (!best || p.pricePerBag > best.pricePerBag ? p : best), undefined);
}

// Out-of-stock listings are no use to a farmer today, however cheap.
export function cheapestAvailable(listings: FertilizerListing[]): FertilizerListing | undefined {
  return listings
    .filter((l) => l.availability !== "out_of_stock")
    .reduce<FertilizerListing | undefined>((best, l) => (!best || l.pricePerBag < best.pricePerBag ? l : best), undefined);
}

const LABELS: Record<Locale, Record<string, string>> = {
  en: {
    highestMaize: "Highest maize price",
    cheapestFertilizer: "Cheapest fertilizer in stock",
    totalCost: "Estimated cost",
    shortBy: "Budget short by",
    leftOver: "Left in budget"
  },
  sw: {
    highestMaize: "Bei ya juu ya mahindi",
    cheapestFertilizer: "Mbolea rahisi zaidi iliyopo",
    totalCost: "Gharama inayokadiriwa",
    shortBy: "Bajeti haitoshi kwa",
    leftOver: "Kilichobaki kwenye bajeti"
  }
};

// Built from the structured data, never from the AI's wording, so the
// highlighted figures are always the ones the services calculated.
export function keyPointsFor(data: AgentResponse["data"], locale: Locale): KeyPoint[] {
  const l = LABELS[locale];
  const points: KeyPoint[] = [];

  const topMaize = data?.marketPrices && data.marketPrices.length > 1 ? highestMaizePrice(data.marketPrices) : undefined;
  if (topMaize) {
    points.push({
      id: "maize",
      label: l.highestMaize,
      value: `${formatKsh(topMaize.pricePerBag)} / ${topMaize.bagSizeKg}kg`,
      detail: topMaize.market,
      tone: "neutral"
    });
  }

  const fertilizer = data?.fertilizerListings ? cheapestAvailable(data.fertilizerListings) : undefined;
  if (fertilizer) {
    points.push({
      id: "fertilizer",
      label: l.cheapestFertilizer,
      value: `${fertilizer.type} ${formatKsh(fertilizer.pricePerBag)}`,
      detail: fertilizer.supplier.replace(/\s*\(fictional demo supplier\)/, ""),
      tone: "neutral"
    });
  }

  const budget = data?.budget;
  if (budget) {
    points.push({ id: "cost", label: l.totalCost, value: formatKsh(budget.totalEstimatedCostKsh), tone: "neutral" });
    points.push(
      budget.isShortfall
        ? { id: "gap", label: l.shortBy, value: formatKsh(Math.abs(budget.remainingBudgetKsh)), tone: "bad" }
        : { id: "gap", label: l.leftOver, value: formatKsh(budget.remainingBudgetKsh), tone: "good" }
    );
  }

  return points;
}

export interface TextPart {
  text: string;
  money: boolean;
}

export function splitMoney(text: string): TextPart[] {
  return text
    .split(/(KSh\s?[\d,]+(?:\.\d+)?)/g)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, money: /^KSh\s?[\d,]/.test(part) }));
}
