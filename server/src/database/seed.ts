import { db, initSchema } from "./connection.js";
import { sampleListings, samplePrices } from "../data/sampleData.js";

export function resetDemoData(): void {
  initSchema();

  db.exec("DELETE FROM market_prices; DELETE FROM fertilizer_listings; DELETE FROM request_queue;");

  const insertMarket = db.prepare(`
    INSERT INTO market_prices (market, county, crop, price_per_unit, unit, unit_kg, classification, source, last_updated, freshness)
    VALUES (@market, @county, @crop, @pricePerUnit, @unit, @unitKg, @classification, @source, @lastUpdated, @freshness)
  `);
  const insertFertilizer = db.prepare(`
    INSERT INTO fertilizer_listings (type, package_size_kg, price_per_bag, supplier, county, availability, source, last_updated, freshness)
    VALUES (@type, @packageSizeKg, @pricePerBag, @supplier, @county, @availability, @source, @lastUpdated, @freshness)
  `);

  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    for (const m of samplePrices(now)) {
      const { market, county, crop, pricePerUnit, unit, unitKg, classification, source, lastUpdated, freshness } = m;
      insertMarket.run({ market, county, crop, pricePerUnit, unit, unitKg, classification, source, lastUpdated, freshness });
    }
    for (const f of sampleListings(now)) {
      const { type, packageSizeKg, pricePerBag, supplier, county, availability, source, lastUpdated, freshness } = f;
      insertFertilizer.run({ type, packageSizeKg, pricePerBag, supplier, county, availability, source, lastUpdated, freshness });
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

const isMainModule = process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");
if (isMainModule) {
  resetDemoData();
  // eslint-disable-next-line no-console
  console.log("Seeded SmartShambaAI demo database.");
}
