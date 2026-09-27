import { db } from "../database/connection.js";
import type { MarketPrice } from "../shared/types.js";

interface MarketRow {
  market: string;
  county: string;
  crop: string;
  price_per_bag: number;
  bag_size_kg: number;
  classification: string;
  source: string;
  last_updated: string;
  freshness: string;
}

function rowToMarketPrice(row: MarketRow): MarketPrice {
  return {
    market: row.market,
    county: row.county,
    crop: "maize",
    pricePerBag: row.price_per_bag,
    bagSizeKg: row.bag_size_kg,
    classification: row.classification as MarketPrice["classification"],
    source: row.source,
    lastUpdated: row.last_updated,
    freshness: row.freshness as MarketPrice["freshness"],
    isDemoData: true
  };
}

export function getMaizePrices(filter: { county?: string; market?: string } = {}): MarketPrice[] {
  let query = "SELECT * FROM market_prices WHERE crop = 'maize'";
  const params: string[] = [];

  if (filter.county) {
    query += " AND county LIKE ?";
    params.push(`%${filter.county}%`);
  }
  if (filter.market) {
    query += " AND market LIKE ?";
    params.push(`%${filter.market}%`);
  }
  query += " ORDER BY county, market";

  const rows = db.prepare(query).all(...params) as unknown as MarketRow[];
  return rows.map(rowToMarketPrice);
}

export function listCounties(): string[] {
  const rows = db.prepare("SELECT DISTINCT county FROM market_prices ORDER BY county").all() as { county: string }[];
  return rows.map((r) => r.county);
}
