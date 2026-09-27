import { db } from "../database/connection.js";
import type { CropId, MarketPrice } from "../shared/types.js";

interface MarketRow {
  market: string;
  county: string;
  crop: string;
  price_per_unit: number;
  unit: string;
  unit_kg: number;
  classification: string;
  source: string;
  last_updated: string;
  freshness: string;
}

function rowToMarketPrice(row: MarketRow): MarketPrice {
  return {
    market: row.market,
    county: row.county,
    crop: row.crop as CropId,
    pricePerUnit: row.price_per_unit,
    unit: row.unit as MarketPrice["unit"],
    unitKg: row.unit_kg,
    classification: row.classification as MarketPrice["classification"],
    source: row.source,
    lastUpdated: row.last_updated,
    freshness: row.freshness as MarketPrice["freshness"],
    isDemoData: true
  };
}

export function getCropPrices(filter: { crop?: CropId; county?: string; market?: string } = {}): MarketPrice[] {
  let query = "SELECT * FROM market_prices WHERE 1=1";
  const params: string[] = [];

  if (filter.crop) {
    query += " AND crop = ?";
    params.push(filter.crop);
  }
  if (filter.county) {
    query += " AND county LIKE ?";
    params.push(`%${filter.county}%`);
  }
  if (filter.market) {
    query += " AND market LIKE ?";
    params.push(`%${filter.market}%`);
  }
  query += " ORDER BY county, crop, market";

  const rows = db.prepare(query).all(...params) as unknown as MarketRow[];
  return rows.map(rowToMarketPrice);
}

export function listCounties(): string[] {
  const rows = db.prepare("SELECT DISTINCT county FROM market_prices ORDER BY county").all() as { county: string }[];
  return rows.map((r) => r.county);
}
