// Dev-only demo data, so every screen can be seen full in the simulator.
// Replaces all tasks, habits and history; settings are left alone.
import {
  habitCompletions,
  habitHistory,
  habits,
  taskHistory,
  tasks,
} from "@/lib/db/schema";

import { addDays } from "@/lib/logic/dates";
import { db } from "@/lib/db/connection";
import dayjs from "dayjs";
import { randomUUID } from "expo-crypto";

const HABITS = [
  { title: "Morning pages", rate: 0.9, recentRun: 23 },
  { title: "Stretch for 10 minutes", rate: 0.8, recentRun: 9 },
  { title: "Read 20 pages", rate: 0.75, recentRun: 4 },
  { title: "Two litres of water", rate: 0.85, recentRun: 15 },
  { title: "Phone away by 10pm", rate: 0.6, recentRun: 0 },
];

const PAST_TASK_TITLES = [
  "Reply to Sam about the cabin",
  "Pay electricity bill",
  "Book dentist",
  "Grocery run",
  "Draft Q4 goals",
  "Fix the squeaky door",
  "Call Mom",
  "Return library books",
  "Renew passport photos",
  "Clean out the fridge",
  "Send invoice #24",
  "Water the plants",
  "Plan weekend hike",
  "Update resume",
];

// A small deterministic PRNG so the demo looks the same every time
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export async function seedDemoData(today: string) {
  const rand = rng(42);
  const iso = (date: string, hour = 9) =>
    dayjs(date).hour(hour).minute(Math.floor(rand() * 60)).toISOString();
  const longAgo = addDays(today, -90);

  await db.delete(habitCompletions);
  await db.delete(habitHistory);
  await db.delete(taskHistory);
  await db.delete(habits);
  await db.delete(tasks);

  // Habits, with ~75 days of history
  const habitRows = HABITS.map((h) => ({
    id: randomUUID(),
    title: h.title,
    notes: null,
    isActive: true,
    createdAt: iso(longAgo),
    updatedAt: iso(longAgo),
  }));
  await db.insert(habits).values(habitRows);

  const historyRows: (typeof habitHistory.$inferInsert)[] = [];
  for (let back = 75; back >= 1; back--) {
    const date = addDays(today, -back);
    HABITS.forEach((h, i) => {
      const inRun = back <= h.recentRun;
      const breaksRun = back === h.recentRun + 1;
      const completed = inRun || (!breaksRun && rand() < h.rate);
      historyRows.push({
        id: randomUUID(),
        date,
        habitId: habitRows[i].id,
        completed,
      });
    });
  }
  for (let i = 0; i < historyRows.length; i += 200) {
    await db.insert(habitHistory).values(historyRows.slice(i, i + 200));
  }

  // Two of today's habits already done
  await db.insert(habitCompletions).values(
    [0, 3].map((i) => ({
      id: randomUUID(),
      habitId: habitRows[i].id,
      date: today,
      completedAt: iso(today, 8),
    }))
  );

  // Past tasks, completed on their day
  const pastTasks: (typeof tasks.$inferInsert)[] = [];
  const pastTaskHistory: (typeof taskHistory.$inferInsert)[] = [];
  for (let back = 40; back >= 1; back--) {
    const date = addDays(today, -back);
    const count = Math.floor(rand() * 4);
    for (let n = 0; n < count; n++) {
      const id = randomUUID();
      const done = rand() < 0.8;
      pastTasks.push({
        id,
        title: PAST_TASK_TITLES[Math.floor(rand() * PAST_TASK_TITLES.length)],
        notes: null,
        dueDate: null,
        scheduledFor: date,
        completedAt: done ? iso(date, 15) : null,
        completedDate: done ? date : null,
        dependsOnTaskId: null,
        createdAt: iso(addDays(date, -2)),
        updatedAt: iso(date),
        status: done ? "done" : "archived",
      });
      pastTaskHistory.push({
        id: randomUUID(),
        date,
        taskId: id,
        planned: true,
        completed: done,
      });
    }
  }
  for (let i = 0; i < pastTasks.length; i += 100) {
    await db.insert(tasks).values(pastTasks.slice(i, i + 100));
  }
  for (let i = 0; i < pastTaskHistory.length; i += 200) {
    await db.insert(taskHistory).values(pastTaskHistory.slice(i, i + 200));
  }

  // Today, the Slate, and the days ahead
  const task = (
    title: string,
    opts: {
      scheduledFor?: string | null;
      dueDate?: string | null;
      done?: boolean;
      notes?: string;
    } = {}
  ): typeof tasks.$inferInsert => ({
    id: randomUUID(),
    title,
    notes: opts.notes ?? null,
    dueDate: opts.dueDate ?? null,
    scheduledFor: opts.scheduledFor ?? null,
    completedAt: opts.done ? iso(today, 10) : null,
    completedDate: opts.done ? today : null,
    dependsOnTaskId: null,
    createdAt: iso(addDays(today, -3)),
    updatedAt: iso(addDays(today, -1)),
    status: opts.done ? "done" : "open",
  });

  await db.insert(tasks).values([
    task("Finish the slide deck for Thursday", {
      scheduledFor: today,
      dueDate: addDays(today, 2),
      notes: "Focus on the roadmap section",
    }),
    task("Pick up dry cleaning", { scheduledFor: today }),
    task("Renew car registration", {
      scheduledFor: today,
      dueDate: addDays(today, -1),
    }),
    task("Email landlord about the heater", { scheduledFor: today, done: true }),
    task("30 minute run", { scheduledFor: today, done: true }),
    task("Order a birthday gift for Priya", {
      scheduledFor: addDays(today, 1),
      dueDate: addDays(today, 4),
    }),
    task("Prep for 1:1 with Jordan", { scheduledFor: addDays(today, 1) }),
    task("Deep clean the kitchen", { scheduledFor: addDays(today, 3) }),
    task("Research standing desks"),
    task("Organise photo library", { notes: "Start with 2024" }),
    task("Learn to make sourdough"),
    task("Write thank-you notes", { dueDate: addDays(today, 6) }),
    task("Plan the Lisbon trip"),
    task("Sell the old bike"),
  ]);
}
