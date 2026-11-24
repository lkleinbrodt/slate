import type { Habit, Task } from "@/lib/logic/repo";

export type { Habit, Task };

export interface TaskItemProps {
  task: Task;
  isCompleted: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
  onSkipForToday?: (taskId: string) => void;
  onSendToSlate?: (taskId: string) => void;
  isReadOnly?: boolean;
  /** Minutes after midnight today: a task with a time that's over and still open shows
   * as missed. Leave out where "now" doesn't apply (History). */
  now?: number;
}

export interface HabitItemProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onToggle: (habitId: string) => void;
  isReadOnly?: boolean;
}

export interface SlateItemProps {
  task: Task;
  onAddToToday: (type: "task", id: string) => void;
}
