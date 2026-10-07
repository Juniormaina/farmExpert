import { randomBytes } from "node:crypto";

export function newRequestId(): string {
  return `FE-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function farmerError(requestId: string): string {
  return `Something went wrong. Reference: ${requestId}`;
}
