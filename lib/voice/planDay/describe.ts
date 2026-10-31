import type { Change } from "./extract";
import { spokenDay } from "./instructions";

// How the review sheet words a change: what happens, to which task, and any detail.

export interface ChangeLine {
  action: string;
  title: string;
  detail: string | null;
}

export function describeChange(change: Change, today: string): ChangeLine {
  const day = (d: string) => spokenDay(d, today);
  switch (change.kind) {
    case "plan_today":
      return { action: "Today", title: change.title, detail: null };
    case "send_to_slate":
      return { action: "Off today", title: change.title, detail: "back to the Slate" };
    case "snooze":
      return { action: `Move to ${day(change.until)}`, title: change.title, detail: null };
    case "set_due":
      return { action: change.due ? `Due ${day(change.due)}` : "No due date", title: change.title, detail: null };
    case "complete":
      return { action: "Done", title: change.title, detail: null };
    case "delete":
      return { action: "Delete", title: change.title, detail: null };
    case "create": {
      const bits = [change.today ? "on today" : null, change.due ? `due ${day(change.due)}` : null].filter(Boolean);
      return { action: "New task", title: change.title, detail: bits.length ? bits.join(", ") : null };
    }
  }
}
