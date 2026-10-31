import * as repo from "@/lib/logic/repo";

import { type ApplyResult, applyChanges } from "@/lib/voice/planDay/apply";
import { type CallEvents, VoiceCall } from "@/lib/voice/call";
import { type CallMessage, type SessionRequest, type ThreepioClient, threepioClient } from "@/lib/voice/threepio";
import { type Change, type Proposal, extractPlan } from "@/lib/voice/planDay/extract";
import { GREETING_PROMPT, buildInstructions } from "@/lib/voice/planDay/instructions";
import { type DaySnapshot, buildDaySnapshot } from "@/lib/voice/planDay/snapshot";

import { create } from "zustand";
import { getOpenRouterKey } from "@/lib/voice/secrets";
import { useSettingsStore } from "./settings";
import { useTimeStore } from "./timeStore";

// One plan-the-day voice session at a time (docs/voice.md, step 4): call → transcript →
// plan → review → apply. Every step is written to voice_sessions before the next one
// starts, so a crash or a killed app picks up where it left off (resume() on launch).

export type VoiceStatus = repo.VoiceSession["status"];
export type CallPhase = "connecting" | "live";

export type StoredProposal = Proposal & { costUsd: number | null; model: string };
/** What Apply did: ApplyResult, plus the changes he turned off (for tuning). */
export type StoredApplied = ApplyResult & { declined: Change[] };

export interface ActiveSession {
  id: string;
  date: string;
  status: VoiceStatus;
  character: string | null;
  callId: string | null;
  error: string | null;
  snapshot: DaySnapshot;
  transcript: CallMessage[] | null;
  proposal: StoredProposal | null;
  applied: StoredApplied | null;
}

export interface CallHandle {
  start(request: SessionRequest): Promise<void>;
  hangUp(): Promise<void>;
  setMuted(muted: boolean): void;
}

/** The outside world, swappable for tests: Threepio, the call, the key, the LLM, the clock. */
export interface VoiceDeps {
  threepio: () => ThreepioClient;
  createCall: (threepio: ThreepioClient, events: CallEvents) => CallHandle;
  getApiKey: () => Promise<string | null>;
  extract: typeof extractPlan;
  sleep: (ms: number) => Promise<void>;
}

const defaultDeps: VoiceDeps = {
  threepio: () => threepioClient(useSettingsStore.getState().threepioUrl),
  createCall: (threepio, events) => new VoiceCall(threepio, events),
  getApiKey: getOpenRouterKey,
  extract: extractPlan,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

let deps = defaultDeps;
export function setVoiceDeps(overrides: Partial<VoiceDeps> | null) {
  deps = overrides ? { ...defaultDeps, ...overrides } : defaultDeps;
}

// Threepio marks a call ended a moment after hang-up. After a crash it can take longer
// (it has to notice the connection is gone), so resume waits longer.
const TRANSCRIPT_POLLS = 15;
const RESUME_TRANSCRIPT_POLLS = 60;
const POLL_MS = 1000;

export const NO_KEY_ERROR = "Add your OpenRouter key in Settings → Voice to make a plan.";

interface VoiceState {
  session: ActiveSession | null;
  /** While the call is up; null otherwise. */
  callPhase: CallPhase | null;
  /** Live transcript, by Threepio's line index. */
  messages: CallMessage[];
  muted: boolean;

  /** Starts a call, unless a session is already under way (then it's kept, not replaced). */
  startCall: (character: string) => Promise<void>;
  hangUp: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  /** After a failure: plan again from the saved transcript (or fetch it first). */
  retry: () => Promise<void>;
  apply: (kept: Change[]) => Promise<StoredApplied>;
  discard: () => Promise<void>;
  /** On launch: pick up an unfinished session. */
  resume: () => Promise<void>;
}

let call: CallHandle | null = null;
let starting = false;
// One transcript-and-plan run at a time
let planning: Promise<void> | null = null;

export const useVoiceStore = create<VoiceState>((set, get) => {
  const save = async (changes: Partial<Omit<ActiveSession, "id">>) => {
    const id = get().session?.id;
    if (!id) return;
    await repo.updateVoiceSession(id, changes);
    // The session may have been discarded meanwhile
    set((s) => (s.session?.id === id ? { session: { ...s.session, ...changes } } : {}));
  };

  const fail = (error: string) => save({ status: "failed", error });

  /** Fetch the saved transcript (if needed), then plan. Safe to call twice. */
  const finish = (polls: number) => {
    planning ??= (async () => {
      try {
        if (!get().session?.transcript) {
          const transcript = await fetchTranscript(polls);
          if (!transcript) return;
          await save({ status: "ended", transcript, error: null });
        }
        await plan();
      } finally {
        planning = null;
      }
    })();
    return planning;
  };

  const fetchTranscript = async (polls: number): Promise<CallMessage[] | null> => {
    const callId = get().session?.callId;
    if (!callId) {
      await fail("The call ended before it started.");
      return null;
    }
    const threepio = deps.threepio();
    for (let i = 0; i < polls; i++) {
      try {
        const c = await threepio.call(callId);
        if (c.status === "ended") return c.messages;
      } catch (e) {
        await fail(e instanceof Error ? e.message : String(e));
        return null;
      }
      await deps.sleep(POLL_MS);
    }
    await fail("Threepio hasn't finished the call yet. Try again in a minute.");
    return null;
  };

  const plan = async () => {
    const session = get().session;
    if (!session?.transcript) return;
    await save({ status: "planning", error: null });
    if (!session.transcript.some((m) => m.role === "user" && m.text.trim())) {
      await fail("Nothing was said on the call, so there's nothing to plan.");
      return;
    }
    const apiKey = await deps.getApiKey();
    if (!apiKey) {
      await fail(NO_KEY_ERROR);
      return;
    }
    const model = useSettingsStore.getState().planModel;
    try {
      const result = await deps.extract({ snapshot: session.snapshot, transcript: session.transcript, apiKey, model });
      await save({ status: "proposed", proposal: { ...result, model } });
    } catch (e) {
      await fail(e instanceof Error ? e.message : String(e));
    }
  };

  return {
    session: null,
    callPhase: null,
    messages: [],
    muted: false,

    startCall: async (character) => {
      if (get().session || call || starting) return;
      starting = true;
      const date = useTimeStore.getState().getCurrentDate();
      let snapshot: DaySnapshot;
      let row: repo.VoiceSession;
      try {
        snapshot = await buildDaySnapshot(date);
        row = await repo.createVoiceSession({ mode: "plan_day", date, character, snapshot });
      } finally {
        starting = false;
      }
      set({
        session: { ...toActive(row), snapshot },
        callPhase: "connecting",
        messages: [],
        muted: false,
      });

      const handle = deps.createCall(deps.threepio(), {
        onPhase: (phase, error) => {
          if (get().session?.id !== row.id) return; // discarded
          if (phase === "connecting" || phase === "live") {
            set({ callPhase: phase });
            return;
          }
          call = null;
          set({ callPhase: null });
          // A dropped call with an id still has a transcript at Threepio worth planning from
          if (phase === "failed" && !get().session?.callId) {
            void fail(error ?? "The call failed.");
            return;
          }
          void save({ status: "ended" }).then(() => finish(TRANSCRIPT_POLLS));
        },
        onCallId: (callId) => void save({ callId }),
        onMessage: (index, message) =>
          set((s) => {
            const messages = [...s.messages];
            messages[index] = message;
            return { messages };
          }),
      });
      call = handle;
      await handle.start({
        instructions: buildInstructions(snapshot),
        character,
        greeting: { prompt: GREETING_PROMPT },
        local_date: date,
        app: "slate",
        metadata: { session_id: row.id },
      });
    },

    hangUp: async () => {
      await call?.hangUp();
    },

    setMuted: (muted) => {
      call?.setMuted(muted);
      set({ muted });
    },

    retry: async () => {
      const session = get().session;
      if (session?.status !== "failed") return;
      await finish(TRANSCRIPT_POLLS);
    },

    apply: async (kept) => {
      const session = get().session;
      if (session?.status !== "proposed" || !session.proposal) throw new Error("There's no plan to apply.");
      const result = await applyChanges(kept);
      const applied: StoredApplied = { ...result, declined: session.proposal.changes.filter((c) => !kept.includes(c)) };
      await save({ status: "applied", applied });
      set({ session: null });
      return applied;
    },

    discard: async () => {
      const session = get().session;
      if (!session) return;
      // Forget it first, so hanging up doesn't go on to plan
      set({ session: null, callPhase: null, messages: [] });
      await call?.hangUp();
      call = null;
      await repo.updateVoiceSession(session.id, { status: "discarded" });
    },

    resume: async () => {
      if (get().session) return;
      const row = await repo.getUnfinishedVoiceSession();
      if (!row) return;
      // A plan for another day would put things on the wrong today
      if (row.date !== useTimeStore.getState().getCurrentDate()) {
        await repo.updateVoiceSession(row.id, { status: "discarded", error: row.error ?? "left over from another day" });
        return;
      }
      set({ session: toActive(row), messages: (row.transcript as CallMessage[] | null) ?? [] });
      // Killed mid-call, or between the call and the plan
      if (row.status === "calling" || row.status === "ended" || row.status === "planning") {
        await finish(RESUME_TRANSCRIPT_POLLS);
      }
      // proposed: the review reopens; failed: Try again is offered
    },
  };
});

function toActive(row: repo.VoiceSession): ActiveSession {
  return {
    id: row.id,
    date: row.date,
    status: row.status,
    character: row.character,
    callId: row.callId,
    error: row.error,
    snapshot: row.snapshot as DaySnapshot,
    transcript: (row.transcript as CallMessage[] | null) ?? null,
    proposal: (row.proposal as StoredProposal | null) ?? null,
    applied: (row.applied as StoredApplied | null) ?? null,
  };
}

/** For tests: forget the in-memory session (the database is untouched). */
export function resetVoiceStore() {
  call = null;
  starting = false;
  planning = null;
  useVoiceStore.setState({ session: null, callPhase: null, messages: [], muted: false });
}
