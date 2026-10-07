import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

export const MAX_MESSAGE_CHARS = 800;

export function securityHeaders(): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'"
    );
    next();
  };
}

export interface RateBucket {
  count: number;
  resetAt: number;
}

/** Returns true when the caller may proceed. Pure so tests can use their own map. */
export function takeToken(
  store: Map<string, RateBucket>,
  key: string,
  max: number,
  windowMs: number,
  now: number
): boolean {
  const bucket = store.get(key);
  if (!bucket || now >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

const writeStore = new Map<string, RateBucket>();

export function limitWrites(max = 80, windowMs = 60_000): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    if (!takeToken(writeStore, key, max, windowMs, Date.now())) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
    }
    next();
  };
}

export function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

/** Production refuses a public demo reset. Development keeps the local button working. */
export function demoResetAllowed(provided: string | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV !== "production") return true;
  const expected = env.DEMO_RESET_TOKEN;
  if (!expected) return false;
  return tokensMatch(provided ?? "", expected);
}

export function providerGate(envName: "SMS_WEBHOOK_TOKEN" | "USSD_WEBHOOK_TOKEN"): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const expected = process.env[envName];
    if (!expected) {
      return res.status(503).json({
        error: "This provider webhook is not configured.",
        configured: false
      });
    }
    const provided = req.get("x-farmexpert-token") ?? "";
    if (!tokensMatch(provided, expected)) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    next();
  };
}

const PHONE_FIELDS = ["from", "msisdn", "phone", "phoneNumber", "sender"];

export function containsPhoneField(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  return PHONE_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(body, field));
}
