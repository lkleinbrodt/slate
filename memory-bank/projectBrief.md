Slate – Local‑First iOS App (Expo + React Native)

Owner: Landon
Platform: iOS (single device)
Approach: Local‑first (no backend) using SQLite + expo-sqlite/kv-store
Design vibe: Playful minimal — approachable, warm, clean layout with gentle color, micro‑animations, and delightful haptics

⸻

1. Product Overview

Slate is a personal productivity app that makes it effortless to see everything on your plate, and equally easy to decide: what should I do today vs later?

It combines a clean to‑do list with simple habit tracking and a lightweight daily planning flow. Inspired by Cal Newport’s daily scheduling, Slate helps you:
• Quickly capture tasks and habits.
• Each morning, review and mark which ones belong to today.
• Enjoy a playful, satisfying moment when checking them off.
• Track streaks for habits and celebrate “Perfect Days” when everything is done.

Slate is minimal but friendly: no overwhelming features, just the essentials for clarity and momentum. The vibe is less corporate planner, more personal companion—something you’ll want to open every morning.

Elevator Pitch

Slate helps you keep track of all your tasks and habits in one place, and makes it simple to decide which ones you should tackle today. It’s like a lightweight daily slate you can trust—check things off, keep streaks alive, and roll forward what you don’t finish. A calm, playful tool to keep life’s moving pieces in order.

⸻

2. Core Concepts & Definitions
   • Task: One‑off item. Optional due date. Optional scheduled date. Can be added to “Today”.
   • Habit: Repeating behavior (daily in V0). Completion is per‑day with streaks.
   • Day Plan: The set of tasks chosen for a specific date (usually today). Habits are inherently daily and always appear in Today.
   • Perfect Day: A day when all active habits are completed (habits are not planned, they are always part of Today).
   • Carryover: Unfinished Today tasks auto‑bump to tomorrow (configurable).
   • Day Start: Configurable boundary for streaks and day rollover (default midnight, recommend 4am).

⸻

3. User Stories
   1. Capture: As a user, I can quickly add a task (“Call dentist”) or a habit (“Stretch”).
   2. Plan AM: Each morning, I see all tasks/habits and mark a subset as “Today”; I can snooze tasks to another date.
   3. Do: During the day, I check off Today items and feel a little “win” (haptic + micro‑confetti).
   4. Streaks: When I complete a habit for the day, the streak increments; app shows habit streaks and perfect‑day count.
   5. Rollover: When the new day starts, unfinished Today tasks carry over to the next day if auto‑carryover is ON.
   6. Reminders: I receive one daily nudge for habits and optional reminders on due‑date tasks.
   7. Backup: I can export/import data as JSON via the Files app.

⸻

4. Information Architecture & Navigation
   • **Single Page Design**: Main screen combines Today, All, and Settings functionality
   • **Main Screen**: Progress header, Today's Tasks (explicitly selected), Today's Habits (all active), Slate (remaining tasks)
   • **Settings**: Accessible via gear icon in header - notifications, day start, auto‑carryover toggle, sounds/haptics, export/import
   • **Unified Modal**: Single modal for adding/editing both tasks and habits

Current Routing (expo‑router):

/app
├── index.tsx // Main screen (Today + All + Slate)
├── settings.tsx // Settings screen
├── modal.tsx // Modal placeholder
└── \_layout.tsx // Root layout with initialization

⸻

5. Visual Design & Interaction Guidelines (Playful Minimal)
   • Typography & spacing: Generous line height, white space, large tappable rows (min 44pt height).
   • Color: Soft neutral background with one playful accent (e.g., teal or coral) for progress and confirmations.
   • States: Clear empty states with short, friendly copy (e.g., “Pick 3 things for today”).
   • Motion: Use small, crisp micro‑animations on check‑off; avoid heavy, long animations.
   • Haptics: Light impact on completion; slightly stronger for Perfect Day.
   • Confetti: Minimal and quick; avoid clutter.
   • Accessibility: Dynamic type supported; VoiceOver labels for buttons, checkboxes, and progress.

⸻

6. Detailed Functional Requirements

6.1 Tasks
• Create/edit/delete tasks with: title (required), notes (optional), due_date (optional).
• Mark task is_done; capture done_at timestamp.
• Add/remove task to/from Today via "Add to Today" button.
• Edit tasks by tapping on them in any list.
• Tasks not in Today appear in "Slate" section, sorted by due date.

6.2 Habits
• Create/edit/delete habits: title (required), notes (optional), active (bool).
• Habits are daily by default and always appear in Today (no planning required).
• Complete habit for a date with one tap; updates habit_completions.
• Streak: computed over consecutive completion days based on Day Start boundary. Display current streak with fire emoji badge.
• Edit habits by tapping on them in any list.

6.3 Day Plan
• For a given date D, the plan may contain any number of tasks.
• “Add to Today” adds a Day Plan entry for today; removing it is non‑destructive.
• Habits are not part of day_plan_items; they are inherently part of Today when active.
• Perfect Day toggles true when all active habits have a completion entry for date D.

6.4 Scheduling & Carryover
• Minimal scheduling: Today vs Not Today, with ability to set scheduled_for date on tasks.
• Auto‑carryover (default ON): any Today tasks not completed by next Day Start move forward to tomorrow’s Day Plan.

6.5 Notifications (Local Only) - **PLACEHOLDER IMPLEMENTED**
• Settings UI for notification preferences is complete.
• Actual notification functionality is not yet implemented (placeholder).
• Planned: Habits daily reminder, task due-date reminders via expo-notifications.

6.6 Delight on Completion
• On checking a task or habit: success haptic + checkmark morph + tiny confetti.
• On achieving Perfect Day: celebratory haptic + compact confetti + toast/modal.

6.7 Settings
• Day Start time (default 12:00 AM; recommend 4:00 AM).
• Auto‑carryover toggle.
• Habit reminder time; evening nudge toggle.
• Task due‑date reminder time; Today reminder toggle.
• Sounds/haptics toggles; theme.
• Export/Import controls.

6.8 Backup (Export/Import) - **PLACEHOLDER IMPLEMENTED**
• Settings UI for export/import is complete.
• Actual export/import functionality is not yet implemented (placeholder).
• Planned: JSON snapshot export to Files app, import with validation and transaction safety.

⸻

7. Data Model (SQLite) - Schema V2

Store day‑logic dates as local dates YYYY-MM-DD (e.g., 2025-09-22) and timestamps as ISO with TZ (e.g., 2025-09-22T15:04:05-07:00).

Tables

meta
• key TEXT PRIMARY KEY
• value TEXT
• Keys: schema_version, last_open_date, day_start (e.g., 04:00), installed_at

tasks (V2 Enhanced)
• id TEXT PRIMARY KEY
• title TEXT NOT NULL
• notes TEXT
• due_date TEXT – ISO date, nullable
• scheduled_for TEXT – ISO date, nullable
• is_done INTEGER NOT NULL DEFAULT 0
• done_at TEXT – ISO datetime, nullable
• created_at TEXT NOT NULL
• updated_at TEXT NOT NULL
• archived INTEGER NOT NULL DEFAULT 0
• depends_on_task_id TEXT – FK → tasks.id (task dependencies)

habits
• id TEXT PRIMARY KEY
• title TEXT NOT NULL
• notes TEXT
• active INTEGER NOT NULL DEFAULT 1
• reminder_time TEXT – HH:mm, nullable
• created_at TEXT NOT NULL
• updated_at TEXT NOT NULL

habit_completions
• id TEXT PRIMARY KEY
• habit_id TEXT NOT NULL – FK → habits.id (enforced in app layer)
• date TEXT NOT NULL – ISO date (local day)
• completed_at TEXT NOT NULL
• UNIQUE (habit_id, date)

day_plan
• date TEXT PRIMARY KEY – ISO date (local day)
• perfect_day INTEGER NOT NULL DEFAULT 0

day_plan_items
• id TEXT PRIMARY KEY
• date TEXT NOT NULL
• entity_type TEXT NOT NULL CHECK(entity_type IN ('task','habit'))
• entity_id TEXT NOT NULL
• UNIQUE(date,entity_type,entity_id)

activity_log (V2 New)
• id TEXT PRIMARY KEY
• timestamp TEXT NOT NULL – ISO datetime with timezone
• entity_type TEXT NOT NULL CHECK(entity_type IN ('task','habit'))
• entity_id TEXT NOT NULL
• action_type TEXT NOT NULL
• details TEXT – JSON object with action-specific data

day_snapshots (V2 New)
• date TEXT PRIMARY KEY – ISO date (local day)
• day_plan_tasks TEXT – JSON array of Task objects
• slate_tasks TEXT – JSON array of Task objects
• habits TEXT – JSON array of all active Habit objects
• completed_task_ids TEXT – JSON array of task IDs completed on this day
• completed_habit_ids TEXT – JSON array of habit IDs completed on this day

Suggested Indexes
• CREATE INDEX idx_tasks_due ON tasks(due_date);
• CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_for);
• CREATE INDEX idx_hc_habit_date ON habit_completions(habit_id, date);
• CREATE INDEX idx_dpi_date ON day_plan_items(date);
• CREATE INDEX idx_activity_log_entity ON activity_log(entity_id, timestamp); (V2)

Schema Versioning
• meta.schema_version starts at 1, now at 2.
• Migrations are applied at app start within a single transaction; bump version after success.
• V2 adds: task dependencies, activity logging, day snapshots.

⸻

8. State & Architecture
   • State mgmt: Zustand with granular selectors for performance. DB is source of truth for data.
   • Data Access Layer (DAL): Drizzle ORM with type-safe SQLite operations.
   • Clock & boundary: Clock utility centralizes day calculations using dayjs.
   • **Architecture**: Single-page design with unified modal for add/edit operations.
   • **Performance**: React.useMemo for expensive calculations, granular store subscriptions.

DAL (example function signatures)

// tasks
addTask(input: { title: string; notes?: string; dueDate?: LocalDate; scheduledFor?: LocalDate }): Promise<Task>
updateTask(id: ID, patch: Partial<EditableTaskFields>): Promise<Task>
planTaskForDate(taskId: ID, date: LocalDate): Promise<void>
unplanTaskForDate(taskId: ID, date: LocalDate): Promise<void>
completeTask(taskId: ID, completed: boolean, now: DateTime): Promise<void>
getTasks(filter: TaskFilter): Promise<Task[]> // filter supports All/Scheduled/DueSoon/Completed

// habits
addHabit(input: { title: string; notes?: string; reminderTime?: HHmm }): Promise<Habit>
updateHabit(id: ID, patch: Partial<EditableHabitFields>): Promise<Habit>
completeHabitForDate(habitId: ID, date: LocalDate, now: DateTime): Promise<void>
getHabitStreak(habitId: ID, today: LocalDate): Promise<number>

// day plan
getDayPlan(date: LocalDate): Promise<DayPlan>
addToDay(date: LocalDate, entity: EntityRef): Promise<void>
removeFromDay(date: LocalDate, entity: EntityRef): Promise<void>
computePerfectDay(date: LocalDate): Promise<boolean>

// meta
getMeta(key: string): Promise<string | null>
setMeta(key: string, value: string): Promise<void>

App Lifecycle Hooks
• On app start/resume: 1. Read last_open_date; if date boundary crossed, run rollover. 2. Update last_open_date to today. 3. Refresh notifications (habits & due‑date tasks).

⸻

9. Algorithms & Pseudocode

9.1 Day Boundary & Today Calculation

function localToday(dayStartHHmm: string, now: DateTime): LocalDate {
const start = now.set({ hour: HH(dayStart), minute: mm(dayStart), second:0, millisecond:0 });
return now >= start ? now.toLocalDate() : now.minus({ days: 1 }).toLocalDate();
}

9.2 Rollover (Auto‑carryover)

function rolloverIfNeeded() {
const today = localToday(cfg.dayStart, now());
const lastOpen = getMeta('last_open_date');
if (!lastOpen || lastOpen === today) return;

const yday = dateFrom(lastOpen);
const unfinished = queryDayPlanTasks(yday).filter(t => !t.is_done);
if (cfg.autoCarryover) {
ensureDayPlan(today);
unfinished.forEach(t => addToDay(today, { type:'task', id: t.id }));
}
setMeta('last_open_date', today);
}

9.3 Habit Streak

function computeStreak(habitId: ID, today: LocalDate): number {
// Walk back from today while completion exists for each day
let streak = 0; let d = today;
while (existsCompletion(habitId, d)) { streak++; d = prevDay(d); }
return streak;
}

9.4 Perfect Day

function isPerfectDay(date: LocalDate): boolean {
const activeHabits = getActiveHabits();
if (activeHabits.length === 0) return false;
return activeHabits.every(h => existsCompletion(h.id, date));
}

9.5 Notifications Scheduling (Local)

function scheduleDailyHabitReminder(timeHHmm: string) {
cancelAll('habit_daily');
scheduleLocal({ id:'habit_daily', time: timeHHmm, repeats:'day' });
}

function scheduleDueDateReminders() {
cancelAll('task*due');
getTasks({ dueSoon:true }).forEach(t => {
if (!t.is_done && t.due_date) scheduleLocal({ id:`task_due*${t.id}`, date: t.due_date, time: cfg.taskReminderHHmm });
});
}

⸻

10. Notifications – UX & Permissions
    • Request notification permission at first need (habit reminder setup or due‑date toggle) with clear rationale.
    • Settings list displays current permission status; provide link to iOS Settings if denied.
    • All scheduled notifications should be re‑created on app start/resume (idempotent).
    • Quiet hours respected by user choice (optional V0.1).

⸻

11. Animations, Haptics, and Delight
    • Libraries: react-native-reanimated, react-native-gesture-handler, optional lottie-react-native for confetti; expo-haptics.
    • Task/Habit check‑off:
    • Checkbox morph: scale 0.95 → 1; stroke → fill; ~200ms.
    • Haptic: Haptics.impactAsync(Light).
    • Confetti: sparse burst (~400–600ms), off by default in Low Power Mode.
    • Perfect Day: modal or toast with small celebratory animation; Haptic Success.

⸻

12. Error Handling & Edge Cases
    • Transactions: wrap multi‑step writes (import, rollover) in a single transaction.
    • Idempotent ops: completion toggles and add/remove to Day Plan should be safe to repeat.
    • DST changes: Day Start boundary logic uses local wall‑clock; store local dates, not UTC‑derived dates.
    • Deletions: Deleting a habit keeps habit_completions (historical analytics); mark habit inactive instead for soft removal.
    • Force close during write: journaled SQLite avoids corruption; still, prefer transaction.

⸻

13. Export/Import Contract (JSON)

File name: Slate-YYYYMMDD.json
Top‑level:

{
"schema_version": 1,
"exported_at": "2025-09-22T15:04:05-07:00",
"meta": { "day_start": "04:00" },
"tasks": [ {"id":"…","title":"…","due_date":"2025-09-25",…} ],
"habits": [ {"id":"…","title":"…","active":true,…} ],
"habit_completions": [ {"id":"…","habit_id":"…","date":"2025-09-22",…} ],
"day_plan": [ {"date":"2025-09-22","perfect_day":1} ],
"day_plan_items": [ {"id":"…","date":"2025-09-22","entity_type":"task","entity_id":"…"} ]
}

Import behavior:
• Validate schema_version.
• Begin transaction → truncate tables → insert payload → commit.
• Rebuild derived flags (e.g., recompute perfect_day for last N days or leave as provided).

⸻

14. Tech Stack & Libraries
    • Framework: Expo (SDK 54)
    • Navigation: expo-router (four-tab navigation: Today, Slate, History, Settings)
    • DB: expo-sqlite with Drizzle ORM; expo-sqlite/kv-store for prefs (unified storage)
    • Dates: dayjs
    • State: zustand with granular selectors
    • Animations: react-native-reanimated, react-native-gesture-handler, lottie-react-native
    • Haptics: expo-haptics
    • Notifications: expo-notifications (UI ready, functionality placeholder)
    • File access: expo-file-system, expo-document-picker (UI ready, functionality placeholder)
    • Styling: Custom StyleSheet with shared utilities; supports light/dark
    • Icons: @expo/vector-icons
    • Testing: Jest + @testing-library/react-native (not yet implemented)

⸻

15. Settings Defaults
    • Day Start: 04:00
    • Auto‑carryover: ON
    • Habit daily reminder: 08:00
    • Evening nudge (if incomplete): 19:00 (optional toggle OFF by default)
    • Task due‑date reminder time: 09:00
    • Today reminder: OFF by default
    • Haptics: ON; Sound: OFF

⸻

16. UI Components (Sketch)
    • TaskRow: title, optional badge (due/scheduled), checkbox, swipe actions (Snooze +1d/+1w, Edit, Delete).
    • HabitRow: title, streak chip, daily checkbox, long‑press to view history.
    • ProgressHeader (Today): N of M done; playful progress bar with accent color.
    • PlannerList (Plan): sections for Unscheduled, Scheduled (by date proximity), and Habits.
    • DatePill: compact date selector for scheduling.
    • EmptyState: friendly copy + CTA to add items.

⸻

17. Accessibility & Internationalization
    • Support Dynamic Type scaling; ensure touch targets ≥44pt.
    • VoiceOver labels for checkboxes and progress metrics.
    • Local date formats; future‑proof for i18n (copy stored centrally), but English only in V0.

⸻

18. Analytics (Local Only)
    • Optional local counters (no remote): number of tasks completed, streak highs, perfect days.
    • Shown on a simple Stats card in Settings (or upcoming Stats screen V0.1).

⸻

19. Security & Privacy
    • All data on device. No third‑party network calls.
    • Optional passcode/FaceID gate for opening app (V0.1; expo-local-authentication).
    • Respect iOS privacy guidelines for notifications.

⸻

20. Performance
    • List virtualization for Items/Today lists.
    • Batched DB reads; parameterized queries; indices as above.
    • Avoid heavy re‑renders; co-locate store slices.
    • Confetti disabled if Reduce Motion/Low Power Mode is detected.

⸻

21. Testing Plan
    • Unit: Clock utilities, streak computation, perfect-day check, rollover logic, DAL operations.
    • Integration: Morning plan → Today → rollover; export/import round‑trip.
    • UI: Checklist interactions, swipe actions, permission prompts mocked.
    • Manual QA: DST transition day; changing Day Start from 12am → 4am; mass import/export; denial of notification permission.

⸻

22. Build Milestones & Acceptance Criteria

M1 – App Skeleton & DB ✅ **COMPLETE**
• Expo project, router, theme, single-page design.
• SQLite schema + migration runner with Drizzle ORM.
• DAL with core CRUD for tasks/habits.
• Acceptance: Add/edit tasks & habits persist; lists render after restart.

M2 – Plan & Today ✅ **COMPLETE**
• Single-page design with Today section, Slate section, and "Add to Today" functionality.
• Progress header with visual indicators.
• Acceptance: Morning selection flows; Today reflects choices; unified interface works.

M3 – Completion & Delight ✅ **COMPLETE**
• Check‑off animations; haptics; confetti; Lottie animations.
• Perfect Day detection + modal celebration.
• Acceptance: Visual feedback works; perfect day increments when all planned habits complete.

M4 – Rollover & Streaks ✅ **COMPLETE**
• Day boundary utilities; rollover on app start/resume; habit streak computation.
• Acceptance: Unfinished Today tasks carry to next day when boundary crosses; streaks correct.

M5 – Notifications & Settings ✅ **UI COMPLETE, FUNCTIONALITY PLACEHOLDER**
• Settings toggles & times; UI for notification preferences.
• Acceptance: Toggles persist; UI ready for notification implementation.

M6 – Export/Import & Polish ⚠️ **UI COMPLETE, FUNCTIONALITY PLACEHOLDER**
• Settings UI for export/import ready; error handling; empty states.
• Acceptance: UI ready for export/import implementation; VoiceOver labels needed.

⸻

23. Future Roadmap (Post‑V0)
    • Week strip scheduling UI with drag‑to‑assign.
    • Count‑based habits (e.g., drink 8 cups water) with goals.
    • Projects/Tags + filters.
    • Stats screen (charts for streaks, completion rate).
    • Cloud sync (Supabase or CloudKit) with conflict policy.
    • Calendar integration (read/write blocks for today’s plan).
    • Siri/Shortcuts: quick add and daily briefing.

⸻

24. Glossary
    • Local date: YYYY-MM-DD using user’s Day Start boundary.
    • Entity: either a Task or Habit.
    • Today: the Day Plan for localToday(now).

⸻

Hand‑off Notes to AI Coder
• Use the routing tree and DAL signatures above as scaffolding.
• Prioritize correctness of day boundary, rollover, and streaks.
• Keep animation code minimal and performant; test with Reduce Motion ON.
• Implement export/import early to de‑risk data safety.

Done. This spec is sufficient to implement a fully working V0 of Slate on a single iOS device with Expo + React Native.
