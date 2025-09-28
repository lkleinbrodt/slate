System Patterns

Architecture

- Local‑first single‑device app with SQLite as the system of record and expo-sqlite/kv-store for prefs/meta.
- Expo + React Native with expo‑router; Zustand for UI/state slices; Repository pattern wrapping SQLite.
- Clock utility centralizes day boundary logic using dayjs.

Data model (high‑level)

- `tasks(id, title, notes, due_date, scheduled_for, completed_at, status, depends_on_task_id, created_at, updated_at)` - **Status-based completion with dependencies**
- `habits(id, title, notes, is_active, created_at, updated_at)` - **Simplified active field**
- `habit_completions(id, habit_id, date, completed_at)` with UNIQUE(habit_id, date) - **Live state for current day**
- `habit_history(id, date, habit_id, completed)` with UNIQUE(date, habit_id) - **Immutable history**
- `task_history(id, date, task_id, planned, completed)` with UNIQUE(date, task_id) - **Immutable history**
- `app_settings(key, value)` - **Key-value storage for preferences**

Note: Habits are inherently daily and not planned via day_plan_items. Only tasks are planned. Habits for Today are derived as all active habits; completion state is stored in `habit_completions` with immutable history in `habit_history`.

Core flows

1. App start/resume

   - Initialize database with new schema
   - Load settings from `app_settings` table
   - Process rollover using expo-sqlite/kv-store for last processed date
   - Initialize app store with Today and Slate data

2. Daily workflow

   - **Today Tab**: View and complete scheduled tasks and all active habits
   - **Slate Tab**: Manage unscheduled tasks and plan for Today
   - **History Tab**: View past days with immutable history data
   - **Settings Tab**: Configure preferences and app behavior

3. Task management

   - Create task → insert into `tasks` with status 'open'
   - Plan for Today → set `scheduled_for` to today's date
   - Complete task → set `status` to 'done' and `completed_at` timestamp
   - Send back to Slate → set `scheduled_for` to null

4. Habit management

   - Create habit → insert into `habits` with `is_active` true
   - Complete habit → insert into `habit_completions` for today
   - Undo completion → delete from `habit_completions`
   - Streak calculation → query `habit_history` for consecutive completions

5. Rollover process

   - Check last processed date from expo-sqlite/kv-store
   - For each day since last processed:
     - Create immutable history records in `habit_history` and `task_history`
     - Carry over unfinished tasks to next day
     - Update last processed date

6. History and analytics
   - Calendar view → query `habit_history` and `task_history` for month
   - Day details → join history tables with current task/habit data
   - Statistics → aggregate from immutable history tables
   - Streak calculation → query `habit_history` for consecutive completions

Patterns & decisions

- **Repository Pattern**: Single interface (`lib/logic/repo.ts`) for all database operations
- **Immutable History**: Complete audit trail in `habit_history` and `task_history` tables
- **Status-Based Tasks**: Use `status` field instead of boolean `is_done`
- **Unified Storage**: expo-sqlite/kv-store for both relational and key-value data
- **Type Safety**: Drizzle ORM provides full TypeScript integration
- **Idempotency**: Completion toggles and planning operations are safe to repeat
- **Transactions**: Multi-step operations wrapped in database transactions
- **Performance**: Granular store selectors and optimized queries

Sorting rules

- Slate (unscheduled tasks) sorted by due date ascending; undated tasks appear after dated tasks
- Today tasks sorted by creation order
- Habits sorted by creation order
- History data sorted by date descending

Navigation tree (expo‑router)

- **Four-Tab Navigation**: `app/(tabs)/` directory structure
  - **Today**: `app/(tabs)/today.tsx` (daily task and habit management)
  - **Slate**: `app/(tabs)/index.tsx` (unscheduled task management)
  - **History**: `app/(tabs)/history.tsx` (calendar view and day details)
  - **Settings**: `app/(tabs)/settings.tsx` (configuration and preferences)
- **Dynamic Routes**: `app/(tabs)/history/[date].tsx` (day details screen) - **NOT IMPLEMENTED** (uses ActionSheet instead)
- **Modal**: `app/modal.tsx` (placeholder for future modals)
- **ActionSheets**: `components/AddEditModal.tsx` (fully implemented add/edit modal)

Error handling

- **Database Errors**: Wrapped in try-catch with proper error messages
- **Rollover Failures**: Non-blocking, logged but don't prevent app startup
- **Component Errors**: Graceful degradation with error boundaries
- **Type Safety**: Drizzle ORM prevents runtime type errors

UI/Component usage

- **Repository Integration**: All components use repository pattern for data access
- **Immutable History**: History components use immutable data for reliability
- **Status-Based Completion**: TaskItem uses `task.status === "done"` for completion state
- **Read-Only Mode**: TaskItem and HabitItem support `isReadOnly` prop for history views
- **Calendar Integration**: `react-native-calendars` with custom theming for history
- **Safe Area Handling**: `SafeAreaThemedView` component provides proper safe area support
- **Tab Navigation**: Clean tab bar with Ionicons (checkmark-circle-outline, list-outline, calendar-outline, settings-outline)
- **Modular Components**: Planner components (PlannerHeader, TodayTasksSection, HabitsSection, SlateSection)
