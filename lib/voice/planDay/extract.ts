import { type DaySnapshot, type PlanTask, tasksByRef } from "./snapshot";
import { DEFAULT_DURATION, toHHmm, toMinutes } from "@/lib/logic/schedule";
import { USER_NAME } from "./instructions";

import type { CallMessage } from "@/lib/voice/threepio";
import { chatJSON } from "@/lib/voice/openrouter";
import dayjs from "dayjs";

// After the call: the transcript and the snapshot (with refs) go to an LLM, which answers
// with proposed changes in a fixed JSON shape. Nothing is trusted as it comes back:
// validateProposal drops anything that doesn't fit the day (unknown refs, past dates,
// changes that change nothing) and keeps the last word on each task.

export const DEFAULT_PLAN_MODEL = "anthropic/claude-sonnet-5.5";

export type Change = { reason: string } & (
  | { kind: "plan_today"; taskId: string; title: string }
  | { kind: "send_to_slate"; taskId: string; title: string }
  | { kind: "snooze"; taskId: string; title: string; until: string }
  | { kind: "set_due"; taskId: string; title: string; due: string | null }
  | { kind: "complete"; taskId: string; title: string }
  | { kind: "delete"; taskId: string; title: string }
  /** A time on today (which puts the task on today) and/or how long it takes; at least one is set */
  | { kind: "set_time"; taskId: string; title: string; start: string | null; duration: number | null }
  | { kind: "clear_time"; taskId: string; title: string }
  | {
      kind: "create";
      title: string;
      notes: string | null;
      due: string | null;
      today: boolean;
      /** HH:mm on today, only with `today`. Optional: proposals saved before times lack them. */
      start?: string | null;
      duration?: number | null;
    }
);

export interface Proposal {
  summary: string;
  changes: Change[];
  /** What the model proposed and the checks threw out, with why: for tuning, not for Landon. */
  dropped: { change: unknown; why: string }[];
}

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

const KINDS = ["plan_today", "send_to_slate", "snooze", "set_due", "complete", "delete", "set_time", "clear_time", "create"] as const;

/** Longest length a task can be given, in minutes */
const MAX_DURATION = 12 * 60;

/** One flat shape for every kind (unused fields null): simpler for models than a union. */
export const PROPOSAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "changes"],
  properties: {
    summary: { type: "string", description: "The plan in one or two plain sentences, addressed to him." },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "task", "title", "notes", "due", "until", "today", "start", "duration", "reason"],
        properties: {
          kind: { type: "string", enum: [...KINDS] },
          task: { type: ["string", "null"], description: "The ref of an existing task (t1, t2, …); null for create." },
          title: { type: ["string", "null"], description: "create only: the new task's title, short." },
          notes: { type: ["string", "null"], description: "create only: details worth keeping, or null." },
          due: { type: ["string", "null"], description: "create and set_due: due date YYYY-MM-DD, or null." },
          until: { type: ["string", "null"], description: "snooze only: the day to plan it for, YYYY-MM-DD." },
          today: { type: ["boolean", "null"], description: "create only: whether it goes on today." },
          start: { type: ["string", "null"], description: "set_time and create: the time today he'll do it, HH:mm 24-hour, or null." },
          duration: { type: ["integer", "null"], description: "set_time and create: how long it takes in minutes, or null." },
          reason: { type: "string", description: "A few words on why, from what he said." },
        },
      },
    },
  },
} as const;

export function buildExtractionPrompt(snapshot: DaySnapshot, transcript: CallMessage[]) {
  const { date } = snapshot;
  const system = [
    `You turn a short planning call into changes to ${USER_NAME}'s to-do app, Slate. In the call he talked his day through with an assistant.`,
    "",
    "Propose only what he agreed to or asked for. The assistant's suggestions count only if he accepted them. If he changed his mind, use what he settled on. When unsure, leave it out: he reviews every change before it's applied, and a missing change costs him less than a wrong one.",
    "",
    "Kinds of change:",
    "- plan_today: put an existing task on today.",
    "- send_to_slate: take a task off today, with no particular day.",
    "- snooze: move a task to a later day (until).",
    "- set_due: set or clear an existing task's due date.",
    "- complete: he says it's already done.",
    "- delete: he's not doing it at all, or it no longer matters. Only when he says so plainly; putting it off is a snooze or send_to_slate.",
    "- set_time: when today he'll do a task (start) and/or how long it takes (duration). A start puts the task on today, so it needs no plan_today. Leave start null if he only said how long, and duration null if he only said when.",
    "- clear_time: take the set time off a task on today, keeping it on today.",
    "- create: a new task he mentioned (title, notes, due, today, and start and duration if he gave them; a start only goes with today: true). Never create a task that's already in the list; use its ref.",
    "",
    `Refer to existing tasks by ref (t1, t2, …) only. Dates are YYYY-MM-DD; today is ${date} (${dayjs(date).format("dddd")}). Work out days like "Friday" or "next week" from that. Titles are short and plain, like his own. Habits aren't tasks: leave them out.`,
    "",
    `Times are HH:mm, 24-hour, always today. He means waking hours, later than the time the call started unless he says otherwise: "at 3" is 15:00; "at 9" is 09:00 in the morning but 21:00 once 9 AM has passed. If he places a task by something on his calendar ("right after the dentist"), use that event's end time. Durations are whole minutes: "an hour and a half" is 90. Only set a time or length he gave or agreed to. If he said "from 2 to 4", that's start 14:00, duration 120.`,
  ].join("\n");

  const describe = (t: PlanTask) => {
    const bits = [
      t.done ? "done today" : null,
      t.startTime ? `at ${t.startTime}` : null,
      t.durationMin ? `takes ${t.durationMin} min` : null,
      t.dueDate ? `due ${t.dueDate}` : null,
      t.doDate && t.doDate > date ? `planned for ${t.doDate}` : null,
      t.carriedOver ? "carried over from yesterday" : null,
    ].filter(Boolean);
    return `${t.ref}: ${t.title}${bits.length ? ` (${bits.join(", ")})` : ""}`;
  };
  const lines = (tasks: PlanTask[]) => (tasks.length ? tasks.map(describe).join("\n") : "(none)");
  const said = transcript
    .map((m) => `${m.role === "user" ? USER_NAME : "Assistant"}: ${m.text}${m.interrupted ? " [cut off]" : ""}`)
    .join("\n");

  const schedule = snapshot.schedule;
  const range = (a: number, b: number) => `${toHHmm(a)}-${toHHmm(Math.min(b, 24 * 60))}`;
  const day = schedule
    ? [
        `When the call started it was ${toHHmm(schedule.now)}.`,
        "His calendar today:",
        ...(schedule.work ? [`${range(schedule.work.start, schedule.work.end)} work`] : []),
        ...schedule.events.map((e) => `${range(e.start, e.end)} ${e.title}`),
        ...(schedule.work || schedule.events.length ? [] : ["(nothing)"]),
        "",
      ]
    : [];

  const user = [
    `Today: ${dayjs(date).format("dddd, MMMM D")} (${date})`,
    "",
    ...day,
    "On today:",
    lines(snapshot.today),
    "",
    "Other open tasks:",
    lines(snapshot.slate),
    "",
    "The call:",
    said || "(nothing was said)",
  ].join("\n");

  return { system, user };
}

export async function extractPlan(opts: {
  snapshot: DaySnapshot;
  transcript: CallMessage[];
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
}): Promise<Proposal & { costUsd: number | null }> {
  const { system, user } = buildExtractionPrompt(opts.snapshot, opts.transcript);
  const reply = await chatJSON({
    apiKey: opts.apiKey,
    model: opts.model ?? DEFAULT_PLAN_MODEL,
    system,
    user,
    schema: PROPOSAL_SCHEMA,
    schemaName: "day_plan",
    fetchImpl: opts.fetchImpl,
  });
  return { ...validateProposal(reply.data, opts.snapshot), costUsd: reply.costUsd };
}

type Raw = Record<string, unknown>;

export function validateProposal(raw: unknown, snapshot: DaySnapshot): Proposal {
  if (!isObject(raw) || typeof raw.summary !== "string" || !Array.isArray(raw.changes)) {
    throw new ExtractionError("The plan came back in the wrong shape.");
  }
  const { date } = snapshot;
  const byRef = tasksByRef(snapshot);
  const onToday = new Set(snapshot.today.map((t) => t.ref));
  const openTitles = new Map(
    [...snapshot.today, ...snapshot.slate].filter((t) => !t.done).map((t) => [normalize(t.title), t.ref])
  );
  const dropped: Proposal["dropped"] = [];
  // Keyed so a later change to the same thing replaces an earlier one
  const kept = new Map<string, Change>();
  const keep = (key: string, change: Change) => {
    kept.delete(key);
    kept.set(key, change);
  };

  for (const c of raw.changes as unknown[]) {
    const why = check(c);
    if (why) dropped.push({ change: c, why });
  }

  function check(c: unknown): string | null {
    if (!isObject(c) || !KINDS.includes(c.kind as (typeof KINDS)[number])) return "unknown kind";
    const reason = typeof c.reason === "string" ? c.reason.trim() : "";

    if (c.kind === "create") {
      const title = typeof c.title === "string" ? c.title.trim() : "";
      if (!title) return "no title";
      const existing = openTitles.get(normalize(title));
      if (existing) return `already a task (${existing})`;
      let due = typeof c.due === "string" ? c.due : null;
      if (due !== null && !(isDay(due) && due >= date)) {
        dropped.push({ change: c, why: `due date ${due} isn't a day from today on; kept the task without it` });
        due = null;
      }
      const notes = typeof c.notes === "string" && c.notes.trim() ? c.notes.trim() : null;
      const today = c.today === true;
      let duration = parseDuration(c.duration);
      if (duration === undefined) {
        dropped.push({ change: c, why: `length ${String(c.duration)} isn't a sensible number of minutes; kept the task without it` });
        duration = null;
      }
      let start = parseStart(c.start);
      if (start && !today) {
        dropped.push({ change: c, why: "a start time needs it on today; kept the task without it" });
        start = null;
      } else if (start === undefined || (start && !fitsDay(start, duration))) {
        dropped.push({ change: c, why: `start ${String(c.start)} isn't a time today; kept the task without it` });
        start = null;
      }
      keep(`new:${normalize(title)}`, { kind: "create", title, notes, due, today, start, duration, reason });
      return null;
    }

    const task = typeof c.task === "string" ? byRef.get(c.task) : undefined;
    if (!task) return `unknown task ${String(c.task)}`;
    const base = { taskId: task.id, title: task.title, reason };
    const scheduled = onToday.has(task.ref) && !task.done;

    switch (c.kind) {
      // Done and deleted both end the task: whichever he said last wins
      case "complete":
        if (task.done) return "already done";
        keep(`${task.ref}:end`, { kind: "complete", ...base });
        return null;
      case "delete":
        if (task.done) return "already done";
        keep(`${task.ref}:end`, { kind: "delete", ...base });
        return null;
      case "plan_today":
        if (task.done) return "already done";
        if (scheduled) return "already on today";
        keep(`${task.ref}:schedule`, { kind: "plan_today", ...base });
        return null;
      case "send_to_slate":
        if (!scheduled) return "not on today";
        keep(`${task.ref}:schedule`, { kind: "send_to_slate", ...base });
        return null;
      case "snooze": {
        if (task.done) return "already done";
        const until = c.until;
        if (typeof until !== "string" || !isDay(until) || until <= date) return `snooze needs a later day, got ${String(until)}`;
        if (until === task.doDate) return "already planned for that day";
        keep(`${task.ref}:schedule`, { kind: "snooze", ...base, until });
        return null;
      }
      case "set_due": {
        const due = c.due === null ? null : c.due;
        if (due !== null && (typeof due !== "string" || !isDay(due) || due < date)) return `due date ${String(due)} isn't a day from today on`;
        if (due === task.dueDate) return "due date unchanged";
        keep(`${task.ref}:due`, { kind: "set_due", ...base, due });
        return null;
      }
      case "set_time": {
        if (task.done) return "already done";
        const start = parseStart(c.start);
        const duration = parseDuration(c.duration);
        if (start === undefined) return `start ${String(c.start)} isn't a time`;
        if (duration === undefined) return `length ${String(c.duration)} isn't a sensible number of minutes`;
        if (start === null && duration === null) return "no time or length";
        if (start && !fitsDay(start, duration ?? task.durationMin ?? null)) return `${start} runs past midnight`;
        const sameStart = start === null || (scheduled && start === task.startTime);
        if (sameStart && (duration === null || duration === task.durationMin)) return "time unchanged";
        keep(`${task.ref}:time`, { kind: "set_time", ...base, start, duration });
        return null;
      }
      case "clear_time":
        if (task.done) return "already done";
        if (!scheduled || !task.startTime) return "has no time today";
        keep(`${task.ref}:time`, { kind: "clear_time", ...base });
        return null;
    }
    return "unknown kind";
  }

  // A task being marked done or deleted needs nothing else
  for (const [key, change] of kept) {
    if (change.kind === "complete" || change.kind === "delete") {
      const ref = key.split(":")[0];
      for (const other of [`${ref}:schedule`, `${ref}:due`, `${ref}:time`]) {
        const c = kept.get(other);
        if (c) {
          kept.delete(other);
          dropped.push({ change: c, why: change.kind === "complete" ? "the task is being marked done" : "the task is being deleted" });
        }
      }
    }
  }

  // Times belong to today: they don't mix with moving a task off it
  for (const [key, change] of kept) {
    if (change.kind !== "set_time" && change.kind !== "clear_time") continue;
    const ref = key.split(":")[0];
    const move = kept.get(`${ref}:schedule`);
    if (move?.kind === "plan_today" && change.kind === "set_time" && change.start) {
      // The time puts it on today; one line in the review is enough
      kept.delete(`${ref}:schedule`);
      dropped.push({ change: move, why: "the time puts it on today" });
    } else if (move && move.kind !== "plan_today") {
      if (change.kind === "set_time" && change.duration !== null) {
        // The length still holds wherever it goes
        kept.set(key, { ...change, start: null });
        if (change.start) dropped.push({ change, why: "it's leaving today; kept its length, not its time" });
      } else {
        kept.delete(key);
        dropped.push({ change, why: "it's leaving today" });
      }
    }
  }

  return { summary: raw.summary.trim(), changes: [...kept.values()], dropped };
}

/** HH:mm, null for none, undefined for something that isn't a time. "9:30" becomes "09:30". */
function parseStart(v: unknown): string | null | undefined {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return undefined;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

/** Whole minutes, null for none, undefined for something that isn't a sensible length. */
function parseDuration(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const minutes = Math.round(v);
  return minutes >= 5 && minutes <= MAX_DURATION ? minutes : undefined;
}

/** Whether a slot starting at `start` ends by midnight. */
function fitsDay(start: string, duration: number | null): boolean {
  return toMinutes(start) + (duration ?? DEFAULT_DURATION) <= 24 * 60;
}

function isObject(v: unknown): v is Raw {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isDay(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && dayjs(s).format("YYYY-MM-DD") === s;
}

function normalize(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}
