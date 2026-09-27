import { db, initSchema } from "./connection.js";
import { SAMPLE_FERTILIZER_LISTINGS, SAMPLE_MARKET_PRICES } from "../data/sampleData.js";

export function resetDemoData(): void {
  initSchema();

  db.exec("DELETE FROM market_prices; DELETE FROM fertilizer_listings; DELETE FROM request_queue;");

  const insertMarket = db.prepare(`
    INSERT INTO market_prices (market, county, crop, price_per_bag, bag_size_kg, classification, source, last_updated, freshness)
    VALUES (@market, @county, @crop, @pricePerBag, @bagSizeKg, @classification, @source, @lastUpdated, @freshness)
  `);
  const insertFertilizer = db.prepare(`
    INSERT INTO fertilizer_listings (type, package_size_kg, price_per_bag, supplier, county, availability, source, last_updated, freshness)
    VALUES (@type, @packageSizeKg, @pricePerBag, @supplier, @county, @availability, @source, @lastUpdated, @freshness)
  `);

  db.exec("BEGIN");
  try {
    for (const m of SAMPLE_MARKET_PRICES) insertMarket.run(m as unknown as Record<string, string | number>);
    for (const f of SAMPLE_FERTILIZER_LISTINGS) insertFertilizer.run(f as unknown as Record<string, string | number>);
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
  console.log("Seeded ShambaAI demo database.");
}
