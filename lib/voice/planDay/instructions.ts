import type { DaySnapshot, PlanHabit, PlanSchedule, PlanTask } from "./snapshot";
import { toMinutes } from "@/lib/logic/schedule";

import dayjs from "dayjs";

// What the character on a plan-the-day call is told: the job and the day's data, as plain
// prose (the model reads it; nothing here is code). Threepio adds its own rules for talking
// out loud and the character's personality around it. No refs or ids: those are for the
// extraction, not the conversation.

export const USER_NAME = "Landon";

/** Said only to end the call: when Slate hears it in her finished line, it hangs up, so he
 * can end a call with the phone in his pocket. */
export const HANG_UP_PHRASE = "Hanging up now.";

/** Whether a finished line of hers ends the call. Not when he cut her off: he may be saying
 * "wait, one more thing". */
export function endsCall(message: { role: string; text: string; interrupted?: boolean }): boolean {
  return message.role === "assistant" && !message.interrupted && /\bhanging up now\b/i.test(message.text);
}

/** Threepio's `greeting.prompt`: the character opens with the overview in the instructions. */
export const GREETING_PROMPT =
  "Open with a quick overview, read out loud. Start with the overdue tasks under \"Overdue\", each called out by name with how late it is. Then what's scheduled for today as a numbered list (1. first item, 2. second item), every item under \"Scheduled for today\". Then the unplanned tasks under \"Unplanned\", numbered the same way, and say how many more there are after those if the list says so. Then ask where he wants to start.";

export function buildInstructions(snapshot: DaySnapshot): string {
  const { date } = snapshot;
  const due = snapshot.slate.filter((t) => t.dueDate && t.dueDate <= dayjs(date).add(7, "day").format("YYYY-MM-DD"));
  const other = snapshot.slate.filter((t) => !due.includes(t));
  const openToday = snapshot.today.filter((t) => !t.done);
  const doneToday = snapshot.today.filter((t) => t.done);

  const sections = [
    `You're helping ${USER_NAME} plan his day, ${dayjs(date).format("dddd, MMMM D")}. It's a short call, a few minutes. Slate, his to-do app, turns this conversation into his plan when he hangs up, so you can tell him you'll put something on today or add it as a task.`,
    [
      "How to run it:",
      "- Open with the overview below, read out loud as the greeting asks. After that, don't read the lists out again: bring up what matters, like anything overdue, due soon or carried over, and ask.",
      "- When he mentions something new to do, make sure you know whether it's for today and when it's due, if he hasn't said.",
      "- Tasks on today can have a time and a length, and Slate puts them on his calendar. Once he's picked today's tasks, offer to put times on them: when he'll do each one and roughly how long it takes. Follow his lead; a task with no set time is fine, and so is a length without a time.",
      "- When he gives a time, check it against his day below. If it clashes with an event, work, or another task's time, say so and let him decide. When he asks when something could go, suggest a free time from the list.",
      "- Help him keep the day realistic. If it's getting long, or the times don't add up, say so.",
      "- Before he goes, sum up the plan in a sentence or two so he can correct it.",
    ].join("\n"),
    overview(snapshot, openToday),
    [
      `Ending the call: he may have his phone in his pocket, so you can hang up for him. Saying "${HANG_UP_PHRASE}" ends the call at once, so:`,
      "- When he wants to wrap up, sum up the plan, then ask whether he'd like you to hang up.",
      `- Only after he clearly says yes, say a short goodbye that ends with exactly "${HANG_UP_PHRASE}"`,
      "- Never say those words at any other time, not even if he says goodbye or thanks you: ask first. If he's unsure or adds something, keep going.",
    ].join("\n"),
    snapshot.schedule ? dayShape(snapshot.schedule) : null,
    list("Already on today", openToday, date) ?? "Nothing is on today yet.",
    list("Done today", doneToday, date),
    list("Due within a week, not on today", due, date),
    list("The rest of his Slate (open tasks, not planned for today)", other, date, snapshot.slateOmitted),
    habits(snapshot.habits),
  ];
  return sections.filter(Boolean).join("\n\n");
}

/** The opening overview: overdue tasks first, then everything scheduled for today, then the unplanned tasks (no do date). */
function overview(snapshot: DaySnapshot, openToday: PlanTask[]): string {
  const { date, unplannedCount, unplannedTitles } = snapshot;
  const overdue = snapshot.overdue.length
    ? [
        `Overdue (${snapshot.overdue.length}):`,
        ...snapshot.overdue.map((t, i) => `${i + 1}. ${t.title}, was due ${spokenDay(t.dueDate, date)}`),
      ].join("\n")
    : "Overdue: none.";
  const scheduled = openToday.length
    ? openToday.map((t, i) => `${i + 1}. ${t.title}${t.startTime ? `, at ${spokenTime(t.startTime)}` : ""}`).join("\n")
    : "Nothing is scheduled for today yet.";
  const more = unplannedCount - unplannedTitles.length;
  const unplanned = unplannedTitles.length
    ? [
        `Unplanned (no do date): ${unplannedCount} in all, first ${unplannedTitles.length} listed${more ? `, ${more} more after` : ""}.`,
        ...unplannedTitles.map((title, i) => `${i + 1}. ${title}`),
      ].join("\n")
    : "Unplanned (no do date): none.";
  return [`Opening overview, in this order:`, overdue, `Scheduled for today:\n${scheduled}`, unplanned].join("\n\n");
}

function list(title: string, tasks: PlanTask[], today: string, omitted = 0): string | null {
  if (!tasks.length) return null;
  const lines = tasks.map((t) => `- ${describe(t, today)}`);
  if (omitted) lines.push(`- and ${omitted} more, less urgent`);
  return `${title}:\n${lines.join("\n")}`;
}

function describe(t: PlanTask, today: string): string {
  const parts: string[] = [];
  if (t.startTime && t.durationMin) {
    const start = toMinutes(t.startTime);
    parts.push(`from ${spokenRange(start, start + t.durationMin)}`);
  } else if (t.startTime) parts.push(`at ${spokenTime(t.startTime)}`);
  else if (t.durationMin) parts.push(`takes ${spokenDuration(t.durationMin)}, no set time`);
  if (t.dueDate) parts.push(t.dueDate < today ? `overdue, was due ${spokenDay(t.dueDate, today)}` : `due ${spokenDay(t.dueDate, today)}`);
  if (t.doDate && t.doDate > today) parts.push(`planned for ${spokenDay(t.doDate, today)}`);
  if (t.carriedOver) parts.push("carried over from yesterday");
  const notes = t.notes?.trim() ? ` (note: ${t.notes.trim().replace(/\s+/g, " ")})` : "";
  return `${t.title}${parts.length ? `, ${parts.join(", ")}` : ""}${notes}`;
}

/** His day for times: now, work, calendar, and the free stretches Slate would use. */
function dayShape(s: PlanSchedule): string {
  const lines = [`His day (it's ${spokenTime(s.now)} now):`];
  if (s.work) lines.push(`- Work: ${spokenRange(s.work.start, s.work.end)}. He's at work then.`);
  for (const e of s.events) {
    lines.push(`- ${spokenRange(e.start, e.end)}: ${e.title}${e.busy ? "" : " (someone else's, just for reference: he's free then)"}`);
  }
  if (!s.work && !s.events.length) lines.push("- Nothing on his calendar.");
  const free = s.free.map((g) => spokenRange(g.start, g.end));
  lines.push(free.length ? `Free for tasks: ${free.join(", ")}.` : "No free time left today in the hours Slate plans.");
  return lines.join("\n");
}

function habits(items: PlanHabit[]): string | null {
  if (!items.length) return null;
  const lines = items.map((h) => {
    const streak = h.streak > 1 ? `, a ${h.streak}-day streak` : "";
    return `- ${h.title}: ${h.doneToday ? "done today" : "not done yet"}${streak}`;
  });
  return `His daily habits (just for context; the plan doesn't change them):\n${lines.join("\n")}`;
}

/** "today", "tomorrow", "Friday", "last Tuesday", or "Monday, November 10". */
export function spokenDay(date: string, today: string): string {
  const days = dayjs(date).diff(dayjs(today), "day");
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1 && days < 7) return dayjs(date).format("dddd");
  if (days < -1 && days > -7) return `last ${dayjs(date).format("dddd")}`;
  return dayjs(date).format("dddd, MMMM D");
}

/** "3 PM", "3:30 PM", "noon", "midnight", from HH:mm or minutes after midnight. */
export function spokenTime(time: string | number): string {
  const minutes = typeof time === "number" ? time : toMinutes(time);
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  if (m === 0 && h === 12) return "noon";
  if (m === 0 && h === 0) return "midnight";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

/** "3 to 4 PM", "11 AM to 12:30 PM" */
export function spokenRange(start: number, end: number): string {
  const a = spokenTime(start);
  const b = spokenTime(end);
  const suffix = (t: string) => t.match(/ (AM|PM)$/)?.[1];
  // "3 to 4 PM" rather than "3 PM to 4 PM"
  return suffix(a) && suffix(a) === suffix(b) ? `${a.replace(/ (AM|PM)$/, "")} to ${b}` : `${a} to ${b}`;
}

/** "45 minutes", "an hour", "1 hour 30 minutes", "2 hours" */
export function spokenDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const mins = m ? `${m} minute${m === 1 ? "" : "s"}` : "";
  if (!h) return mins;
  const hours = h === 1 ? (m ? "1 hour" : "an hour") : `${h} hours`;
  return m ? `${hours} ${mins}` : hours;
}
