Of course. Radically simplifying a codebase, especially one with "code spaghetti," is a fantastic goal that pays dividends in maintainability, feature velocity, and developer happiness. Moving from a complex, event-sourced architecture to a more direct, state-driven model will be the cornerstone of this cleanup.

Here is an extremely detailed, step-by-step plan to refactor and simplify the Slate application.

### Guiding Principles

1.  **Single Source of Truth:** All application data (tasks, habits) will live in a single, unified Zustand store that directly reflects the database state.
2.  **Direct Data Flow:** Components will read data directly from the store. Callbacks and prop-drilling will be minimized.
3.  **Embrace Simplicity:** The event-sourcing pattern is overkill for this application. We will replace it with a standard Create, Read, Update, Delete (CRUD) model, which is easier to understand and manage.
4.  **Consolidate & Reuse:** Unify duplicated logic, merge scattered styles, and standardize common UI patterns like modals and lists.
5.  **Leverage the Framework:** Use Expo Router's features, like typed routes for navigation, to replace complex modal logic where appropriate.

---

## Phase 1: Foundational Refactoring (Data & State Management)

This is the most critical phase. By simplifying the data layer and state management first, we create a solid foundation that will make all subsequent UI refactoring trivial.

### Step 1.1: Simplify the Database Schema

The current schema uses an `events` table, which is the core of the complexity. We will replace it with simple `tasks` and `habits` tables.

- **Action:** Modify `lib/db/schema.ts`.
- **Details:** Delete the `events` table definition and create new tables for `tasks` and `habits`. We will also add a `habit_completions` table to track history for streak calculations.

**File to Edit: `lib/db/schema.ts`**

```typescript
// lib/db/schema.ts

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Meta table for app configuration and state (kept)
export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// NEW: Tasks Table
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  notes: text("notes"),
  dueDate: text("due_date"), // YYYY-MM-DD format
  isToday: integer("is_today", { mode: "boolean" }).default(false),
  isDone: integer("is_done", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// NEW: Habits Table
export const habits = sqliteTable("habits", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// NEW: Habit Completions Table (for streaks and history)
export const habitCompletions = sqliteTable("habit_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  habitId: text("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type NewHabitCompletion = typeof habitCompletions.$inferInsert;

// DELETE: The old 'events' table
// export const events = sqliteTable(...)
```

### Step 1.2: Refactor the Data Access Layer (DAL)

The DAL will now contain simple CRUD functions for our new tables instead of event-related functions.

- **Action:** Rewrite `lib/db/dal.ts`.
- **Details:** Implement functions like `getAllTasks`, `createTask`, `updateTask`, `deleteTask`, etc.

**File to Edit: `lib/db/dal.ts`**

```typescript
// lib/db/dal.ts

import { db } from "./connection";
import * as schema from "./schema";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

// --- Task Functions ---
export const getAllTasks = () =>
  db.select().from(schema.tasks).orderBy(desc(schema.tasks.createdAt));
export const createTask = (
  data: Omit<schema.NewTask, "id" | "createdAt" | "updatedAt">
) => {
  const id = randomUUID();
  return db
    .insert(schema.tasks)
    .values({ ...data, id, createdAt: new Date(), updatedAt: new Date() })
    .returning();
};
export const updateTask = (id: string, data: Partial<schema.NewTask>) => {
  return db
    .update(schema.tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.tasks.id, id))
    .returning();
};
export const deleteTask = (id: string) =>
  db.delete(schema.tasks).where(eq(schema.tasks.id, id));

// --- Habit Functions ---
export const getAllHabits = () =>
  db.select().from(schema.habits).orderBy(desc(schema.habits.createdAt));
export const createHabit = (
  data: Omit<schema.NewHabit, "id" | "createdAt">
) => {
  const id = randomUUID();
  return db
    .insert(schema.habits)
    .values({ ...data, id, createdAt: new Date() })
    .returning();
};
export const updateHabit = (id: string, data: Partial<schema.NewHabit>) =>
  db
    .update(schema.habits)
    .set(data)
    .where(eq(schema.habits.id, id))
    .returning();
export const deleteHabit = (id: string) =>
  db.delete(schema.habits).where(eq(schema.habits.id, id));

// --- Habit Completion Functions ---
export const getHabitCompletions = (habitId: string) =>
  db
    .select()
    .from(schema.habitCompletions)
    .where(eq(schema.habitCompletions.habitId, habitId));
export const getAllHabitCompletions = () =>
  db.select().from(schema.habitCompletions);
export const addHabitCompletion = (habitId: string, date: string) =>
  db.insert(schema.habitCompletions).values({ habitId, date });
export const removeHabitCompletion = (habitId: string, date: string) =>
  db
    .delete(schema.habitCompletions)
    .where(
      and(
        eq(schema.habitCompletions.habitId, habitId),
        eq(schema.habitCompletions.date, date)
      )
    );

// --- Meta Functions (Unchanged) ---
export async function getMeta(key: string): Promise<string | null> {
  const result = await db
    .select()
    .from(schema.meta)
    .where(eq(schema.meta.key, key))
    .limit(1);
  return result[0]?.value || null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.insert(schema.meta).values({ key, value }).onConflictDoUpdate({
    target: schema.meta.key,
    set: { value },
  });
}
```

### Step 1.3: Unify Zustand Stores into a Single `useAppStore`

This is the most impactful change. We will merge `slateStore` and `historyStore` into one store that manages the entire app's data state.

- **Action:** Delete `lib/stores/slateStore.ts` and `lib/stores/historyStore.ts`. Create a new `lib/stores/appStore.ts`.
- **Details:** The new store will fetch all data on initialization and hold it in state. Actions in the store will call the new DAL functions and update the state directly. No more reducers or event processing.

**New File: `lib/stores/appStore.ts`**

```typescript
// lib/stores/appStore.ts

import { create } from "zustand";
import * as dal from "@/lib/db/dal";
import { Task, Habit, HabitCompletion } from "@/lib/db/schema";
import { localToday } from "@/lib/utils/clock";
import { useSettingsStore } from "./settings";

export interface AppState {
  isInitialized: boolean;
  tasks: Task[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
}

export interface AppActions {
  init: () => Promise<void>;
  createTask: (data: {
    title: string;
    notes?: string;
    dueDate?: string | null;
  }) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  toggleTaskForToday: (id: string) => Promise<void>;
  createHabit: (data: { title: string }) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (id: string, date: string) => Promise<void>;
}

const initialState: AppState = {
  isInitialized: false,
  tasks: [],
  habits: [],
  habitCompletions: [],
};

export const useAppStore = create<AppState & { actions: AppActions }>()(
  (set, get) => ({
    ...initialState,
    actions: {
      init: async () => {
        if (get().isInitialized) return;
        const [tasks, habits, habitCompletions] = await Promise.all([
          dal.getAllTasks(),
          dal.getAllHabits(),
          dal.getAllHabitCompletions(),
        ]);
        set({ tasks, habits, habitCompletions, isInitialized: true });
      },
      createTask: async (data) => {
        const [newTask] = await dal.createTask(data);
        if (newTask) {
          set((state) => ({ tasks: [newTask, ...state.tasks] }));
        }
      },
      updateTask: async (id, data) => {
        const [updatedTask] = await dal.updateTask(id, data);
        if (updatedTask) {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
          }));
        }
      },
      deleteTask: async (id) => {
        await dal.deleteTask(id);
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },
      toggleTaskCompletion: async (id: string) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const [updatedTask] = await dal.updateTask(id, {
          isDone: !task.isDone,
        });
        if (updatedTask) {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
          }));
        }
      },
      toggleTaskForToday: async (id: string) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const [updatedTask] = await dal.updateTask(id, {
          isToday: !task.isToday,
        });
        if (updatedTask) {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
          }));
        }
      },
      createHabit: async (data) => {
        const [newHabit] = await dal.createHabit(data);
        if (newHabit) {
          set((state) => ({ habits: [newHabit, ...state.habits] }));
        }
      },
      deleteHabit: async (id) => {
        await dal.deleteHabit(id);
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          habitCompletions: state.habitCompletions.filter(
            (c) => c.habitId !== id
          ),
        }));
      },
      toggleHabitCompletion: async (habitId, date) => {
        const isCompleted = get().habitCompletions.some(
          (c) => c.habitId === habitId && c.date === date
        );
        if (isCompleted) {
          await dal.removeHabitCompletion(habitId, date);
          set((state) => ({
            habitCompletions: state.habitCompletions.filter(
              (c) => !(c.habitId === habitId && c.date === date)
            ),
          }));
        } else {
          await dal.addHabitCompletion(habitId, date);
          set((state) => ({
            habitCompletions: [
              ...state.habitCompletions,
              { id: Math.random(), habitId, date },
            ],
          }));
        }
      },
    },
  })
);
```

### Step 1.4: Update App Initialization

Modify the main app initializer to use the new `useAppStore`.

- **Action:** Update `lib/app/init.ts`.
- **Details:** The rollover logic is no longer needed as there's no complex state to roll over. The init process is now much simpler.

**File to Edit: `lib/app/init.ts`**

```typescript
// lib/app/init.ts

import { initializeDatabase } from "../db/connection";
import { useSettingsStore } from "../stores/settings";
import { useAppStore } from "../stores/appStore"; // <-- NEW

export async function initializeApp() {
  try {
    await initializeDatabase();
    await useSettingsStore.getState().loadSettings();
    await useAppStore.getState().actions.init(); // <-- Use the new store
    console.log("App initialized successfully");
  } catch (error) {
    console.error("App initialization failed:", error);
    throw error;
  }
}

export function isAppReady(): boolean {
  const settingsReady = !useSettingsStore.getState().loading;
  const appReady = useAppStore.getState().isInitialized;
  return settingsReady && appReady;
}
```

---

## Phase 2: Hook and Logic Simplification

With the new store, our hooks become dramatically simpler. They will mostly be responsible for selecting data from the store and connecting UI actions to store actions.

### Step 2.1: Simplify the `usePlanner` Hook

This "god hook" can now be removed. The main screen component (`index.tsx`) will get its data and actions directly from our new `useAppStore`.

- **Action:** Delete `hooks/usePlanner.ts`.

### Step 2.2: Refactor `useHabitStreaks`

This hook can now be a pure selector that computes streaks from the state in `useAppStore`.

- **Action:** Rewrite `hooks/useHabitStreaks.ts`.
- **Details:** This becomes a clean, performant hook using `useMemo` to prevent re-calculations.

**File to Edit: `hooks/useHabitStreaks.ts`**

```typescript
// hooks/useHabitStreaks.ts

import { useMemo } from "react";
import { useAppStore } from "@/lib/stores/appStore";
import { localToday, prevDay } from "@/lib/utils/clock";

export function useHabitStreaks(dayStart: string) {
  const habits = useAppStore((s) => s.habits);
  const completions = useAppStore((s) => s.habitCompletions);

  return useMemo(() => {
    const streaks: Record<string, number> = {};
    const completionSet = new Set(
      completions.map((c) => `${c.habitId}:${c.date}`)
    );
    const today = localToday(dayStart);

    for (const habit of habits) {
      let currentStreak = 0;
      let dateToCheck = today;

      // Check if completed today
      if (completionSet.has(`${habit.id}:${dateToCheck}`)) {
        currentStreak++;
        dateToCheck = prevDay(dateToCheck);
      } else {
        // If not completed today, check starting from yesterday
        dateToCheck = prevDay(today);
      }

      // Go backwards in time
      while (completionSet.has(`${habit.id}:${dateToCheck}`)) {
        currentStreak++;
        dateToCheck = prevDay(dateToCheck);
      }
      streaks[habit.id] = currentStreak;
    }
    return streaks;
  }, [habits, completions, dayStart]);
}
```

### Step 2.3: Simplify `usePerfectDay` and `useTaskCompletion`

The logic in these hooks (haptics, celebrations) can be moved directly into the component or simplified. For this plan, we will eliminate the hooks and move the logic into the main screen component for clarity.

- **Action:** Delete `hooks/usePerfectDay.ts` and `hooks/useTaskCompletion.ts`.

---

## Phase 3: Component and UI Refactoring

Now we connect our simplified logic to the UI. The key is to have "smart" screen components that gather data and "dumb" presentational components that just render it.

### Step 3.1: Refactor the Main Screen (`index.tsx`)

This screen will now be the main consumer of our `useAppStore`, selecting all the data it needs and passing it down to its children.

- **Action:** Heavily rewrite `app/(tabs)/index.tsx`.
- **Details:** Remove `usePlanner`. Get data and actions directly from `useAppStore`. Implement completion logic (haptics, perfect day check) here.

**File to Edit: `app/(tabs)/index.tsx` (Simplified Example)**

```typescript
// app/(tabs)/index.tsx

import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { useAppStore } from "@/lib/stores/appStore";
import { useSettingsStore } from "@/lib/stores/settings";
import { localToday } from "@/lib/utils/clock";
import { useHabitStreaks } from "@/hooks/useHabitStreaks";
import * as Haptics from "expo-haptics";
import {
  PlannerHeader,
  TodayTasksSection,
  HabitsSection,
  SlateSection,
} from "@/components/planner";
import { PerfectDayModal } from "@/components/PerfectDayModal";
// ... other imports

export default function MainScreen() {
  // Get data and actions from our unified store
  const { isInitialized, tasks, habits, habitCompletions, actions } =
    useAppStore((s) => ({ ...s, actions: s.actions }));
  const dayStart = useSettingsStore((s) => s.dayStart);

  const [showPerfectDay, setShowPerfectDay] = useState(false);
  const habitStreaks = useHabitStreaks(dayStart);

  const { todayTasks, slateTasks, completedTodayTasks, completedTodayHabits } =
    useMemo(() => {
      const today = localToday(dayStart);
      return {
        todayTasks: tasks.filter((t) => t.isToday),
        slateTasks: tasks.filter((t) => !t.isToday),
        completedTodayTasks: tasks.filter((t) => t.isToday && t.isDone),
        completedTodayHabits: habits.filter((h) =>
          habitCompletions.some((c) => c.habitId === h.id && c.date === today)
        ),
      };
    }, [tasks, habits, habitCompletions, dayStart]);

  const handleCompleteTask = async (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    actions.toggleTaskCompletion(taskId);
  };

  const handleCompleteHabit = async (habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const today = localToday(dayStart);
    await actions.toggleHabitCompletion(habitId, today);

    // Check for perfect day
    const allHabitsCompleted = habits.every(
      (h) =>
        habitCompletions.some((c) => c.habitId === h.id && c.date === today) ||
        h.id === habitId
    );
    if (habits.length > 0 && allHabitsCompleted) {
      setShowPerfectDay(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // ... rest of modal logic and handlers for save/delete, simplified using `actions`

  if (!isInitialized) {
    // ... loading indicator
  }

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView>
        <PlannerHeader /* ... props */ />
        <TodayTasksSection
          tasks={todayTasks}
          completedTasks={completedTodayTasks}
          onToggle={handleCompleteTask} /* ... */
        />
        <HabitsSection
          habits={habits}
          completedHabits={completedTodayHabits}
          habitStreaks={habitStreaks}
          onToggle={handleCompleteHabit} /* ... */
        />
        <SlateSection tasks={slateTasks} /* ... */ />
      </ScrollView>
      <PerfectDayModal
        visible={showPerfectDay}
        onClose={() => setShowPerfectDay(false)}
      />
      {/* ... UnifiedAddModal ... */}
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  // ... styles
});
```

_Note: The plan is to later refactor the child components to pull their own data, but this is a good intermediate step._

### Step 3.2: Refactor the History Screen

The history screen can now derive its data directly from the main app store, making `historyStore` obsolete. For a much better user experience and simpler code, we will replace the `DayDetailsModal` with a new screen.

- **Action:** Rewrite `app/(tabs)/history.tsx`. Delete `components/history/DayDetailsModal.tsx`.
- **Details:** The history calendar will be populated by deriving stats from `useAppStore`. Clicking a day will navigate to a new screen.

**File to Edit: `app/(tabs)/history.tsx`**

```typescript
// app/(tabs)/history.tsx

import React, { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { HistoryHeader } from "@/components/history/HistoryHeader";
import { HistoryCalendar } from "@/components/history/HistoryCalendar";
import { HabitStreaksSection } from "@/components/history/HabitStreaksSection";
import { useAppStore } from "@/lib/stores/appStore";
import { useSettingsStore } from "@/lib/stores/settings";

export default function HistoryScreen() {
  const { habits, habitCompletions } = useAppStore();
  const dayStart = useSettingsStore((s) => s.dayStart);

  // Example of deriving stats. This can be expanded.
  const stats = useMemo(() => {
    return {
      perfectDayCount: 0, // This would require more complex calculation
      tasksCompletedLast7Days: 0, // This data is not easily available without tasks history
    };
  }, [habitCompletions]);

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView>
        <HistoryHeader />
        <HistoryCalendar />
        <HabitStreaksSection />
      </ScrollView>
    </SafeAreaThemedView>
  );
}
//... styles
```

### Step 3.3: Consolidate Styling

The styles are scattered between `constants/theme.ts`, `lib/utils/styles.ts`, and individual components. Let's centralize them.

- **Action:** Move all color, font, and UI constants from `lib/constants/app.ts` into `constants/theme.ts`. Refactor `lib/utils/styles.ts` to be the single source of truth for shared component styles (buttons, inputs, etc.) and remove hardcoded styles from components where possible.
- **Benefit:** This creates a mini-design system, making the app's look and feel consistent and easier to change.

---

## Phase 4: Polishing and Final Cleanup

### Step 4.1: Decouple Child Components (Optional but Recommended)

To fully eliminate prop drilling, child components like `HabitsSection` can be refactored to consume the `useAppStore` directly.

- **Action:** Refactor `components/planner/HabitsSection.tsx` and other section components.
- **Example: `HabitsSection`**

```typescript
// components/planner/HabitsSection.tsx

export const HabitsSection = () => {
  // This component now fetches its own data!
  const habits = useAppStore((s) => s.habits);
  const actions = useAppStore((s) => s.actions);
  // ... get other data needed like streaks, completions, etc.

  // The parent component no longer needs to pass any props.
  return (
    <ThemedView>
      {/* ... render habits using the fetched data and actions */}
    </ThemedView>
  );
};
```

### Step 4.2: Simplify the Celebration System

The custom animations in `components/celebration` are complex.

- **Action:** Replace `components/Confetti.tsx` with the existing `react-native-confetti-cannon` dependency for all confetti effects.

### Step 4.3: Delete Obsolete Files

The final and most satisfying step is to remove all the code we've made redundant.

- **Action:** Delete the following files and directories:
  - `lib/stores/slateStore.ts`
  - `lib/stores/historyStore.ts`
  - `lib/stores/baseStore.ts` (Our new store is simple enough not to need it)
  - `lib/stores/storeFactory.ts`
  - `hooks/usePlanner.ts`
  - `hooks/usePerfectDay.ts`
  - `hooks/useTaskCompletion.ts`
  - `components/history/DayDetailsModal.tsx`
  - Any other components or utilities that are no longer imported anywhere.

By following this detailed plan, you will transform the codebase from a complex, intertwined system into a clean, simple, and highly maintainable application. The key is the radical simplification of the data and state layer, which unlocks simplicity across the entire app.
