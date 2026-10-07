import { Router } from "express";
import type { FertilizerType, Locale } from "../shared/types.js";
import { handleWebMessage } from "../channels/webChannel.js";
import { handleSmsMessage, getSmsHistory, resetSmsHistory } from "../channels/smsChannel.js";
import { startUssdSession, stepUssdSession } from "../channels/ussdChannel.js";
import { getCropPrices, listCounties } from "../agriculture/marketService.js";
import { CROPS, CROP_IDS, isCropId } from "../shared/crops.js";
import { getFertilizerListings, FERTILIZER_TYPES } from "../agriculture/fertilizerService.js";
import { calculateBudget, FertilizerUnavailableError } from "../agriculture/budgetCalculator.js";
import { getSystemStatus } from "../providers/providerManager.js";
import { resetDemoData } from "../database/seed.js";
import { DEMO_FARMER_PROFILE } from "../data/sampleData.js";
import { enqueueRequest, listPendingRequests, processQueue } from "../offline/requestQueue.js";
import { containsPhoneField, demoResetAllowed, limitWrites, MAX_MESSAGE_CHARS, providerGate } from "./security.js";
import { saveFeedback } from "../feedback/store.js";

export const router = Router();

const limit = limitWrites();

const FEEDBACK_CONTEXTS = new Set(["web", "sms", "ussd", "budget", "fertilizer", "prices"]);

function isValidLocale(value: unknown): value is Locale {
  return value === "en" || value === "sw";
}

function isValidFertilizerType(value: unknown): value is FertilizerType {
  return typeof value === "string" && FERTILIZER_TYPES.includes(value as FertilizerType);
}

router.get("/status", async (_req, res) => {
  const status = await getSystemStatus();
  res.json(status);
});

router.get("/demo/profile", (_req, res) => {
  res.json(DEMO_FARMER_PROFILE);
});

router.post("/demo/reset", limit, (req, res) => {
  if (!demoResetAllowed(req.get("x-farmexpert-token"))) {
    return res.status(404).json({ error: "Not found." });
  }
  resetDemoData();
  resetSmsHistory();
  res.json({ ok: true, message: "Demo data reset." });
});

router.get("/crops", (_req, res) => {
  res.json({ crops: CROPS.map(({ id, name, defaultFertilizer, budgetDefaults }) => ({ id, name, defaultFertilizer, budgetDefaults })) });
});

router.get("/markets", (req, res) => {
  const county = typeof req.query.county === "string" ? req.query.county : undefined;
  const crop = req.query.crop;
  if (crop !== undefined && !isCropId(crop)) {
    return res.status(400).json({ error: `Invalid crop. Must be one of ${CROP_IDS.join(", ")}` });
  }
  res.json({ counties: listCounties(), prices: getCropPrices({ crop, county }) });
});

router.get("/fertilizer", (req, res) => {
  const county = typeof req.query.county === "string" ? req.query.county : undefined;
  const typeParam = req.query.type;
  if (typeParam !== undefined && !isValidFertilizerType(typeParam)) {
    return res.status(400).json({ error: `Invalid fertilizer type. Must be one of ${FERTILIZER_TYPES.join(", ")}` });
  }
  res.json({ types: FERTILIZER_TYPES, listings: getFertilizerListings({ type: typeParam, county }) });
});

const NUMERIC_ASSUMPTIONS = ["fertilizerBagsPerAcre", "seedCostPerAcre", "laborCostPerAcre", "landPrepCostPerAcre"];
const BOOLEAN_ASSUMPTIONS = ["includeSeed", "includeLabor", "includeLandPrep"];

function assumptionsError(assumptions: unknown): string | undefined {
  if (assumptions === undefined) return undefined;
  if (typeof assumptions !== "object" || assumptions === null || Array.isArray(assumptions)) {
    return "assumptions must be an object";
  }
  for (const [key, value] of Object.entries(assumptions)) {
    if (NUMERIC_ASSUMPTIONS.includes(key)) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        return `assumptions.${key} must be a non-negative number`;
      }
    } else if (BOOLEAN_ASSUMPTIONS.includes(key)) {
      if (typeof value !== "boolean") return `assumptions.${key} must be true or false`;
    } else {
      return `assumptions.${key} is not a recognised assumption`;
    }
  }
  return undefined;
}

router.post("/budget", (req, res) => {
  const { county, farmSizeAcres, budgetKsh, fertilizerType, assumptions, locale, crop = "maize" } = req.body ?? {};
  if (!isCropId(crop)) {
    return res.status(400).json({ error: `crop must be one of ${CROP_IDS.join(", ")}` });
  }
  const invalidAssumptions = assumptionsError(assumptions);
  if (invalidAssumptions) {
    return res.status(400).json({ error: invalidAssumptions });
  }

  if (typeof county !== "string" || county.trim() === "") {
    return res.status(400).json({ error: "county is required" });
  }
  if (typeof farmSizeAcres !== "number" || farmSizeAcres <= 0) {
    return res.status(400).json({ error: "farmSizeAcres must be a positive number" });
  }
  if (typeof budgetKsh !== "number" || budgetKsh < 0) {
    return res.status(400).json({ error: "budgetKsh must be a non-negative number" });
  }
  if (!isValidFertilizerType(fertilizerType)) {
    return res.status(400).json({ error: `fertilizerType must be one of ${FERTILIZER_TYPES.join(", ")}` });
  }
  const effectiveLocale: Locale = isValidLocale(locale) ? locale : "en";

  try {
    const result = calculateBudget(
      { county, crop, farmSizeAcres, budgetKsh, fertilizerType, assumptions },
      effectiveLocale
    );
    res.json(result);
  } catch (err) {
    if (err instanceof FertilizerUnavailableError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof RangeError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

router.post("/chat", limit, async (req, res) => {
  const { message, locale } = req.body ?? {};
  if (typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "message is required" });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: `message must be ${MAX_MESSAGE_CHARS} characters or fewer` });
  }
  const effectiveLocale = isValidLocale(locale) ? locale : undefined;

  try {
    const response = await handleWebMessage({ message, locale: effectiveLocale });
    res.json(response);
  } catch (err) {
    enqueueRequest({ message, locale: effectiveLocale, channel: "web" });
    throw err;
  }
});

router.post("/sms", limit, async (req, res) => {
  const { sessionId, text, locale } = req.body ?? {};
  if (typeof sessionId !== "string" || sessionId.trim() === "" || sessionId.length > 80) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  if (typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({ error: "text is required" });
  }
  if (text.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: `text must be ${MAX_MESSAGE_CHARS} characters or fewer` });
  }
  const effectiveLocale = isValidLocale(locale) ? locale : undefined;
  const result = await handleSmsMessage(sessionId, text, effectiveLocale);
  res.json(result);
});

router.get("/sms/:sessionId/history", (req, res) => {
  res.json({ history: getSmsHistory(req.params.sessionId) });
});

router.post("/sms/:sessionId/reset", (req, res) => {
  resetSmsHistory(req.params.sessionId);
  res.json({ ok: true });
});

router.post("/ussd/start", limit, (req, res) => {
  const { sessionId, locale } = req.body ?? {};
  if (typeof sessionId !== "string" || sessionId.trim() === "" || sessionId.length > 80) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  const effectiveLocale = isValidLocale(locale) ? locale : "en";
  const result = startUssdSession(sessionId, effectiveLocale);
  res.json(result);
});

router.post("/ussd/:sessionId/input", limit, (req, res) => {
  const { input } = req.body ?? {};
  if (typeof input !== "string") {
    return res.status(400).json({ error: "input is required" });
  }
  const result = stepUssdSession(req.params.sessionId, input);
  res.json(result);
});

router.get("/queue/pending", (_req, res) => {
  res.json({ pending: listPendingRequests() });
});

router.post("/queue/process", limit, async (_req, res) => {
  const results = await processQueue();
  res.json({ processed: results.length, results });
});

router.post("/feedback", limit, (req, res) => {
  const body = req.body ?? {};
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Invalid feedback." });
  }
  const extra = Object.keys(body).filter((key) => !["rating", "comment", "context"].includes(key));
  if (extra.length > 0) {
    return res.status(400).json({ error: "Only rating, comment, and context are accepted." });
  }
  if (body.rating !== "helpful" && body.rating !== "not_helpful") {
    return res.status(400).json({ error: "rating must be helpful or not_helpful." });
  }
  let comment: string | undefined;
  if (body.comment !== undefined) {
    if (typeof body.comment !== "string" || body.comment.length > 280) {
      return res.status(400).json({ error: "comment must be 280 characters or fewer." });
    }
    comment = body.comment.trim() || undefined;
  }
  let context: string | undefined;
  if (body.context !== undefined) {
    if (typeof body.context !== "string" || !FEEDBACK_CONTEXTS.has(body.context)) {
      return res.status(400).json({ error: "context is not recognised." });
    }
    context = body.context;
  }
  saveFeedback({ rating: body.rating, comment, context });
  res.status(201).json({ ok: true });
});

router.post("/providers/sms", limit, providerGate("SMS_WEBHOOK_TOKEN"), async (req, res) => {
  if (containsPhoneField(req.body)) {
    return res.status(400).json({ error: "Do not send a phone number. Send a sessionId from your gateway." });
  }
  const { sessionId, text, locale } = req.body ?? {};
  if (typeof sessionId !== "string" || sessionId.trim() === "" || sessionId.length > 80) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  if (typeof text !== "string" || text.trim() === "" || text.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: "text is required" });
  }
  const effectiveLocale = isValidLocale(locale) ? locale : undefined;
  const result = await handleSmsMessage(sessionId, text, effectiveLocale);
  res.json(result);
});

router.post("/providers/ussd", limit, providerGate("USSD_WEBHOOK_TOKEN"), (req, res) => {
  if (containsPhoneField(req.body)) {
    return res.status(400).json({ error: "Do not send a phone number. Send a sessionId from your gateway." });
  }
  const { sessionId, input, locale } = req.body ?? {};
  if (typeof sessionId !== "string" || sessionId.trim() === "" || sessionId.length > 80) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  const effectiveLocale = isValidLocale(locale) ? locale : "en";
  if (typeof input === "string" && input.length > 0) {
    return res.json(stepUssdSession(sessionId, input));
  }
  return res.json(startUssdSession(sessionId, effectiveLocale));
});
