import type { Habit, Task } from "@/lib/logic/repo";

export type { Habit, Task };

export interface TaskItemProps {
  task: Task;
  isCompleted: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
  onSkipForToday?: (taskId: string) => void;
  onSendToSlate?: (taskId: string) => void;
  isReadOnly?: boolean;
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
