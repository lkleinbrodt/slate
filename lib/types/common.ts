/**
 * Shared types and interfaces to reduce duplication across the app
 */

// Base entity types
export interface BaseEntity {
  id: string;
  title: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Task-specific types
export interface Task extends BaseEntity {
  dueDate: string | null;
  scheduledFor: string | null;
  completedAt: string | null;
  status: "open" | "done" | "archived";
  dependsOnTaskId: string | null;
}

export interface NewTask {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  dependsOnTaskId: string | null;
}

// Habit-specific types
export interface Habit extends BaseEntity {
  isActive: boolean;
}

export interface NewHabit {
  id: string;
  title: string;
  notes: string | null;
  active: boolean;
  reminderTime: string | null;
  createdAt: string;
  updatedAt: string;
}

// Day plan types
export interface DayPlan {
  date: string;
  perfectDay: boolean;
  tasks: Task[];
  habits: Habit[];
  completedTasks: Task[];
  completedHabits: Habit[];
}

// Entity reference types
export interface EntityRef {
  type: "task" | "habit";
  id: string;
}

// Filter types
export type TaskFilter = "all" | "scheduled" | "dueSoon" | "completed";

// Date/time types
export type LocalDate = string; // YYYY-MM-DD format
export type DateTime = string; // ISO string with timezone
export type HHmm = string; // HH:mm format

// Store state types
export interface BaseStoreState {
  loading: boolean;
  error: string | null;
}

export interface TasksState extends BaseStoreState {
  tasks: Task[];
  filter: TaskFilter;
}

export interface HabitsState extends BaseStoreState {
  habits: Habit[];
}

export interface DayPlanState extends BaseStoreState {
  currentDayPlan: DayPlan | null;
}

export interface SettingsState extends BaseStoreState {
  dayStart: string;
  autoCarryover: boolean;
  habitReminderTime: string;
  eveningNudgeEnabled: boolean;
  taskReminderTime: string;
  todayReminderEnabled: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

// Component prop types
export interface BaseItemProps {
  onEdit: (
    type: "task" | "habit",
    id: string,
    title: string,
    notes?: string,
    dueDate?: string
  ) => void;
}

export interface TaskItemProps extends BaseItemProps {
  task: Task;
  isCompleted: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
  onSkipForToday?: (taskId: string) => void;
  isReadOnly?: boolean;
}

export interface HabitItemProps extends BaseItemProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onToggle: (habitId: string) => void;
  isReadOnly?: boolean;
}

export interface SlateItemProps extends BaseItemProps {
  task: Task;
  onAddToToday: (type: "task", id: string) => void;
}

// Modal types
export interface BaseModalProps {
  visible: boolean;
  onCancel: () => void;
}

export interface AddModalProps extends BaseModalProps {
  type: "task" | "habit";
  title: string;
  dueDate: Date | null;
  notes?: string;
  isEditMode?: boolean;
  onTypeChange: (type: "task" | "habit") => void;
  onTitleChange: (title: string) => void;
  onDueDateChange: (date: Date | null) => void;
  onNotesChange?: (notes: string) => void;
  onSave: () => void;
  onDelete?: () => void;
}

// Progress tracker types
export interface ProgressTrackerProps {
  label: string;
  completed: number;
  total: number;
  progress: number;
}

// Perfect day modal types
export interface PerfectDayModalProps extends BaseModalProps {
  onClose: () => void;
}

// Hook return types
export interface UseModalState {
  showAddModal: boolean;
  addModalType: "task" | "habit";
  newItemTitle: string;
  taskDueDate: Date | null;
  editingItem: {
    type: "task" | "habit";
    id: string;
    title: string;
    notes?: string;
    dueDate?: string;
  } | null;
  editNotes: string;
  isEditMode: boolean;
}

export interface UseModalActions {
  openAddModal: () => void;
  closeModal: () => void;
  setAddModalType: (type: "task" | "habit") => void;
  setNewItemTitle: (title: string) => void;
  setTaskDueDate: (date: Date | null) => void;
  setEditNotes: (notes: string) => void;
  startEditing: (
    type: "task" | "habit",
    id: string,
    title: string,
    notes?: string,
    dueDate?: string
  ) => void;
  resetForm: () => void;
  handleAddItem: (
    onAddTask: (input: { title: string; dueDate?: string }) => Promise<void>,
    onAddHabit: (input: { title: string }) => Promise<{ id: string }>,
    onUpdateTask: (id: string, patch: any) => Promise<void>,
    onUpdateHabit: (id: string, patch: any) => Promise<void>,
    onAddToDay: (
      date: string,
      entity: { type: "task" | "habit"; id: string }
    ) => Promise<void>,
    toLocalDateString: (date: Date) => string,
    fromLocalDateString: (dateString: string) => Date,
    localToday: (dayStart: string) => string,
    dayStart: string
  ) => Promise<void>;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Form input types
export interface TaskInput {
  title: string;
  notes?: string;
  dueDate?: LocalDate;
  scheduledFor?: LocalDate;
  dependsOnTaskId?: string | null;
}

export interface HabitInput {
  title: string;
  notes?: string;
  reminderTime?: string;
}

// Update patch types
export interface TaskUpdatePatch {
  title?: string;
  notes?: string;
  dueDate?: LocalDate | null;
  scheduledFor?: LocalDate | null;
  dependsOnTaskId?: string | null;
  archived?: boolean;
}

export interface HabitUpdatePatch {
  title?: string;
  notes?: string;
  active?: boolean;
  reminderTime?: string | null;
}
