System Patterns

Architecture

- Local‑first single‑device app with SQLite as the system of record and MMKV for prefs/meta.
- Expo + React Native with expo‑router; Zustand for UI/state slices; thin Data Access Layer (DAL) wrapping SQLite.
- Clock utility centralizes day boundary logic using dayjs/luxon.

Data model (high‑level)

- `tasks(id, title, notes, due_date, scheduled_for, is_done, done_at, created_at, updated_at, archived, depends_on_task_id)` - **V2: Added task dependencies**
- `habits(id, title, notes, active, reminder_time, created_at, updated_at)`
- `habit_completions(id, habit_id, date, completed_at)` with UNIQUE(habit_id, date)
- `day_plan(date, perfect_day)` and `day_plan_items(id, date, entity_type['task'|'habit'], entity_id)` with UNIQUE(date, entity_type, entity_id)
- `activity_log(id, timestamp, entity_type, entity_id, action_type, details)` - **V2: Complete audit trail**
- `day_snapshots(date, day_plan_tasks, slate_tasks, habits, completed_task_ids, completed_habit_ids)` - **V2: History tab support**
- `meta(key, value)` including `schema_version`, `last_open_date`, `day_start`, `installed_at`

Note: Habits are inherently daily and not planned via `day_plan_items`. Only tasks are planned. Habits for Today are derived as all active habits; completion state is stored in `habit_completions`.

Core flows

1. App start/resume

   - Read `meta.last_open_date`; compute local today via Day Start.
   - If boundary crossed, run rollover (optionally carry unfinished Today tasks forward), then set `last_open_date`.
   - Recreate scheduled local notifications (idempotent).

2. Morning planning

   - Query tasks; user marks subset for Today → insert into `day_plan_items` for today’s date.
   - Habits do not require planning; all active habits appear in Today.
   - Snooze task → set `scheduled_for` date.

3. Completion & Perfect Day

   - Task check → toggle `is_done`, set/clear `done_at`.
   - Habit check for date → insert/delete in `habit_completions` accordingly (idempotent guard).
   - Perfect Day is derived: all active habits completed for the date → set `day_plan.perfect_day`.

4. Activity Logging & Snapshots

   - Every user action logged in `activity_log` table with timestamp and details.
   - Day snapshots created automatically during rollover for history tab support.
   - Complete audit trail enables flow reconstruction and historical analysis.

5. History Tab Data Flow

   - `getCalendarViewData()`: Fetches aggregated completion data for calendar view
   - `getOverallStats()`: Retrieves key metrics (tasks completed 7d, perfect days)
   - `historyStore.ts`: Manages all history state with Zustand
   - Calendar data loaded per month for performance
   - Day snapshots provide complete historical reconstruction

6. Export/Import (single transaction)
   - Export schema‑versioned JSON including all tables.
   - Import validates version, wraps truncation+insert in a transaction, then recomputes derived flags if needed.

Patterns & decisions

- Idempotency: add/remove to Day Plan and completion toggles are safe to repeat.
- Transactions around multi‑step writes (import, rollover).
- Migrations: bump `meta.schema_version` after successful transaction.
- Indices for common queries: due/scheduled tasks, habit completion lookups, day plan items by date.
- Accessibility and performance: list virtualization, minimal re‑renders via co‑located store slices.
- **Architecture patterns**:
  - Separation of concerns: UI hooks manage presentation state, business logic lives in components
  - Performance optimization: useMemo for expensive calculations, granular store selectors
  - Code reuse: shared styles and utilities to reduce duplication
  - Clean codebase: remove unused files and consolidate common patterns

Sorting rules

- Slate (not-today tasks) are sorted by due date ascending; undated tasks appear after dated tasks.

Navigation tree (expo‑router)

- Tab Navigation: `app/(tabs)/` directory with three main tabs
  - Your Slate: `app/(tabs)/index.tsx` (Today + Slate + unified functionality)
  - History: `app/(tabs)/history.tsx` (calendar view and day details)
  - Settings: `app/(tabs)/settings.tsx` (configuration and preferences)
- Modal: `app/modal.tsx` (placeholder for future modals)
- Unified modal: `UnifiedAddModal` component for add/edit operations

Error handling

- Guard against DST boundary issues by storing local dates for day logic.
- Handle permission denials for notifications gracefully with Settings deep‑link.

UI/Component usage

- Custom date picker: `CustomDatePicker` component is used in the unified modal for selecting due dates.
- Shared styles: Common UI patterns are consolidated in `lib/utils/styles.ts` for consistency.
- Celebration system: Comprehensive animation system with `TapWin`, `CheckMorph`, and Lottie animations.
- History components: `components/history/` directory contains all history-related UI components.
- Read-only mode: TaskItem and HabitItem components support `isReadOnly` prop for history views.
- Calendar integration: `react-native-calendars` used for interactive history calendar with custom theming.
- Safe area handling: `SafeAreaThemedView` component provides proper safe area support with theming.
- Tab navigation: Clean tab bar with minimalist Ionicons (list-outline, calendar-outline, settings-outline).
