import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/api/app.js";
import { db } from "../src/database/connection.js";

const app = createApp();

async function withEnv(name: "SMS_WEBHOOK_TOKEN" | "USSD_WEBHOOK_TOKEN", value: string | undefined, run: () => Promise<void>) {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try {
    await run();
  } finally {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
}

describe("production safeguards", () => {
  afterEach(() => {
    delete process.env.SMS_WEBHOOK_TOKEN;
    delete process.env.USSD_WEBHOOK_TOKEN;
  });

  it("reports demo data mode on the health check and sets security headers", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, dataMode: "demo" });
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["content-security-policy"]).toContain("script-src 'self'");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("rejects an oversized chat message", async () => {
    const res = await request(app).post("/api/chat").send({ message: "a".repeat(801) });
    expect(res.status).toBe(400);
  });

  it("stores helpful feedback without personal fields and drops comments older than 90 days", async () => {
    db.prepare("INSERT INTO feedback (rating, comment, context, created_at) VALUES (?, ?, ?, ?)").run(
      "helpful",
      "old",
      "web",
      "2020-01-01T00:00:00.000Z"
    );
    const res = await request(app).post("/api/feedback").send({ rating: "helpful", context: "prices" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    const old = db.prepare("SELECT COUNT(*) AS count FROM feedback WHERE created_at < '2021-01-01'").get() as { count: number };
    expect(old.count).toBe(0);
    const latest = db.prepare("SELECT rating, comment, context FROM feedback ORDER BY id DESC LIMIT 1").get() as {
      rating: string;
      comment: string | null;
      context: string | null;
    };
    expect(latest).toEqual({ rating: "helpful", comment: null, context: "prices" });
  });

  it("rejects feedback that includes a phone number field or a long comment", async () => {
    const phone = await request(app).post("/api/feedback").send({ rating: "not_helpful", phone: "0712345678" });
    expect(phone.status).toBe(400);
    const long = await request(app).post("/api/feedback").send({ rating: "not_helpful", comment: "x".repeat(281), context: "web" });
    expect(long.status).toBe(400);
  });

  it("keeps the SMS provider webhook closed until a token is configured", async () => {
    await withEnv("SMS_WEBHOOK_TOKEN", undefined, async () => {
      const res = await request(app).post("/api/providers/sms").send({ sessionId: "gw-1", text: "Bei ya mahindi Nakuru?" });
      expect(res.status).toBe(503);
      expect(res.body.configured).toBe(false);
    });
  });

  it("accepts an SMS provider message with the token and refuses a phone number", async () => {
    await withEnv("SMS_WEBHOOK_TOKEN", "test-sms-token", async () => {
      const denied = await request(app)
        .post("/api/providers/sms")
        .set("x-farmexpert-token", "wrong")
        .send({ sessionId: "gw-2", text: "Bei ya mahindi Nakuru?" });
      expect(denied.status).toBe(401);

      const phone = await request(app)
        .post("/api/providers/sms")
        .set("x-farmexpert-token", "test-sms-token")
        .send({ sessionId: "gw-3", text: "Bei ya mahindi Nakuru?", from: "0712345678" });
      expect(phone.status).toBe(400);

      const ok = await request(app)
        .post("/api/providers/sms")
        .set("x-farmexpert-token", "test-sms-token")
        .send({ sessionId: "gw-4", text: "Bei ya mahindi Nakuru?" });
      expect(ok.status).toBe(200);
      expect(ok.body.agentText).toBeTruthy();
    });
  });

  it("keeps the USSD provider webhook closed until a token is configured, then starts a session", async () => {
    await withEnv("USSD_WEBHOOK_TOKEN", undefined, async () => {
      const closed = await request(app).post("/api/providers/ussd").send({ sessionId: "gw-ussd" });
      expect(closed.status).toBe(503);
    });
    await withEnv("USSD_WEBHOOK_TOKEN", "test-ussd-token", async () => {
      const started = await request(app)
        .post("/api/providers/ussd")
        .set("x-farmexpert-token", "test-ussd-token")
        .send({ sessionId: "gw-ussd", locale: "sw" });
      expect(started.status).toBe(200);
      expect(started.body.text).toContain("Panga bajeti");
    });
  });
});

describe("farmer journeys over the API", () => {
  it("returns fertilizer options that are labelled as demo data", async () => {
    const res = await request(app).get("/api/fertilizer").query({ county: "Nakuru" });
    expect(res.status).toBe(200);
    expect(res.body.listings.length).toBeGreaterThan(0);
    expect(res.body.listings.every((listing: { isDemoData: boolean; freshness: string }) => listing.isDemoData && listing.freshness === "illustrative")).toBe(true);
  });

  it("shows a shortfall for a 1 acre maize plan on KSh 12,000", async () => {
    const res = await request(app).post("/api/budget").send({
      county: "Nakuru",
      crop: "maize",
      farmSizeAcres: 1,
      budgetKsh: 12000,
      fertilizerType: "DAP"
    });
    expect(res.status).toBe(200);
    expect(res.body.isShortfall).toBe(true);
    expect(res.body.totalEstimatedCostKsh).toBeGreaterThan(12000);
    expect(res.body.disclaimer).toBeTruthy();
  });

  it("answers an English price question and a Kiswahili price question from the same data", async () => {
    const english = await request(app).post("/api/chat").send({ message: "What is the maize price in Nakuru?", locale: "en" });
    expect(english.status).toBe(200);
    expect(english.body.intent).toBe("crop_price");
    expect(english.body.reply).toMatch(/DEMO DATA/i);

    const swahili = await request(app).post("/api/chat").send({ message: "Bei ya mahindi Nakuru ni ngapi?", locale: "sw" });
    expect(swahili.status).toBe(200);
    expect(swahili.body.reply).toMatch(/TAARIFA YA MFANO/i);
    expect(swahili.body.reply).not.toMatch(/wholesale/i);
  });

  it("refuses a disease question instead of quoting a price", async () => {
    const res = await request(app).post("/api/chat").send({ message: "My maize has blight" });
    expect(res.status).toBe(200);
    expect(res.body.intent).toBe("agricultural_distress");
    expect(res.body.reply).toMatch(/extension officer/i);
    expect(res.body.reply).not.toMatch(/KSh/);
  });

  it("does not turn a dying crop into prices on the SMS simulator", async () => {
    const res = await request(app).post("/api/sms").send({ sessionId: "journey-distress", text: "My maize is dying" });
    expect(res.status).toBe(200);
    expect(res.body.response.intent).toBe("agricultural_distress");
    expect(res.body.agentText).toMatch(/extension officer/i);
    expect(res.body.agentText).not.toMatch(/KSh/);
  });

  it("answers a supported SMS question in the simulator", async () => {
    const res = await request(app).post("/api/sms").send({ sessionId: "journey-sms", text: "Bei ya mahindi Nakuru?" });
    expect(res.status).toBe(200);
    expect(res.body.agentText).toMatch(/TAARIFA YA MFANO|DEMO DATA/i);
  });

  it("walks the USSD fertilizer menu in the simulator", async () => {
    const start = await request(app).post("/api/ussd/start").send({ sessionId: "journey-ussd", locale: "en" });
    expect(start.status).toBe(200);
    expect(start.body.text).toContain("Fertilizer price");
    const types = await request(app).post("/api/ussd/journey-ussd/input").send({ input: "2" });
    expect(types.status).toBe(200);
    expect(types.body.text).toContain("DAP");
    expect(types.body.done).toBe(false);
  });
});
