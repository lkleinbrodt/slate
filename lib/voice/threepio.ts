// Threepio's /v1 API: the voice service on chewy (tailnet only, no token). Threepio holds
// the conversation; Slate says what it's for and gets the transcript back. The contract is
// in Threepio's design doc (Phase 2) and README; see docs/voice.md for Slate's side.

export const DEFAULT_THREEPIO_URL = "https://chewy.tail77f3eb.ts.net:8443";

const TIMEOUT_MS = 10_000;

export interface ThreepioVoice {
  id: string;
  name: string;
  provider: "fish" | "pocket";
  model: string;
  supports_tags: boolean;
  gender: "female" | "male" | null;
}

export interface ThreepioCharacter {
  id: string;
  name: string;
  voice: ThreepioVoice | null;
  default: boolean;
}

export interface SessionRequest {
  /** Everything the call is for, with the data to talk about. All Slate's. */
  instructions: string;
  character?: string;
  /** Overrides the character's voice. One of Threepio's voice ids. */
  voice?: string;
  /** `say`: exact words, spoken at once. `prompt`: the LLM writes them. */
  greeting?: { say: string } | { prompt: string } | null;
  llm?: { model: string; temperature?: number | null };
  listening?: { turn_wait_secs?: number; keyterms?: string[] };
  speech_rules?: boolean;
  expression_tags?: boolean;
  /** YYYY-MM-DD: Slate's logical day, not chewy's (UTC) clock. */
  local_date: string;
  app: "slate";
  metadata?: Record<string, unknown>;
}

export interface CreatedSession {
  session_id: string;
  /** Relative to the base URL; the WebRTC offer goes here, once. */
  connect_url: string;
  expires_at: string;
}

export interface CallMessage {
  role: "user" | "assistant";
  text: string;
  at: string;
  /** Assistant lines only: cut off, so `text` is what she got to say. */
  interrupted?: boolean;
}

export interface ThreepioCall {
  call_id: string;
  status: "live" | "ended";
  app: string;
  started_at: string;
  ended_at: string | null;
  character: string | null;
  voice: string | null;
  messages: CallMessage[];
  metadata: Record<string, unknown>;
  /** Arrives about 10 s after the call ends; null until then. */
  cost_usd: number | null;
}

export class ThreepioError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ThreepioError";
  }
}

type Fetch = typeof fetch;

export function threepioClient(baseUrl: string, fetchImpl: Fetch = fetch) {
  const base = baseUrl.trim().replace(/\/+$/, "");

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetchImpl(`${base}${path}`, { ...init, signal: controller.signal });
    } catch {
      throw new ThreepioError("Can't reach Threepio. Is Tailscale on?");
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      throw new ThreepioError(await errorMessage(response), response.status);
    }
    return (await response.json()) as T;
  }

  return {
    url: (path: string) => `${base}${path}`,
    characters: () => request<ThreepioCharacter[]>("/v1/characters?app=slate"),
    voices: () => request<ThreepioVoice[]>("/v1/voices"),
    createSession: (body: SessionRequest) =>
      request<CreatedSession>("/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    call: (callId: string) => request<ThreepioCall>(`/v1/calls/${encodeURIComponent(callId)}`),
  };
}

export type ThreepioClient = ReturnType<typeof threepioClient>;

/** FastAPI's `detail`: a string, or for a bad request body a list of field errors. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const { detail } = await response.json();
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => `${(d.loc ?? []).slice(1).join(".") || "request"}: ${d.msg}`).join("; ");
    }
  } catch {
    // not JSON
  }
  return `Threepio answered ${response.status}`;
}
