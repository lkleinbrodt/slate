// One structured-output chat call through OpenRouter, for Slate's own LLM steps (turning a
// voice call's transcript into a plan). The key is Landon's, kept in the Keychain; it's
// passed in, never stored here.

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const TIMEOUT_MS = 90_000;

export class OpenRouterError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export interface JSONCall {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  /** A JSON schema the reply must match (strict: every property required, no extras). */
  schema: object;
  schemaName: string;
  fetchImpl?: typeof fetch;
}

export interface JSONReply {
  data: unknown;
  /** What OpenRouter charged for the call, in dollars, when it says. */
  costUsd: number | null;
  model: string | null;
}

export async function chatJSON({ apiKey, model, system, user, schema, schemaName, fetchImpl = fetch }: JSONCall): Promise<JSONReply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetchImpl(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Slate",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
        // Only route to providers that honour the schema
        provider: { require_parameters: true },
        temperature: 0,
        usage: { include: true },
      }),
      signal: controller.signal,
    });
  } catch {
    throw new OpenRouterError("Can't reach OpenRouter.");
  } finally {
    clearTimeout(timer);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new OpenRouterError(body?.error?.message ?? `OpenRouter answered ${response.status}`, response.status);
  }
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new OpenRouterError("OpenRouter's reply had no content.");
  }
  try {
    return {
      data: JSON.parse(content),
      costUsd: typeof body?.usage?.cost === "number" ? body.usage.cost : null,
      model: typeof body?.model === "string" ? body.model : null,
    };
  } catch {
    throw new OpenRouterError("OpenRouter's reply wasn't valid JSON.");
  }
}
