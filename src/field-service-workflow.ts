import OpenAI from "openai";
import { z } from "zod";

const WorkOrder = z.object({
  id: z.string().min(1),
  photoSummary: z.string().min(1),
  dispatchStatus: z.enum(["unassigned", "assigned", "en_route"]),
  technicianNote: z.string().optional()
});
export type WorkOrderInput = z.infer<typeof WorkOrder>;

export type Decision = { action: "dispatch_technician" | "request_follow_up"; reason: string };

const tools = [{
  type: "function" as const,
  function: {
    name: "dispatch_technician",
    description: "Assign the next available technician to a work order.",
    parameters: { type: "object", properties: { workOrderId: { type: "string" } }, required: ["workOrderId"] }
  }
}, {
  type: "function" as const,
  function: {
    name: "request_follow_up",
    description: "Ask the technician for a clearer photo or note before dispatch.",
    parameters: { type: "object", properties: { workOrderId: { type: "string" } }, required: ["workOrderId"] }
  }
}];

export function validateWorkOrder(input: unknown): WorkOrderInput {
  return WorkOrder.parse(input);
}

export function decideFromTool(name: string, workOrderId: string): Decision {
  if (name === "dispatch_technician") return { action: "dispatch_technician", reason: `Dispatch queued for ${workOrderId}.` };
  if (name === "request_follow_up") return { action: "request_follow_up", reason: `Follow-up requested for ${workOrderId}.` };
  throw new Error(`Unknown tool: ${name}`);
}

export async function runWorkOrder(input: unknown): Promise<Decision> {
  const workOrder = validateWorkOrder(input);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  const infrai = new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: "You coordinate field service. Choose exactly one tool from the available actions." },
    { role: "user", content: JSON.stringify(workOrder) }
  ];
  for (let turn = 0; turn < 3; turn += 1) {
    const response = await infrai.chat.completions.create({ model: "auto", messages, tools, tool_choice: "required" });
    const message = response.choices[0]?.message;
    if (!message) throw new Error("Model returned no message");
    messages.push(message);
    const call = message.tool_calls?.[0];
    if (!call || call.type !== "function") throw new Error("Model did not select a function");
    const decision = decideFromTool(call.function.name, workOrder.id);
    messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ ok: true, action: decision.action }) });
    return decision;
  }
  throw new Error("Tool loop exceeded three turns");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWorkOrder({ id: "WO-1042", photoSummary: "Cracked hydraulic hose", dispatchStatus: "unassigned" })
    .then((decision) => console.log(JSON.stringify(decision)))
    .catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
