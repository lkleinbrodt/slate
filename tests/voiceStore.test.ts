import assert from "assert";
import { eq } from "drizzle-orm";

import * as repo from "@/lib/logic/repo";
import { db } from "@/lib/db/connection";
import { tasks } from "@/lib/db/schema";
import type { CallEvents } from "@/lib/voice/call";
import type { CallMessage, SessionRequest, ThreepioCall, ThreepioClient } from "@/lib/voice/threepio";
import { buildDaySnapshot } from "@/lib/voice/planDay/snapshot";
import { DEFAULT_PLAN_MODEL, type Change, type extractPlan } from "@/lib/voice/planDay/extract";
import { NO_KEY_ERROR, resetVoiceStore, setVoiceDeps, useVoiceStore } from "@/lib/stores/voiceStore";
import { useAppStore } from "@/lib/stores/appStore";
import { useTimeStore } from "@/lib/stores/timeStore";
import { resetDatabase } from "./mocks/db-connection";
import { insertTask } from "./helpers";

const TODAY = "2024-08-10";
const SAID: CallMessage[] = [
  { role: "assistant", text: "Morning! What's first?", at: "2024-08-10T15:00:00Z" },
  { role: "user", text: "Taxes today, and I'm dropping the banjo.", at: "2024-08-10T15:00:05Z" },
];

export async function run() {
  await testCallToPlanToApply();
  await testOneSessionAtATime();
  await testNoKeyFailsThenRetries();
  await testExtractionErrorKeepsTranscript();
  await testCallFailingBeforeItStarts();
  await testNothingSaid();
  await testDiscardMidCall();
  await testResumeAfterCrashMidCall();
  await testResumeReopensReview();
  await testResumeDropsOtherDays();
  await testResumeWithoutCallId();
  setVoiceDeps(null);
}

// ====== Fakes ======

interface Fakes {
  requests: SessionRequest[];
  events: CallEvents;
  hungUp: number;
  /** What GET /v1/calls/{id} answers, in turn; the last one repeats. */
  callReplies: ("live" | "ended")[];
  callsFetched: number;
  /** The transcript Threepio returns once the call has ended. */
  transcript: CallMessage[];
  apiKey: string | null;
  extracted: Parameters<typeof extractPlan>[0][];
  extractError: string | null;
}

let fakes: Fakes;
let taxes: repo.Task;
let banjo: repo.Task;

async function setUp() {
  resetDatabase();
  resetVoiceStore();
  useTimeStore.setState({ currentDate: TODAY, isInitialized: true });
  useAppStore.setState({ isInitialized: true });
  taxes = await insertTask({ title: "Taxes", dueDate: "2024-08-08" });
  banjo = await insertTask({ title: "Learn the banjo" });
  await useAppStore.getState().refreshData();

  fakes = {
    requests: [],
    events: {},
    hungUp: 0,
    callReplies: ["live", "ended"],
    callsFetched: 0,
    transcript: SAID,
    apiKey: "sk-test",
    extracted: [],
    extractError: null,
  };
  const threepio = {
    call: async (callId: string): Promise<ThreepioCall> => {
      const status = fakes.callReplies[Math.min(fakes.callsFetched++, fakes.callReplies.length - 1)];
      return {
        call_id: callId, status, app: "slate", started_at: "", ended_at: null, character: "elle",
        voice: null, messages: status === "ended" ? fakes.transcript : [], metadata: {}, cost_usd: null,
      };
    },
  } as unknown as ThreepioClient;

  setVoiceDeps({
    threepio: () => threepio,
    createCall: (_threepio, events) => {
      fakes.events = events;
      return {
        start: async (request) => {
          fakes.requests.push(request);
          events.onPhase?.("connecting");
        },
        hangUp: async () => {
          fakes.hungUp++;
          events.onPhase?.("ended");
        },
        setMuted: () => {},
      };
    },
    getApiKey: async () => fakes.apiKey,
    sleep: async () => {},
    extract: async (opts) => {
      fakes.extracted.push(opts);
      if (fakes.extractError) throw new Error(fakes.extractError);
      const changes: Change[] = [
        { kind: "plan_today", taskId: taxes.id, title: "Taxes", reason: "he said today" },
        { kind: "delete", taskId: banjo.id, title: "Learn the banjo", reason: "he's dropping it" },
      ];
      return { summary: "Taxes today.", changes, dropped: [], costUsd: 0.01 };
    },
  });
}

/** A call that starts, gets its id and two lines, and is hung up. */
async function talk() {
  await useVoiceStore.getState().startCall("elle");
  fakes.events.onPhase?.("live");
  fakes.events.onCallId?.("c1");
  SAID.forEach((m, i) => fakes.events.onMessage?.(i, m));
  await useVoiceStore.getState().hangUp();
}

/** The store plans in the background after a call; wait for it to settle. */
async function settle(status: string) {
  for (let i = 0; i < 100; i++) {
    if (useVoiceStore.getState().session?.status === status) return;
    await new Promise((r) => setTimeout(r, 1));
  }
  assert.fail(`never reached ${status}; at ${useVoiceStore.getState().session?.status}`);
}

const row = async () => {
  const id = useVoiceStore.getState().session?.id;
  assert(id, "a session is active");
  const r = await repo.getVoiceSession(id);
  assert(r);
  return r;
};

// ====== Tests ======

async function testCallToPlanToApply() {
  await setUp();
  await useVoiceStore.getState().startCall("elle");
  assert.strictEqual(useVoiceStore.getState().callPhase, "connecting");
  const started = await row();
  assert.strictEqual(started.status, "calling");
  assert.strictEqual(started.date, TODAY);

  const [request] = fakes.requests;
  assert.strictEqual(request.app, "slate");
  assert.strictEqual(request.character, "elle");
  assert.strictEqual(request.local_date, TODAY);
  assert.deepStrictEqual(request.metadata, { session_id: started.id });
  assert.match(request.instructions, /Taxes, overdue/);

  fakes.events.onPhase?.("live");
  fakes.events.onCallId?.("c1");
  SAID.forEach((m, i) => fakes.events.onMessage?.(i, m));
  assert.strictEqual(useVoiceStore.getState().callPhase, "live");
  assert.deepStrictEqual(useVoiceStore.getState().messages, SAID);

  await useVoiceStore.getState().hangUp();
  await settle("proposed");
  assert.strictEqual(useVoiceStore.getState().callPhase, null);
  // Polled until Threepio said ended, then planned from the snapshot the call had
  assert.strictEqual(fakes.callsFetched, 2);
  const saved = await row();
  assert.strictEqual(saved.callId, "c1");
  assert.deepStrictEqual(saved.transcript, SAID);
  assert.strictEqual(fakes.extracted.length, 1);
  assert.deepStrictEqual(fakes.extracted[0].snapshot, saved.snapshot);
  assert.strictEqual(fakes.extracted[0].apiKey, "sk-test");
  assert.strictEqual(fakes.extracted[0].model, DEFAULT_PLAN_MODEL);
  assert.deepStrictEqual((saved.proposal as { model: string; costUsd: number }).model, DEFAULT_PLAN_MODEL);

  // He keeps "Taxes today" and turns off the delete
  const id = saved.id;
  const proposal = useVoiceStore.getState().session!.proposal!;
  const result = await useVoiceStore.getState().apply([proposal.changes[0]]);
  assert.strictEqual(result.applied.length, 1);
  assert.deepStrictEqual(result.declined.map((c) => c.kind), ["delete"]);
  assert.strictEqual(useVoiceStore.getState().session, null);
  const done = await repo.getVoiceSession(id);
  assert.strictEqual(done?.status, "applied");
  assert.deepStrictEqual(done?.applied, result);
  const get = (taskId: string) => db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  assert.strictEqual((await get(taxes.id))?.scheduledFor, TODAY);
  assert.strictEqual((await get(banjo.id))?.status, "open");
  assert(useAppStore.getState().todayTasks.some((t) => t.id === taxes.id));
}

async function testOneSessionAtATime() {
  await setUp();
  await Promise.all([useVoiceStore.getState().startCall("elle"), useVoiceStore.getState().startCall("jarvis")]);
  await useVoiceStore.getState().startCall("jarvis");
  assert.strictEqual(fakes.requests.length, 1);
  assert.strictEqual(fakes.requests[0].character, "elle");
}

async function testNoKeyFailsThenRetries() {
  await setUp();
  fakes.apiKey = null;
  await talk();
  await settle("failed");
  const failed = await row();
  assert.strictEqual(failed.error, NO_KEY_ERROR);
  assert.deepStrictEqual(failed.transcript, SAID);
  assert.strictEqual(fakes.extracted.length, 0);

  fakes.apiKey = "sk-test";
  const fetched = fakes.callsFetched;
  await useVoiceStore.getState().retry();
  assert.strictEqual(useVoiceStore.getState().session?.status, "proposed");
  assert.strictEqual((await row()).error, null);
  // The transcript was already saved: not fetched again
  assert.strictEqual(fakes.callsFetched, fetched);
}

async function testExtractionErrorKeepsTranscript() {
  await setUp();
  fakes.extractError = "OpenRouter answered 502";
  await talk();
  await settle("failed");
  assert.strictEqual((await row()).error, "OpenRouter answered 502");
  assert.deepStrictEqual((await row()).transcript, SAID);

  fakes.extractError = null;
  await useVoiceStore.getState().retry();
  assert.strictEqual(useVoiceStore.getState().session?.status, "proposed");
}

async function testCallFailingBeforeItStarts() {
  await setUp();
  await useVoiceStore.getState().startCall("elle");
  fakes.events.onPhase?.("failed", "Can't reach Threepio. Is Tailscale on?");
  await settle("failed");
  assert.strictEqual((await row()).error, "Can't reach Threepio. Is Tailscale on?");
  assert.strictEqual(fakes.callsFetched, 0);

  // A failed session can be thrown away, and then a new call starts
  await useVoiceStore.getState().discard();
  await useVoiceStore.getState().startCall("elle");
  assert.strictEqual(fakes.requests.length, 2);
}

async function testNothingSaid() {
  await setUp();
  fakes.transcript = [SAID[0]]; // only her greeting
  await talk();
  await settle("failed");
  assert.match((await row()).error ?? "", /Nothing was said/);
  assert.strictEqual(fakes.extracted.length, 0);
}

async function testDiscardMidCall() {
  await setUp();
  await useVoiceStore.getState().startCall("elle");
  fakes.events.onCallId?.("c1");
  const id = useVoiceStore.getState().session!.id;
  await useVoiceStore.getState().discard();
  await new Promise((r) => setTimeout(r, 5));
  assert.strictEqual(fakes.hungUp, 1);
  assert.strictEqual(useVoiceStore.getState().session, null);
  assert.strictEqual((await repo.getVoiceSession(id))?.status, "discarded");
  assert.strictEqual(fakes.callsFetched, 0);
  assert.strictEqual(fakes.extracted.length, 0);
}

async function testResumeAfterCrashMidCall() {
  await setUp();
  // The app died mid-call: the row says calling, with Threepio's id
  const s = await repo.createVoiceSession({ mode: "plan_day", date: TODAY, character: "elle", snapshot: await buildDaySnapshot(TODAY) });
  await repo.updateVoiceSession(s.id, { callId: "c9" });
  fakes.callReplies = ["live", "live", "live", "ended"];

  await useVoiceStore.getState().resume();
  assert.strictEqual(useVoiceStore.getState().session?.status, "proposed");
  assert.strictEqual(fakes.callsFetched, 4);
  assert.deepStrictEqual((await repo.getVoiceSession(s.id))?.transcript, SAID);
}

async function testResumeReopensReview() {
  await setUp();
  await talk();
  await settle("proposed");
  const id = useVoiceStore.getState().session!.id;

  resetVoiceStore(); // the app was killed during the review
  await useVoiceStore.getState().resume();
  const session = useVoiceStore.getState().session;
  assert.strictEqual(session?.id, id);
  assert.strictEqual(session?.status, "proposed");
  assert.strictEqual(session?.proposal?.changes.length, 2);
  assert.strictEqual(fakes.extracted.length, 1, "not planned again");
}

async function testResumeDropsOtherDays() {
  await setUp();
  const s = await repo.createVoiceSession({ mode: "plan_day", date: "2024-08-09", character: "elle", snapshot: {} });
  await repo.updateVoiceSession(s.id, { status: "proposed" });
  await useVoiceStore.getState().resume();
  assert.strictEqual(useVoiceStore.getState().session, null);
  assert.strictEqual((await repo.getVoiceSession(s.id))?.status, "discarded");
}

async function testResumeWithoutCallId() {
  await setUp();
  // Killed before Threepio said the call had started: nothing to fetch
  await repo.createVoiceSession({ mode: "plan_day", date: TODAY, character: "elle", snapshot: {} });
  await useVoiceStore.getState().resume();
  assert.strictEqual(useVoiceStore.getState().session?.status, "failed");
  assert.match(useVoiceStore.getState().session?.error ?? "", /ended before it started/);
}
