import assert from "assert";

import { ThreepioError, threepioClient } from "@/lib/voice/threepio";

type Call = { url: string; init?: RequestInit };

export async function run() {
  await testListsCharactersForSlate();
  await testCreateSessionPostsTheRequest();
  await testErrorsAreReadable();
  await testUnreachable();
}

function fakeFetch(status: number, body: unknown, calls: Call[] = []) {
  return (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

async function testListsCharactersForSlate() {
  const calls: Call[] = [];
  const elle = { id: "elle", name: "Elle", voice: null, default: true };
  const client = threepioClient("https://chewy.example:8443/", fakeFetch(200, [elle], calls));
  assert.deepStrictEqual(await client.characters(), [elle]);
  // The trailing slash is dropped, and the list is what's offered to Slate
  assert.strictEqual(calls[0].url, "https://chewy.example:8443/v1/characters?app=slate");
  assert.strictEqual(client.url("/v1/sessions/x/offer"), "https://chewy.example:8443/v1/sessions/x/offer");
}

async function testCreateSessionPostsTheRequest() {
  const calls: Call[] = [];
  const created = { session_id: "s1", connect_url: "/v1/sessions/s1/offer", expires_at: "2026-10-31T05:00:00+00:00" };
  const client = threepioClient("https://chewy.example:8443", fakeFetch(200, created, calls));
  const body = { instructions: "Plan the day.", character: "elle", local_date: "2026-10-31", app: "slate" as const };
  assert.deepStrictEqual(await client.createSession(body), created);
  assert.strictEqual(calls[0].url, "https://chewy.example:8443/v1/sessions");
  assert.strictEqual(calls[0].init?.method, "POST");
  assert.deepStrictEqual(JSON.parse(String(calls[0].init?.body)), body);
}

async function testErrorsAreReadable() {
  const client = (status: number, body: unknown) => threepioClient("https://x", fakeFetch(status, body));
  await assert.rejects(client(400, { detail: "No character called 'bob'." }).call("c"), (e: ThreepioError) => {
    return e instanceof ThreepioError && e.status === 400 && e.message === "No character called 'bob'.";
  });
  // A request body FastAPI refused: each field's problem, without the "body" prefix
  const invalid = { detail: [{ loc: ["body", "local_date"], msg: "Field required" }] };
  await assert.rejects(client(422, invalid).voices(), /local_date: Field required/);
  await assert.rejects(client(502, "Bad Gateway").voices(), /Threepio answered 502/);
}

async function testUnreachable() {
  const failing = (async () => {
    throw new TypeError("Network request failed");
  }) as unknown as typeof fetch;
  await assert.rejects(threepioClient("https://x", failing).characters(), /Is Tailscale on\?/);
}
