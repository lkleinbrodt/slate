export const state = {
  todayTasks: [] as unknown[],
  activeHabits: [] as unknown[],
  completions: [] as unknown[],
  slateTasks: [] as unknown[],
  overdueTasks: [] as unknown[],
  planTaskForCalls: [] as { id: string; date: string | null }[],
  skipTaskForTodayCalls: [] as { id: string; date: string }[],
  completeHabitTodayCalls: [] as { id: string; date: string }[],
  undoHabitTodayCalls: [] as { id: string; date: string }[],
};

export const listTodayTasks = async (date: string) => {
  state.lastListTodayDate = date;
  return state.todayTasks;
};

export const listActiveHabits = async () => state.activeHabits;

export const getHabitCompletionsForDate = async (date: string) => {
  state.lastCompletionsDate = date;
  return state.completions;
};

export const listAllTasks = async () => state.slateTasks;
export const listOverdueTasks = async (date: string) => {
  state.lastOverdueDate = date;
  return state.overdueTasks;
};

export const planTaskFor = async (id: string, date: string | null) => {
  state.planTaskForCalls.push({ id, date });
};

export const skipTaskForToday = async (id: string, date: string) => {
  state.skipTaskForTodayCalls.push({ id, date });
};

export const completeHabitToday = async (habitId: string, date: string) => {
  state.completeHabitTodayCalls.push({ id: habitId, date });
};

export const undoHabitToday = async (habitId: string, date: string) => {
  state.undoHabitTodayCalls.push({ id: habitId, date });
};

export const createTask = async () => {};
export const createHabit = async () => {};
export const updateTask = async () => {};
export const updateHabit = async () => {};
export const getTaskById = () => undefined;
export const getHabitById = () => undefined;
export const completeTask = async () => {};
export const undoCompleteTask = async () => {};
export const deleteTask = async () => {};
export const deleteHabit = async () => {};
