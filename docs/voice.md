# Voice

Plan: 2026-10-31. Steps 1 and 2 are built (see Steps). A second way to use Slate: talk it through with a
character instead of tapping. The first, and for now only, voice mode is **plan the day**.

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

One rebuild on airlandon (version 1.1.0) adds everything voice needs, calendar included, so
the calendar step later is an OTA:

- Pipecat's React Native client: `@pipecat-ai/client-js`,
  `@pipecat-ai/react-native-small-webrtc-transport`, and per its README the Daily media
  manager and its peers (`@daily-co/react-native-webrtc`, `@daily-co/react-native-daily-js`,
  async-storage, background-timer, get-random-values) plus the Expo config plugin
  `@daily-co/config-plugin-rn-daily-js`. Check every version on npm (age, publisher) before
  installing: Threepio's notes flag a supply-chain attack near these packages, and the README
  and the plugin's latest version (0.0.13, 2026-10-15) disagree.
- `expo-secure-store` (the key) and `expo-calendar` (unused until the last step).
- `NSMicrophoneUsageDescription`, calendar usage strings, `UIBackgroundModes: audio`.
- iOS deployment target 15 or later (the transport's minimum).

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
3. **Native build.** The packages above, a bare call screen that talks to Threepio, the key
   in the Keychain. *Done when* a call from Slate on the phone reaches Elle and its
   transcript comes back.
4. **The flow (JS).** `voice_sessions`, voiceStore, StartSheet → CallScreen → planning →
   ReviewSheet → apply, resume after a crash. *Done when* a real morning call ends with
   today's tasks set from what he said (OTA). This is Threepio's Phase 2 exit.
5. **Tune.** A few real mornings, then adjust the instructions, the extraction prompt and
   the model from the saved sessions.
6. **Calendar (last).** Read today's events into the snapshot, add event changes to the
   proposal, write them to a "Slate" calendar. *Done when* the review shows tasks and
   calendar blocks together and applying writes both (OTA).

## Open questions

- Entry points besides the Today button: the morning "plan your day" notification opening
  voice planning, or the Action Button.
- Whether the review should allow editing a change (e.g. a task's title) or only keep/drop.
- Calendar details, for step 6: which calendars iOS shows, whether planned blocks go to a
  "Slate" calendar, and whether Slate may ever move his existing events (start add-only).
