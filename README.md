# Slate

A personal, local-first iOS to-do + habit app (Expo / React Native, SQLite on device).

## Concepts

- **Slate** – every pending task. Tasks can have a **do date** (the day you plan to
  work on it) and/or a **due date** (the deadline). Both are optional.
- **Today** – tasks whose do date is today, plus anything completed today. Each morning
  you pick tasks from the Slate, which sets their do date to today.
- **Rollover** – when a new day starts (default 4:00 AM, so late nights count as the
  previous day):
  - unfinished Today tasks carry over to the new day
  - open tasks that are due or overdue are pulled into Today
  - yesterday is written to history
- From Today you can **snooze** a task to tomorrow or **send it back to the Slate**.
- **Habits** – things to do every day. They always appear in Today and track streaks.
  A **Perfect Day** is one where every habit was completed.
- **History** – calendar of past days (habits/tasks completed, perfect days) and streaks.
- **Notifications** – morning "plan your day", habit reminders during a configurable
  window (only while habits are incomplete), and an evening review.

## Development

```bash
npm install
npm start          # Expo dev server
npm test           # logic tests against an in-memory SQLite DB
npm run lint
npx tsc --noEmit
npm run update     # publish an OTA update (EAS, iOS)
```

See [docs/architecture.md](docs/architecture.md) for how the code is organized and how
the day logic works.
