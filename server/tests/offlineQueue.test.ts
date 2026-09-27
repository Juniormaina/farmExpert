import { describe, expect, it, beforeEach } from "vitest";
import { enqueueRequest, listPendingRequests, processQueue, clearQueue } from "../src/offline/requestQueue.js";

describe("offline request queue", () => {
  beforeEach(() => {
    clearQueue();
  });

  it("queues a request while offline and syncs it on reconnect", async () => {
    enqueueRequest({ message: "Bei ya mahindi Nakuru?", channel: "web" });
    expect(listPendingRequests()).toHaveLength(1);

    const results = await processQueue();
    expect(results).toHaveLength(1);
    expect(results[0].response.data?.marketPrices?.length).toBeGreaterThan(0);
    expect(listPendingRequests()).toHaveLength(0);
  });

  it("processes multiple queued requests in order", async () => {
    enqueueRequest({ message: "Bei ya mbolea Nakuru?", channel: "sms", sessionId: "s1" });
    enqueueRequest({ message: "Bei ya mahindi Eldoret?", channel: "sms", sessionId: "s1" });
    const results = await processQueue();
    expect(results).toHaveLength(2);
  });
});
