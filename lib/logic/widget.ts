import dayjs from "dayjs";

import { addDays } from "@/lib/logic/dates";
import type { Habit, HabitCompletion, Task } from "@/lib/logic/repo";

// What the iOS widget reads from the shared App Group. The widget can't open
// the database or run rollover, so the app hands it two precomputed days:
// `today`, and `next`, what Today will look like right after the next rollover.
// Keep in sync with targets/widget/Snapshot.swift.
export const WIDGET_SNAPSHOT_VERSION = 1;

export interface WidgetTask {
  title: string;
  // Due on or before this day
  isDue: boolean;
}

export interface WidgetDay {
  date: string;
  habitsTotal: number;
  habitsDone: number;
  pendingHabits: string[];
  tasksTotal: number;
  tasksDone: number;
  pendingTasks: WidgetTask[];
}

export interface WidgetSnapshot {
  version: number;
  // Epoch ms
  generatedAt: number;
  // Epoch ms when `next` takes over (the next day start)
  rolloverAt: number;
  today: WidgetDay;
  next: WidgetDay;
}

// The widget shows a handful at a time; this just bounds the payload
const MAX_ITEMS = 30;

// Due or overdue first (earliest due date first), otherwise keep Today's order
function orderPending(tasks: Task[], date: string): WidgetTask[] {
  return tasks
    .map((task, index) => ({ task, index, isDue: !!task.dueDate && task.dueDate <= date }))
    .sort((a, b) => {
      if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
      if (a.isDue && a.task.dueDate !== b.task.dueDate) {
        return a.task.dueDate! < b.task.dueDate! ? -1 : 1;
      }
      return a.index - b.index;
    })
    .slice(0, MAX_ITEMS)
    .map(({ task, isDue }) => ({ title: task.title, isDue }));
}

export function buildWidgetSnapshot(input: {
  today: string;
  dayStart: string; // HH:mm
  todayTasks: Task[];
  activeHabits: Habit[];
  todaysHabitCompletions: HabitCompletion[];
  openTasks: Task[]; // every open task (the Slate list)
  now?: Date;
}): WidgetSnapshot {
  const { today, dayStart, todayTasks, activeHabits, todaysHabitCompletions, openTasks } = input;
  const now = input.now ?? new Date();
  const nextDate = addDays(today, 1);

  const doneHabitIds = new Set(todaysHabitCompletions.map((c) => c.habitId));
  const pendingTodayTasks = todayTasks.filter((t) => t.status === "open");

  // After rollover: unfinished Today tasks carry over, and tasks planned for
  // or due by the new day join them. Every habit starts undone.
  const nextTasks = openTasks.filter(
    (t) =>
      (!!t.scheduledFor && t.scheduledFor <= nextDate) ||
      (!!t.dueDate && t.dueDate <= nextDate)
  );

  const [hour, minute] = dayStart.split(":").map(Number);
  const rolloverAt = dayjs(nextDate).hour(hour).minute(minute).second(0).millisecond(0);

  return {
    version: WIDGET_SNAPSHOT_VERSION,
    generatedAt: now.getTime(),
    rolloverAt: rolloverAt.valueOf(),
    today: {
      date: today,
      habitsTotal: activeHabits.length,
      habitsDone: activeHabits.filter((h) => doneHabitIds.has(h.id)).length,
      pendingHabits: activeHabits
        .filter((h) => !doneHabitIds.has(h.id))
        .slice(0, MAX_ITEMS)
        .map((h) => h.title),
      tasksTotal: todayTasks.length,
      tasksDone: todayTasks.length - pendingTodayTasks.length,
      pendingTasks: orderPending(pendingTodayTasks, today),
    },
    next: {
      date: nextDate,
      habitsTotal: activeHabits.length,
      habitsDone: 0,
      pendingHabits: activeHabits.slice(0, MAX_ITEMS).map((h) => h.title),
      tasksTotal: nextTasks.length,
      tasksDone: 0,
      pendingTasks: orderPending(nextTasks, nextDate),
    },
  };
}
