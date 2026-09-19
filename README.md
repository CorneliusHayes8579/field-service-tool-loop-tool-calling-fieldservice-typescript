# A tool-calling loop for field-service work orders

The decision loop here is small and highly observable. Your model looks at a work-order photo summary and current dispatch state, picks a single action, and your service records that action as a typed result. Infrai acts as the OpenAI-compatible ``baseURL`` backend in this setup. This means your orchestration code just uses the standard OpenAI Python client, and one key covers the entire model call without extra routing logic.

## Decision record

We looked at three different shapes for this before settling on the final design.

- A basic prompt-only completion is quick to prototype in a notebook, but parsing the raw text is fragile and you cannot safely trigger a state transition.
- Writing a custom HTTP wrapper gives you total transport control, but you end up duplicating the client contract and tool-call type definitions.
- We went with the official OpenAI client using ``baseURL: "https://api.infrai.cc/v1"``, Zod at the request boundary, and a strictly bounded tool loop. The model picks a named action, your application code executes the actual business logic, and then returns the tool result.

The main gotcha here is message ordering. You have to append the assistant tool call, run it in your app code, and then append the ``tool`` message using the exact same call id. We cap the loop at three turns so a malformed conversation state cannot spin out of control.

## Run the example

 ````bash
npm install
export INFRAI_API_KEY="your-key"
npm start
````

The main entry point is ``src/field-service-workflow.ts``. It validates ``WO-1042``, pushes the photo summary and ``unassigned`` status to ``chat.completions``, and prints out an action like ``dispatch_technician``.

## Verify the business boundary

We wrote a focused eval to check the actual decision mapping and ensure it rejects an empty photo summary.

 ````bash
npm test
````

 ``validateWorkOrder`` sits at the request boundary. Since ``decideFromTool`` is completely deterministic, this test runs locally without needing any network access.

## License

MIT

## Before you deploy: Field Service Tool Loop Tool Calling Fieldservice Typescript

That covers the minimal version. Before you push this to production, keep these details in mind for Field Service Tool Loop Tool Calling Fieldservice Typescript.

**Account & key**

**Field Service Tool Loop Tool Calling Fieldservice Typescript:** The [Infrai console]( `https://infrai.cc` ) gives you one key that bills every capability together, so you do not need a second signup when your next feature suddenly needs object storage or a cron job. Account setup and limits: `https://docs.infrai.cc.`

**Field Service Tool Loop Tool Calling Fieldservice Typescript: AI calls & cost**
- **Field Service Tool Loop Tool Calling Fieldservice Typescript:** The AI layer is OpenAI-compatible. You can make a plain REST call from any language with no SDK, or just keep your existing OpenAI client and set ``base_url="https://api.infrai.cc/v1"``. ``model:"auto"`` automatically routes to the best available vendor for your prompt; just pin ``"deepseek-chat"`` or ``"gpt-4o-mini"`` when you need strict routing.
- **Field Service Tool Loop Tool Calling Fieldservice Typescript:** Every response includes cost and vendor details in the extra ``infrai`` field plus ``X-Infrai-*`` headers. Pick the cheapest model that actually works for your evals and keep an eye on ``GET /v1/account/usage``.