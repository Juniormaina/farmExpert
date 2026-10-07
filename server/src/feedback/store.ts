import { db } from "../database/connection.js";

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export interface FeedbackInput {
  rating: "helpful" | "not_helpful";
  comment?: string;
  context?: string;
}

export function saveFeedback(input: FeedbackInput, now = Date.now()): void {
  const cutoff = new Date(now - RETENTION_MS).toISOString();
  db.prepare("DELETE FROM feedback WHERE created_at < ?").run(cutoff);
  db.prepare("INSERT INTO feedback (rating, comment, context, created_at) VALUES (?, ?, ?, ?)").run(
    input.rating,
    input.comment ?? null,
    input.context ?? null,
    new Date(now).toISOString()
  );
}
