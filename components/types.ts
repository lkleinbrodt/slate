// Re-export shared types from common types file
export {
  DayPlan,
  Habit,
  HabitItemProps,
  PerfectDayModalProps,
  ProgressTrackerProps,
  SlateItemProps,
  Task,
  TaskItemProps,
  AddModalProps as UnifiedAddModalProps,
} from "@/lib/types/common";

// Component-specific types that don't exist in common types
export interface AddButtonProps {
  onPress: () => void;
}
