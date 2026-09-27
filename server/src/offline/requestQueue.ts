import { db } from "../database/connection.js";
import type { AgentRequest, AgentResponse } from "../shared/types.js";
import { handleAgentMessage } from "../agent/index.js";

interface QueueRow {
  id: number;
  channel: string;
  payload: string;
  created_at: string;
  synced: number;
}

export function enqueueRequest(request: AgentRequest): number {
  const result = db
    .prepare("INSERT INTO request_queue (channel, payload, created_at, synced) VALUES (?, ?, ?, 0)")
    .run(request.channel, JSON.stringify(request), new Date().toISOString());
  return Number(result.lastInsertRowid);
}

export function listPendingRequests(): Array<{ id: number; request: AgentRequest; createdAt: string }> {
  const rows = db.prepare("SELECT * FROM request_queue WHERE synced = 0 ORDER BY id").all() as unknown as QueueRow[];
  return rows.map((row) => ({ id: row.id, request: JSON.parse(row.payload) as AgentRequest, createdAt: row.created_at }));
}

export async function processQueue(): Promise<Array<{ id: number; response: AgentResponse }>> {
  const pending = listPendingRequests();
  const results: Array<{ id: number; response: AgentResponse }> = [];

  for (const item of pending) {
    const response = await handleAgentMessage(item.request);
    db.prepare("UPDATE request_queue SET synced = 1 WHERE id = ?").run(item.id);
    results.push({ id: item.id, response });
  }

  return results;
}

export function clearQueue(): void {
  db.exec("DELETE FROM request_queue");
}
