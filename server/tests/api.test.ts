import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/api/app.js";

let app: Express;

beforeAll(() => {
  app = createApp();
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
    expect(res.body.data.marketPrices.length).toBeGreaterThan(0);
    expect(res.body.data.fertilizerListings.length).toBeGreaterThan(0);
    expect(res.body.data.budget).toBeDefined();
    expect(res.body.providerUsed).toBe("deterministic");
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

describe("USSD flow", () => {
  it("navigates the maize price menu end to end", async () => {
    const sessionId = "ussd-test-1";
    const start = await request(app).post("/api/ussd/start").send({ sessionId, locale: "en" });
    expect(start.body.text).toContain("WELCOME");

    const menu = await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "1" });
    expect(menu.body.text).toContain("Select county");

    const result = await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "1" });
    expect(result.body.text).toContain("Nakuru");
    expect(result.body.done).toBe(false);
  });

  it("supports going back and exiting", async () => {
    const sessionId = "ussd-test-2";
    await request(app).post("/api/ussd/start").send({ sessionId, locale: "en" });
    const toMaize = await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "1" });
    expect(toMaize.body.text).toContain("Select county");

    const back = await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "0" });
    expect(back.body.text).toContain("WELCOME");

    const exit = await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "5" });
    expect(exit.body.done).toBe(true);
  });

  it("completes the full budget planning flow", async () => {
    const sessionId = "ussd-test-3";
    await request(app).post("/api/ussd/start").send({ sessionId, locale: "en" });
    await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "3" }); // budget
    await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "1" }); // Nakuru
    await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "1" }); // 1 acre
    await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "12000" }); // budget
    const result = await request(app).post(`/api/ussd/${sessionId}/input`).send({ input: "1" }); // DAP
    expect(result.body.text).toContain("Budget Plan");
    expect(result.body.text).toContain("Total");
  });
});
