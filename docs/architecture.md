# Architecture

Single-user iOS app. No backend: all data lives in SQLite on the device.

## Stack

Expo SDK 54 (expo-router tabs), React Native 0.81, zustand, drizzle-orm over
expo-sqlite, dayjs, react-native-reanimated, expo-notifications. OTA updates via
EAS (`runtimeVersion` policy `appVersion`).

## Layout

```
app/                 screens: (tabs)/today, index (Slate), history, settings; _layout boots the app
components/          UI; planner/ (Today + Slate sections), history/, celebration/ (check animations)
sheets.tsx           action-sheet registry: add/edit, date picker, dependency picker, day details
lib/db/              schema.ts (drizzle), migrations.ts, connection.ts
lib/logic/           repo.ts (all queries), rollover.ts, streaks.ts, dates.ts
lib/stores/          appStore (tasks/habits), timeStore (current day), settings, historyStore
lib/services/        notifications.ts
tests/               logic tests; scripts/run-tests.js is a tiny TS runner with module mocks
```

## Data model

| Table | Purpose |
|---|---|
| `tasks` | `status` open/done/archived (delete = archive). `scheduled_for` = do date, `due_date`, `completed_at` (UTC timestamp), `completed_date` (logical day, see below), `depends_on_task_id` (informational link only) |
| `habits` | `is_active` (delete = deactivate) |
| `habit_completions` | one row per habit per day completed; the live state for today |
| `habit_history` / `task_history` | per-day record written by rollover; what History reads for past days |
| `app_settings` | key/value settings |

`last_processed_date` (the last day rollover finalized) lives in `expo-sqlite/kv-store`.

### Migrations

`lib/db/migrations.ts` is an ordered list tracked with `PRAGMA user_version`; each runs
in a transaction with its version bump. Never edit a shipped migration: append a new
one. Tests run the same migrations against better-sqlite3.

## Day logic

- **Logical day**: `getToday(dayStart)`. Before the day start (04:00, not user-editable)
  it is still the previous day. All day-keyed columns store this `YYYY-MM-DD` value.
  Never derive a day from a UTC timestamp.
- **timeStore** owns `currentDate`. On launch it runs rollover; while running it
  re-checks on foreground and every minute, and on a change it runs rollover and then
  refreshes the app store.
- **Rollover** (`processRollover`) walks each unprocessed day up to today. For each day,
  in a single synchronous transaction, it:
  1. writes habit history (active habits that existed that day, plus any completed)
  2. writes task history (planned tasks, plus unplanned tasks completed that day)
  3. carries unfinished tasks to the next day
  4. on the final day only, pulls in open tasks due on or before it

  Runs are serialized, and re-running a day is harmless.
- **Today list** = open tasks with `scheduled_for <= today` + done tasks whose do date
  or `completed_date` is today.
- **Due dates**: tasks due on or before today join Today at rollover and on
  create/edit. Moving one out of Today sticks until the next morning.
- **Past do dates** are clamped to today on create/edit; rollover never revisits past days.
- **Streaks** = consecutive completed days in `habit_history` ending yesterday, +1
  if completed today (today isn't in history until it rolls over).

## Notifications

- "Plan your day" and "Night review": `DAILY` triggers with static text.
- Habit reminders: one-shot `DATE` triggers for the next 7 days (iOS caps pending
  notifications at 64), every N hours inside the configured window. Today's reminders
  are skipped once all habits are done.
- Rescheduled on launch, foreground, settings changes, and when a habit is
  toggled, created or deleted. Reschedules run one at a time (each cancels and
  re-adds over many awaits, so overlapping runs could leave stale reminders).

## State conventions

- The repo layer is the only place with queries. Store actions write, then
  `refreshData()`, which drops out-of-order results.
- Task and habit toggles are optimistic: update state, persist in the background,
  revert on error.
- In drizzle `update().set()`, `undefined` means "leave unchanged"; pass `null` to
  clear a field.
