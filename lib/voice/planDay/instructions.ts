import type { DaySnapshot, PlanHabit, PlanTask } from "./snapshot";

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

/** Threepio's `greeting.prompt`: the character writes the opening line from the day. */
export const GREETING_PROMPT =
  "Say hello and open with one thing from his day, like something due or carried over from yesterday, then ask where he wants to start. One or two sentences.";

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
      "- Start from what's already on today and what's due, then help him choose what else to take on. Don't read the lists out; bring up what matters, like anything overdue, due soon or carried over, and ask.",
      "- When he mentions something new to do, make sure you know whether it's for today and when it's due, if he hasn't said.",
      "- Help him keep the day realistic. If it's getting long, say so.",
      "- Before he goes, sum up the plan in a sentence or two so he can correct it.",
    ].join("\n"),
    [
      `Ending the call: he may have his phone in his pocket, so you can hang up for him. Saying "${HANG_UP_PHRASE}" ends the call at once, so:`,
      "- When he wants to wrap up, sum up the plan, then ask whether he'd like you to hang up.",
      `- Only after he clearly says yes, say a short goodbye that ends with exactly "${HANG_UP_PHRASE}"`,
      "- Never say those words at any other time, not even if he says goodbye or thanks you: ask first. If he's unsure or adds something, keep going.",
    ].join("\n"),
    list("Already on today", openToday, date) ?? "Nothing is on today yet.",
    list("Done today", doneToday, date),
    list("Due within a week, not on today", due, date),
    list("The rest of his Slate (open tasks, not planned for today)", other, date, snapshot.slateOmitted),
    habits(snapshot.habits),
  ];
  return sections.filter(Boolean).join("\n\n");
}

function list(title: string, tasks: PlanTask[], today: string, omitted = 0): string | null {
  if (!tasks.length) return null;
  const lines = tasks.map((t) => `- ${describe(t, today)}`);
  if (omitted) lines.push(`- and ${omitted} more, less urgent`);
  return `${title}:\n${lines.join("\n")}`;
}

function describe(t: PlanTask, today: string): string {
  const parts: string[] = [];
  if (t.dueDate) parts.push(t.dueDate < today ? `overdue, was due ${spokenDay(t.dueDate, today)}` : `due ${spokenDay(t.dueDate, today)}`);
  if (t.doDate && t.doDate > today) parts.push(`planned for ${spokenDay(t.doDate, today)}`);
  if (t.carriedOver) parts.push("carried over from yesterday");
  const notes = t.notes?.trim() ? ` (note: ${t.notes.trim().replace(/\s+/g, " ")})` : "";
  return `${t.title}${parts.length ? `, ${parts.join(", ")}` : ""}${notes}`;
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
