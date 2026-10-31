import * as repo from "@/lib/logic/repo";

import type { Change } from "./extract";
import { useAppStore } from "@/lib/stores/appStore";

// Makes the changes Landon kept, through the same store actions as tapping, so due-date
// pull-ins, clamping, the widget and notifications behave as they always do. Minutes can
// pass between the call and the review, so each task is checked again first.

export interface ApplyResult {
  applied: Change[];
  skipped: { change: Change; why: string }[];
}

// New tasks first, then done, then where tasks go, then due dates (a due date of today or
// earlier pulls a task onto Today, as it does when edited by hand).
const ORDER: Change["kind"][] = ["create", "complete", "plan_today", "send_to_slate", "snooze", "set_due"];

export async function applyChanges(changes: Change[]): Promise<ApplyResult> {
  const store = useAppStore.getState();
  const result: ApplyResult = { applied: [], skipped: [] };
  const sorted = [...changes].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));

  for (const change of sorted) {
    try {
      if (change.kind === "create") {
        const today = store.getTodayDate();
        await store.createTask({
          title: change.title,
          notes: change.notes ?? undefined,
          dueDate: change.due ?? undefined,
          scheduledFor: change.today ? today : undefined,
        });
      } else {
        const task = await repo.getTask(change.taskId);
        if (!task || task.status !== "open") {
          result.skipped.push({ change, why: task ? `it's ${task.status === "done" ? "done" : "deleted"} now` : "it's gone" });
          continue;
        }
        switch (change.kind) {
          case "complete":
            await store.completeTask(task.id);
            break;
          case "plan_today":
            await store.planTaskForToday(task.id);
            break;
          case "send_to_slate":
            await store.sendTaskBackToSlate(task.id);
            break;
          case "snooze":
            await store.updateTask(task.id, { scheduledFor: change.until });
            break;
          case "set_due":
            await store.updateTask(task.id, { dueDate: change.due });
            break;
        }
      }
      result.applied.push(change);
    } catch (e) {
      result.skipped.push({ change, why: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}
