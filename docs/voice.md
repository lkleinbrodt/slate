# Voice

Plan: 2026-10-31. Steps 1–3 are built and work on the phone. **Step 4 is built** (JS,
2026-10-31; see "Step 4: built" at the end) and waits on a real morning call. A second way to use Slate: talk it through with a character
instead of tapping. The first, and for now only, voice mode is **plan the day**.

## The idea

Each morning Landon picks tasks from the Slate for Today. With voice, he calls a character
(Elle, Jarvis, …) for a few minutes and talks the day through. When he hangs up, Slate turns
the conversation into proposed changes, he reviews them, and Slate applies the ones he keeps.
Later, the same call also plans his calendar.

**Slate owns the outcome; Threepio owns the voice.** Threepio (`~/Projects/threepio`, a
service on chewy, tailnet only) runs the conversation: speech recognition, the LLM, the
character's voice. Slate decides what the call is for, sends the data, gets the transcript
back, and does everything with it. Threepio's side is built (`POST /v1/sessions`, see its
README); this doc is Slate's side.

## What Landon sees

1. **Start.** A "Plan with voice" button on Today. A short sheet shows the character
   (last one used, tap to change) and a Call button.
2. **Call.** A full-screen call: who he's talking to, a live transcript, mute, hang up. It
   keeps going with the screen locked. The character opens by greeting him and asking about
   his day, knowing what's already planned and what's due.
3. **Planning.** After he hangs up: "Making your plan…", a few seconds.
4. **Review.** A sheet with a one-line summary and each proposed change ("Today: write the
   report", "New task: call the bank, due Friday"), each with a toggle. Apply makes the kept
   changes in one go; Discard drops them.
5. **Done.** Back on Today, with the plan in place.

The transcript is kept, so a crash or a killed app between steps 2 and 4 loses nothing:
Slate picks up where it left off the next time it opens.

## How it works

```
Today ─▶ snapshot of the day ─▶ instructions ─▶ POST /v1/sessions ─▶ call (WebRTC)
                    │                                                    │
                    │                                    GET /v1/calls/{id} (transcript)
                    ▼                                                    ▼
            refs t1…tn ───────────────▶ extraction (Slate's LLM call) ─▶ proposal
                                                                         │
                                                         review ─▶ apply (store actions)
```

### The day snapshot

One function reads the database into a plain object: today's date, Today's tasks (open and
done), open Slate tasks with their do and due dates (overdue and due soon first), active
habits with streaks, and what was planned yesterday and not done. Each task gets a short ref
(`t1`, `t2`, …) mapped to its id. The same snapshot feeds both the call and the extraction,
so the refs the extraction uses are the ones the data showed.

### The call's instructions

Built from the snapshot as plain prose (the character reads it; nothing in it is code):
the job (help him choose today's tasks, notice new ones he mentions and when they're due,
keep it to a few minutes), the data, and two rules:

- Slate turns the conversation into his plan after the call, so the character can say
  "I'll put that on today". (The opposite of Threepio's own page, where she can't.)
- Before he hangs up, recap the plan in a sentence or two. It confirms it for him and makes
  the extraction more reliable.

Greeting: `{prompt: …}`, so it can open with something from his day (~0.6 s; a fixed `say`
greeting is ~0.2 s but can't). Character: his pick, from `GET /v1/characters?app=slate`.
`metadata` carries Slate's own session id so a call can be matched to its row.

### Extraction

After the call, Slate sends the transcript and the snapshot (with refs) to an LLM through
OpenRouter, asking for structured JSON (a JSON schema). The proposal:

```ts
type Proposal = { summary: string; changes: Change[] };
type Change = { reason: string } & (            // reason: a short why, shown in review
  | { kind: "plan_today"; task: Ref }           // do date → today
  | { kind: "send_to_slate"; task: Ref }        // clear the do date
  | { kind: "snooze"; task: Ref; until: Day }   // do date → a later day
  | { kind: "create"; title: string; notes?: string; due?: Day; today: boolean }
  | { kind: "set_due"; task: Ref; due: Day | null }
  | { kind: "complete"; task: Ref }             // he says it's already done
  | { kind: "delete"; task: Ref }               // he's not doing it: archive it
);
```

Slate checks the result before showing it: unknown refs, past dates and duplicates are
dropped, and changes are applied through the existing store actions (so due-date pulls,
the widget and notifications all behave as they do for taps). Habits are context only in v1:
the character can mention them, the plan doesn't change them. The model is a setting;
accuracy matters more than speed here.

### Storage

A new table (new migration), `voice_sessions`: id, mode (`plan_day`), started_at, character,
call_id, status (`calling` → `ended` → `proposed` → `applied` | `discarded`), the snapshot,
the transcript, the proposal, and which changes were applied. It's the resume point after a
crash and a record to tune prompts from. Private like everything else on the phone.

### Settings (Settings → Voice)

Threepio URL (default `https://chewy.tail77f3eb.ts.net:8443`), OpenRouter key (pasted once,
kept in the iOS Keychain with `expo-secure-store`, shown only as "set"; a key of its own with
a spending limit), the extraction model, and a "Test connection" row that lists Threepio's
characters. The character is picked on the start sheet, not here.

### Code layout

```
lib/voice/threepio.ts        Threepio's API: characters, voices, create session, get call
lib/voice/openrouter.ts      one structured-output chat call
lib/voice/planDay/           the mode: snapshot.ts, instructions.ts, extract.ts (prompt,
                             schema, validation), apply.ts
lib/stores/voiceStore.ts     the live session: state machine, resume after a crash
components/voice/            StartSheet, CallScreen, ReviewSheet
app/voice.tsx                the call screen route (slate://voice)
```

A mode is a folder with those four parts. That's the whole abstraction until a second mode
shows up; no registry.

## Native build

One rebuild on airlandon adds everything voice needs, calendar included, so the calendar
step later is an OTA. Built as 1.1.0 on 2026-10-31; **1.1.1** adds the widget's iOS 17
target (merged late from the `widgets` branch) and needs one more build, after which steps
4 to 6 are all OTA:

- Pipecat's React Native client and Daily's media manager, pinned exactly (checked on npm
  2026-10-31: publisher, age of at least two weeks, no install scripts, no new audit
  findings): `@pipecat-ai/client-js` 1.14.0, `@pipecat-ai/react-native-small-webrtc-transport`
  1.8.0, `@pipecat-ai/react-native-daily-media-manager` 0.0.2, `@daily-co/react-native-daily-js`
  0.86.0 (the media manager allows only 0.86.x), `@daily-co/react-native-webrtc`
  124.0.6-daily.2, async-storage 3.1.1, background-timer 2.4.1, get-random-values 1.11.0.
  The media manager is what does iOS audio routing (speaker, AirPods); the transport can't
  run without one.
- **No Daily config plugin.** Its versions for SDK 54 are old and the current ones need SDK
  55; on iOS (no screen share) all it does is add the microphone and camera strings, which
  `app.json` sets itself.
- `expo-secure-store` (the key) and `expo-calendar` (unused until the last step).
- `NSMicrophoneUsageDescription`, calendar usage strings, `UIBackgroundModes: audio`.
- **A Reminders string too**, though Slate doesn't use Reminders: expo-calendar checks
  Reminders permission when it loads, and a missing `NSRemindersFullAccessUsageDescription`
  crashed 1.1.0 at launch on iOS 17+ (fixed before it shipped).
- iOS deployment target 17 (`expo-build-properties`; the widget's ExtensionStorage needs 16.4,
  the transport 15).

Proven with a throwaway call screen before anything else is built on it.

## Steps

Each step ends with something that works and is checked.

1. ✅ **Threepio client and settings (JS).** `threepio.ts`, Settings → Voice with Test
   connection. *Done when* the phone lists Threepio's characters over the tailnet (OTA).
2. ✅ **Plan-day logic (JS, no UI).** Snapshot, refs, instructions, the extraction prompt and
   schema, validation, apply. *Done when* `npm test` covers each against the in-memory
   database, with a sample transcript and a faked LLM reply. Built in `lib/voice/planDay/`
   and `lib/voice/openrouter.ts`, tested in `tests/planDay.test.ts`. The extraction model
   defaults to `anthropic/claude-sonnet-5.5` (structured output on OpenRouter, $2/$10 per M tokens: about 1¢ a
   call); the schema is one flat change shape, which models follow more reliably than a
   union. Not yet tried against a real model.
3. ✅ **Native build.** The packages above, a bare call screen that talks to Threepio, the key
   in the Keychain: `app/voice.tsx` (Settings → Voice → Test call, a real plan-the-day call
   with today's data, live transcript, then the transcript fetched back), `lib/voice/call.ts`,
   `lib/voice/secrets.ts`. *Done when* a call from Slate on the phone reaches Elle and its
   transcript comes back: done on 1.1.0, 2026-10-31.
4. **The flow (JS).** `voice_sessions`, voiceStore, StartSheet → CallScreen → planning →
   ReviewSheet → apply, resume after a crash. *Done when* a real morning call ends with
   today's tasks set from what he said (OTA). This is Threepio's Phase 2 exit. Built
   2026-10-31 (PRs #24–#26); not yet tried on the phone.
5. **Tune.** A few real mornings, then adjust the instructions, the extraction prompt and
   the model from the saved sessions.
6. **Calendar (last).** Read today's events into the snapshot, add event changes to the
   proposal, write them to a "Slate" calendar. *Done when* the review shows tasks and
   calendar blocks together and applying writes both (OTA).

## Open questions

- Entry points beyond the buttons: the morning "plan your day" notification opening voice
  planning, or the Action Button. (Decided 2026-10-31: a "Plan with voice" button on Today
  and on the Slate, nothing else for now.)
- Editing a change in the review (decided 2026-10-31: keep/drop only for now). Editing a
  task's title or notes by voice is a possible later change kind.
- Calendar details, for step 6: which calendars iOS shows, whether planned blocks go to a
  "Slate" calendar, and whether Slate may ever move his existing events (start add-only).

## Step 4: handoff

*Historical: the brief step 4 was built from. What was built is in "Step 4: built" below.*

For an agent starting step 4 without the conversation that built steps 1–3. Read this whole
doc first, then `docs/architecture.md`, then the code under `lib/voice/`.

### What exists

| File | What it is |
|---|---|
| `lib/voice/threepio.ts` | Threepio's `/v1` client: `characters()`, `voices()`, `createSession()`, `call(id)`. Typed. Errors are `ThreepioError` with a message fit to show. |
| `lib/voice/call.ts` | `VoiceCall`: create a session, connect with Pipecat's RN client, `onPhase` / `onCallId` / `onMessage`, `hangUp()`, `setMuted()`. |
| `lib/voice/planDay/snapshot.ts` | `buildDaySnapshot(date)`: the day as plain JSON with task refs; `tasksByRef()`. |
| `lib/voice/planDay/instructions.ts` | `buildInstructions(snapshot)`, `GREETING_PROMPT`, `spokenDay()`. |
| `lib/voice/planDay/extract.ts` | `extractPlan({snapshot, transcript, apiKey, model?})` → `Proposal` (`summary`, `changes`, `dropped`) plus `costUsd`; `validateProposal()`; `DEFAULT_PLAN_MODEL`. |
| `lib/voice/planDay/apply.ts` | `applyChanges(changes)` → `{applied, skipped}`, through the app store's actions. |
| `lib/voice/openrouter.ts` | `chatJSON()`: one structured-output OpenRouter call. |
| `lib/voice/secrets.ts` | `getOpenRouterKey()` / `setOpenRouterKey()`, iOS Keychain. |
| `components/settings/VoiceSettings.tsx` | Settings → Voice: Threepio address, Test connection, OpenRouter key, Test call. |
| `app/voice.tsx` | The bare test call (route `/voice`, a full-screen modal). Step 4 replaces it. |
| `tests/threepio.test.ts`, `tests/planDay.test.ts` | Client and plan-day logic, against the in-memory database. |

Threepio's side (`~/Projects/threepio`, its README and design doc Phase 2) is built and live:
`POST /v1/sessions`, the `call_started` and `message` events, `GET /v1/calls/{id}`. It also
takes `voice_provider: "fish" | "pocket"` with a character, for her local (free, Pocket TTS)
voice when she has one; `/v1/characters` lists each character's `variants`. Slate doesn't use
it yet; offering "local" on the start sheet is a nice-to-have, not part of step 4.

### What to build

1. **`voice_sessions` table** (append a migration in `lib/db/migrations.ts`; never edit a
   shipped one; add it to `lib/db/schema.ts`): `id`, `mode` (`plan_day`), `date` (logical
   day), `started_at`, `character`, `call_id`, `status` (`calling` → `ended` → `planning` →
   `proposed` → `applied` | `discarded`, or `failed` with `error`), and JSON text columns
   `snapshot`, `transcript`, `proposal`, `applied` (what was kept and what was skipped).
   Repo functions in `lib/logic/repo.ts`, the only place with queries.
2. **`lib/stores/voiceStore.ts`**: the state machine for one session, persisting each step
   to `voice_sessions` before moving on. On launch, a session left in `calling`/`ended`/
   `planning` resumes: fetch the transcript with `GET /v1/calls/{call_id}` (Threepio keeps
   it), then plan; one left in `proposed` reopens the review.
3. **StartSheet** (register in `sheets.tsx`): the character (last used, remembered in
   `app_settings`; list from `characters()`), a Call button. A "Plan with voice" button on
   Today opens it. If the OpenRouter key isn't set, say so and link to Settings before the
   call, not after.
4. **CallScreen** (replace `app/voice.tsx`): who, live transcript, mute, hang up, keeps going
   locked (`UIBackgroundModes: audio` is in). Builds the snapshot and instructions at start
   (`buildDaySnapshot`, `buildInstructions`, `GREETING_PROMPT`), `metadata: {session_id}`.
5. **Planning**: after hang-up, wait for `GET /v1/calls/{id}` to say `ended`, store the
   transcript, run `extractPlan`, store the proposal. Show "Making your plan…". On an
   error, keep the transcript and offer Try again.
6. **ReviewSheet**: the summary, then each change with a toggle (on by default) and its
   `reason` small underneath. Apply → `applyChanges(kept)`, store the result, close to
   Today. Discard → `discarded`. Show anything `skipped` briefly. `dropped` is for tuning:
   store it, don't show it.
7. **Remove the test call** from Settings once the real flow works, or keep it behind
   `__DEV__`.

Unit-test the store's state machine and the new repo functions with `npm test` (fake the
Threepio client and OpenRouter as `tests/planDay.test.ts` does). The call itself can only be
tried on the phone.

### Ask Landon before deciding

- Where else voice planning starts (the open questions above): only the Today button for
  now is the safe default.
- Whether the review lets him edit a change or only keep/drop it (keep/drop is the default
  in this plan).
- Anything that looks like a new feature beyond this list.

### Rules that bite

- **`main` is protected on GitHub: changes go through a PR.** Work on a branch, open a PR,
  and merge it with a merge commit (not squash) once Landon says so. Make sure your branch
  starts from an up-to-date `origin/main` (`git fetch` first): stale local branches already
  caused one lost merge.
- **OTA**: `npm run update -- "msg"` from a clean `main` after merging. It's outward-facing:
  ask Landon first. It reaches only builds of the same version (1.1.1 from here on).
- **Native changes** (a new native module, app.json native config) need a version bump and
  a build on airlandon by Landon or his Mac agent; avoid them in step 4.
- **Test calls cost money** (a few cents) and land in Threepio's stats and `calls/` folder.
  Landon makes them on his phone; from chewy, test against fakes.
- **Privacy**: Landon's transcripts are private, in Threepio and in Slate's database. Don't
  read his real calls or print them; your own test data is yours.
- **Don't print secrets**: the OpenRouter key lives only in the phone's Keychain.

## Step 4: built

| File | What it is |
|---|---|
| `voice_sessions` (migration v3), `repo.*VoiceSession*` | One row per call; `getUnfinishedVoiceSession()` is the resume point. |
| `lib/stores/voiceStore.ts` | The session: `startCall`, `hangUp`, `setMuted`, `retry`, `apply(kept)`, `discard`, `resume`. Each step is saved before the next. Threepio, the call, the key, the LLM and the clock come from `setVoiceDeps` (fakes in `tests/voiceStore.test.ts`). |
| `components/voice/PlanWithVoiceButton.tsx`, `open.ts` | On Today and the Slate. Opens the start sheet, or goes back to an unfinished session ("Back to your call", "Review your plan", "Voice plan: needs a look"). |
| `components/voice/StartSheet.tsx` | Character chips (last used, from `voice_character`), Call. Without an OpenRouter key it links to Settings instead. |
| `app/voice.tsx` | The call screen: live transcript, mute, hang up; then "Making your plan…"; on a failure the error, Try again and Discard. Closes itself when the plan is ready. |
| `components/voice/ReviewSheet.tsx` | Summary, a toggle per change with its reason, Apply n / Discard. Swiping it away keeps the plan. Skipped changes show in an alert. |
| `components/voice/VoiceSessionWatcher.tsx` | At the root: `resume()` on launch, and opens the review whenever a plan becomes ready. |
| `lib/voice/planDay/describe.ts` | How a change is worded in the review. |

Behaviour worth knowing:

- One session at a time: the button returns to an unfinished one rather than starting another.
- After hang-up the store polls `GET /v1/calls/{id}` until `ended` (15 s; 60 s on resume after a crash), then plans with `voice_plan_model` (Settings → Voice → Plan model).
- Failures keep the transcript; Try again re-plans without fetching it again. A call that dropped before Threepio sent its id can't be recovered.
- A session left from an earlier day is discarded on launch, so a stale plan can't land on the wrong today.
- `proposal` stores `costUsd` and `model`; `applied` stores `{applied, skipped, declined}` (declined: what he turned off), for step 5.
- The step 3 test call is gone; Settings → Voice keeps Test connection.

