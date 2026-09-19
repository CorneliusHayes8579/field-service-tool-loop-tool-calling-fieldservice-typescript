import assert from "node:assert/strict";
import { decideFromTool, validateWorkOrder } from "../src/field-service-workflow.js";

const order = validateWorkOrder({ id: "WO-7", photoSummary: "Panel is visibly damaged", dispatchStatus: "unassigned" });
assert.equal(order.dispatchStatus, "unassigned");
assert.deepEqual(decideFromTool("dispatch_technician", order.id), {
  action: "dispatch_technician",
  reason: "Dispatch queued for WO-7."
});
assert.throws(() => validateWorkOrder({ id: "WO-8", photoSummary: "", dispatchStatus: "unassigned" }));
console.log("field-service decision test passed");
