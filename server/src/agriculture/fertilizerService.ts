import { db } from "../database/connection.js";
import type { FertilizerListing, FertilizerType } from "../shared/types.js";

interface FertilizerRow {
  type: string;
  package_size_kg: number;
  price_per_bag: number;
  supplier: string;
  county: string;
  availability: string;
  source: string;
  last_updated: string;
  freshness: string;
}

function rowToListing(row: FertilizerRow): FertilizerListing {
  return {
    type: row.type as FertilizerType,
    packageSizeKg: row.package_size_kg,
    pricePerBag: row.price_per_bag,
    supplier: row.supplier,
    county: row.county,
    availability: row.availability as FertilizerListing["availability"],
    source: row.source,
    lastUpdated: row.last_updated,
    freshness: row.freshness as FertilizerListing["freshness"],
    isDemoData: true,
    isFictionalSupplier: true
  };
}

export const FERTILIZER_TYPES: FertilizerType[] = ["DAP", "NPK", "UREA", "CAN"];

export function getFertilizerListings(filter: { type?: FertilizerType; county?: string } = {}): FertilizerListing[] {
  let query = "SELECT * FROM fertilizer_listings WHERE 1=1";
  const params: string[] = [];

  if (filter.type) {
    query += " AND type = ?";
    params.push(filter.type);
  }
  if (filter.county) {
    query += " AND county LIKE ?";
    params.push(`%${filter.county}%`);
  }
  query += " ORDER BY county, type";

  const rows = db.prepare(query).all(...params) as unknown as FertilizerRow[];
  return rows.map(rowToListing);
}

export function getCheapestListing(type: FertilizerType, county?: string): FertilizerListing | undefined {
  const listings = getFertilizerListings({ type, county });
  if (listings.length === 0) return undefined;
  return listings.slice().sort((a, b) => a.pricePerBag - b.pricePerBag)[0];
}
