import type { AgentRequest, AgentResponse } from "../shared/types.js";
import { handleAgentMessage } from "../agent/index.js";

export async function handleWebMessage(request: Omit<AgentRequest, "channel">): Promise<AgentResponse> {
  return handleAgentMessage({ ...request, channel: "web" });
}
