Product Context

Why Slate exists

- Help a single iOS user keep a calm, trustworthy daily plan without cloud or account setup.
- Combine lightweight to‑dos and daily habits in one place with a playful, minimal vibe.

Problems it solves

- Separate task and habit apps fragment attention; Slate unifies them into a single “Today” slate.
- Overwhelm from long backlogs; Slate emphasizes a small daily selection with easy carryover.
- Fragile streaks due to time‑zone/DST surprises; Slate uses a configurable Day Start boundary.

How it should work

- Capture tasks and daily habits quickly.
- Each morning, select a subset for “Today” and optionally snooze tasks forward.
- Check off with delightful micro‑feedback (haptics, tiny confetti) and see a compact progress meter.
- Habits track streaks by local day; a Perfect Day is when all planned habits are done.
- All data is on‑device. Backup/restore via JSON export/import to Files app.

User experience goals

- Playful minimal: friendly, warm, uncluttered; generous spacing and clear empty states.
- Frictionless capture and planning; low cognitive load.
- Reliable day boundary semantics; operations are idempotent and safe.
- Accessibility first: Dynamic Type, ≥44pt hit targets, VoiceOver labels.

Primary surfaces

- **Today Tab**: Daily task and habit management with progress header and completion tracking.
- **Slate Tab**: Unscheduled task management and planning for Today.
- **History Tab**: Calendar view with day details and statistics using immutable history.
- **Settings Tab**: Configuration for notifications, day start, auto‑carryover, haptics/sound, export/import.
- **Unified Modal**: Single modal for adding/editing both tasks and habits (fully implemented and integrated).

Scope boundaries (V0)

- iOS single‑device only; no cloud sync.
- Habits are daily (no custom cadence yet).
- Simple scheduling: Today vs Slate (remaining tasks) with optional due dates.
- Local notifications (UI ready, functionality placeholder); export/import (UI ready, functionality placeholder).

Delight principles

- Quick, crisp animations; minimal confetti.
- Light haptics on completion; stronger for Perfect Day.
