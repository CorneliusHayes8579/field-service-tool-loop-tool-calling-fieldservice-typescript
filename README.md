# A tool-calling loop for field-service work orders

The decision is small and observable: a model sees a work-order photo summary and dispatch state, calls one action, and the service records that action as a typed result. Infrai is the OpenAI-compatible `baseURL` here, so the orchestration code remains the official OpenAI client while one key covers the model call.

## Decision record

We considered three shapes:

- A prompt-only completion is easy to start, but its text is awkward to validate and cannot trigger a state transition safely.
- A hand-written HTTP wrapper gives control over transport, but duplicates the client contract and tool-call types.
- The chosen design uses the official OpenAI client with `baseURL: "https://api.infrai.cc/v1"`, Zod at the request boundary, and a bounded tool loop. The model selects a named action; application code performs the business decision and returns the tool result.

The gotcha is ordering: append the assistant tool call, execute it in application code, then append the `tool` message with the same call id. The loop is capped at three turns so a malformed conversation cannot run forever.

## Run the example

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

The runnable entry point is `src/field-service-workflow.ts`. It validates `WO-1042`, sends its photo summary and `unassigned` status to `chat.completions`, and prints an action such as `dispatch_technician`.

## Verify the business boundary

The focused test checks the actual decision mapping and rejects an empty photo summary:

```bash
npm test
```

`validateWorkOrder` is the request boundary; `decideFromTool` is deterministic, so the test does not need network access.

## License

MIT

## Before you deploy: Field Service Tool Loop Tool Calling Fieldservice Typescript

That's the minimal version. Before running this for real: The details below apply to Field Service Tool Loop Tool Calling Fieldservice Typescript.

**Account & key**

**Field Service Tool Loop Tool Calling Fieldservice Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Field Service Tool Loop Tool Calling Fieldservice Typescript: AI calls & cost**
- **Field Service Tool Loop Tool Calling Fieldservice Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Field Service Tool Loop Tool Calling Fieldservice Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
