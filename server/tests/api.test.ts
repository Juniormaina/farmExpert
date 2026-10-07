import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/api/app.js";

let app: Express;

beforeAll(() => {
  app = createApp();
});

describe("GET /", () => {
  it("points visitors to the web UI instead of a blank error", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("http://localhost:5173");
    expect(res.text).toContain("Farm Expert API");
  });
});

describe("production static + PWA serving", () => {
  it("serves the Vite index.html and keeps /api on the Express router", async () => {
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
    const clientDist = path.join(root, "client", "dist");
    const fs = await import("node:fs");
    if (!fs.existsSync(path.join(clientDist, "index.html"))) {
      // Build artifacts are required for this check; skip cleanly in CI without dist.
      return;
    }

    const spa = createApp({ serveClient: true, clientDistPath: clientDist });
    const home = await request(spa).get("/");
    expect(home.status).toBe(200);
    expect(home.text).toContain('id="root"');
    expect(home.text).not.toContain("Farm Expert API");
    expect(home.text).toMatch(/manifest\.webmanifest|registerSW\.js|vite-plugin-pwa/);

    const status = await request(spa).get("/api/status");
    expect(status.status).toBe(200);
    expect(status.body.activeProvider).toBeDefined();

    if (fs.existsSync(path.join(clientDist, "manifest.webmanifest"))) {
      const manifest = await request(spa).get("/manifest.webmanifest");
      expect(manifest.status).toBe(200);
      expect(manifest.text).toContain("Farm Expert");
    }
    if (fs.existsSync(path.join(clientDist, "sw.js"))) {
      const sw = await request(spa).get("/sw.js");
      expect(sw.status).toBe(200);
    }
  });
});

describe("GET /api/status", () => {
  it("reports deterministic as the active provider when no AI backend is reachable", async () => {
    const res = await request(app).get("/api/status");
    expect(res.status).toBe(200);
    expect(res.body.activeProvider).toBe("deterministic");
    expect(res.body.providers.some((p: { name: string }) => p.name === "deterministic")).toBe(true);
  });
});

describe("GET /api/markets", () => {
  it("returns demo maize prices filtered by county", async () => {
    const res = await request(app).get("/api/markets").query({ county: "Nakuru" });
    expect(res.status).toBe(200);
    expect(res.body.prices.length).toBeGreaterThan(0);
    expect(res.body.counties).toContain("Nakuru");
  });

  it("filters by crop", async () => {
    const res = await request(app).get("/api/markets").query({ crop: "tea" });
    expect(res.status).toBe(200);
    expect(res.body.prices.length).toBeGreaterThan(0);
    expect(res.body.prices.every((p: { crop: string }) => p.crop === "tea")).toBe(true);
  });

  it("rejects an unknown crop", async () => {
    const res = await request(app).get("/api/markets").query({ crop: "bananas" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/crops", () => {
  it("lists all six crops with their budget defaults", async () => {
    const res = await request(app).get("/api/crops");
    expect(res.body.crops.map((c: { id: string }) => c.id)).toEqual(["maize", "beans", "potatoes", "tomatoes", "tea", "kale"]);
    expect(res.body.crops[4]).toMatchObject({ id: "tea", defaultFertilizer: "NPK" });
  });
});

describe("GET /api/fertilizer", () => {
  it("returns demo fertilizer listings", async () => {
    const res = await request(app).get("/api/fertilizer").query({ type: "DAP", county: "Nakuru" });
    expect(res.status).toBe(200);
    expect(res.body.listings.length).toBeGreaterThan(0);
  });

  it("rejects an invalid fertilizer type", async () => {
    const res = await request(app).get("/api/fertilizer").query({ type: "NOTAFERTILIZER" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/budget", () => {
  it("computes Mary's demo budget", async () => {
    const res = await request(app)
      .post("/api/budget")
      .send({ county: "Nakuru", farmSizeAcres: 1, budgetKsh: 12000, fertilizerType: "DAP" });
    expect(res.status).toBe(200);
    expect(res.body.totalEstimatedCostKsh).toBeGreaterThan(0);
  });

  it("rejects a missing county", async () => {
    const res = await request(app)
      .post("/api/budget")
      .send({ farmSizeAcres: 1, budgetKsh: 12000, fertilizerType: "DAP" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid farm size", async () => {
    const res = await request(app)
      .post("/api/budget")
      .send({ county: "Nakuru", farmSizeAcres: -1, budgetKsh: 12000, fertilizerType: "DAP" });
    expect(res.status).toBe(400);
  });

  it("budgets for a chosen crop", async () => {
    const res = await request(app)
      .post("/api/budget")
      .send({ crop: "beans", county: "Nakuru", farmSizeAcres: 1, budgetKsh: 12000, fertilizerType: "DAP" });
    expect(res.status).toBe(200);
    expect(res.body.totalEstimatedCostKsh).toBe(16000);
  });

  it("rejects an unknown crop in a budget", async () => {
    const res = await request(app)
      .post("/api/budget")
      .send({ crop: "bananas", county: "Nakuru", farmSizeAcres: 1, budgetKsh: 12000, fertilizerType: "DAP" });
    expect(res.status).toBe(400);
  });

  it("applies edited assumptions", async () => {
    const res = await request(app).post("/api/budget").send({
      county: "Nakuru",
      farmSizeAcres: 1,
      budgetKsh: 12000,
      fertilizerType: "DAP",
      assumptions: { fertilizerBagsPerAcre: 1, includeLabor: false, includeLandPrep: false }
    });
    expect(res.status).toBe(200);
    expect(res.body.fertilizerBagsNeeded).toBe(1);
    expect(res.body.lineItems).toHaveLength(2);
  });

  it.each([
    [{ laborCostPerAcre: -500 }, "non-negative"],
    [{ includeSeed: "yes" }, "true or false"],
    [{ madeUpCost: 10 }, "not a recognised"],
    [[1, 2], "must be an object"]
  ])("rejects invalid assumptions %j", async (assumptions, message) => {
    const res = await request(app)
      .post("/api/budget")
      .send({ county: "Nakuru", farmSizeAcres: 1, budgetKsh: 12000, fertilizerType: "DAP", assumptions });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(message);
  });

  it("returns 404 when fertilizer is unavailable for the county", async () => {
    const res = await request(app)
      .post("/api/budget")
      .send({ county: "Mombasa", farmSizeAcres: 1, budgetKsh: 12000, fertilizerType: "DAP" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/chat", () => {
  it("answers the full mixed-language demo query consistently with the Web channel", async () => {
    const message =
      "Habari, nataka kupanda mahindi kwa ekari moja Nakuru. Bei ya mbolea ni ngapi, na mahindi yanauzwa bei gani sokoni? Nina budget ya shilingi 12,000. Naweza kupanga aje?";
    const res = await request(app).post("/api/chat").send({ message });
    expect(res.status).toBe(200);
    expect(res.body.locale).toBe("sw");
    expect(res.body.reply).toContain("jumla");
    expect(res.body.reply).not.toContain("wholesale");
    expect(res.body.data.marketPrices.length).toBeGreaterThan(0);
    expect(res.body.data.fertilizerListings.length).toBeGreaterThan(0);
    expect(res.body.data.budget).toBeDefined();
    expect(res.body.providerUsed).toBe("deterministic");
  });

  it("answers about tomatoes with tomato prices, not maize", async () => {
    const res = await request(app).post("/api/chat").send({ message: "Tomato prices in Eldoret?" });
    expect(res.body.intent).toBe("crop_price");
    expect(res.body.data.marketPrices.length).toBeGreaterThan(0);
    expect(res.body.data.marketPrices.every((p: { crop: string }) => p.crop === "tomatoes")).toBe(true);
    expect(res.body.reply).toContain("Tomatoes prices:");
    expect(res.body.reply).toContain("per 64kg crate");
  });

  it("plans a beans budget from a chat question, using DAP by default", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "How can I plan? I have KSh 20,000 for 1 acre of beans in Nakuru" });
    expect(res.body.data.budget.input).toMatchObject({ crop: "beans", fertilizerType: "DAP" });
    expect(res.body.data.budget.totalEstimatedCostKsh).toBe(16000);
  });

  it("rejects an empty message", async () => {
    const res = await request(app).post("/api/chat").send({ message: "" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/sms", () => {
  it("answers the same underlying query as the Web chat channel", async () => {
    const res = await request(app)
      .post("/api/sms")
      .send({ sessionId: "sms-test-1", text: "Bei ya mbolea Nakuru?" });
    expect(res.status).toBe(200);
    expect(res.body.agentText.length).toBeGreaterThan(0);
    expect(res.body.response.intent).toBe("fertilizer_price");
    expect(res.body.response.data.fertilizerListings.length).toBeGreaterThan(0);
  });

  it("keeps a running history per session", async () => {
    const sessionId = "sms-test-2";
    await request(app).post("/api/sms").send({ sessionId, text: "Bei ya mahindi Nakuru?" });
    await request(app).post("/api/sms").send({ sessionId, text: "Asante" });
    const history = await request(app).get(`/api/sms/${sessionId}/history`);
    expect(history.body.history.length).toBe(4);
  });
});

async function ussd(sessionId: string, inputs: string[], locale = "en") {
  await request(app).post("/api/ussd/start").send({ sessionId, locale });
  let last = { text: "", done: false };
  for (const input of inputs) {
    last = (await request(app).post(`/api/ussd/${sessionId}/input`).send({ input })).body;
  }
  return last;
}

describe("USSD flow", () => {
  it("navigates crop, then county, to maize prices", async () => {
    const start = await request(app).post("/api/ussd/start").send({ sessionId: "ussd-test-1", locale: "en" });
    expect(start.body.text).toContain("1. Crop prices");

    const crops = await request(app).post("/api/ussd/ussd-test-1/input").send({ input: "1" });
    expect(crops.body.text).toContain("Select crop");
    expect(crops.body.text).toContain("Tomatoes");

    const counties = await request(app).post("/api/ussd/ussd-test-1/input").send({ input: "1" });
    expect(counties.body.text).toContain("3. Kericho");

    const result = await request(app).post("/api/ussd/ussd-test-1/input").send({ input: "1" });
    expect(result.body.text).toContain("Maize prices - Nakuru");
    expect(result.body.text).toContain("KSh 3,200 / 90kg bag");
    expect(result.body.done).toBe(false);
  });

  it("shows tomato prices per crate", async () => {
    const result = await ussd("ussd-test-tomato", ["1", "4", "2"]);
    expect(result.text).toContain("Tomatoes prices - Eldoret");
    expect(result.text).toContain("KSh 5,000 / 64kg crate");
  });

  it("says so when a crop has no prices in a county", async () => {
    const result = await ussd("ussd-test-empty", ["1", "5", "1"]);
    expect(result.text).toContain("No prices for this crop here yet");
  });

  it("supports going back and exiting", async () => {
    const back = await ussd("ussd-test-2", ["1", "0"]);
    expect(back.text).toContain("WELCOME");
    const exit = await ussd("ussd-test-2b", ["5"]);
    expect(exit.done).toBe(true);
  });

  it("completes the full maize budget flow", async () => {
    const result = await ussd("ussd-test-3", ["3", "1", "1", "1", "12000", "1"]);
    expect(result.text).toContain("Budget Plan: Maize");
    expect(result.text).toContain("Total: KSh 20,000");
    expect(result.text).toContain("Shortfall: KSh 8,000");
  });

  it("plans a tea budget in Kericho and suggests NPK", async () => {
    const fertMenu = await ussd("ussd-test-tea", ["3", "5", "3", "1", "40000"]);
    expect(fertMenu.text).toContain("Usual for Tea: NPK");
    const result = (await request(app).post("/api/ussd/ussd-test-tea/input").send({ input: "2" })).body;
    expect(result.text).toContain("Total: KSh 37,800");
    expect(result.text).toContain("Remaining: KSh 2,200");
  });

  it("works in Kiswahili", async () => {
    const result = await ussd("ussd-test-sw", ["1", "2", "1"], "sw");
    expect(result.text).toContain("Bei za maharagwe - Nakuru");
  });
});
