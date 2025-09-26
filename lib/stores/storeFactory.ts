/**
 * Store factory for common CRUD operations to reduce duplication
 */

import {
  BaseStoreActions,
  BaseStoreState,
  withAsyncOperation,
  withDataUpdate,
  withItemUpdate,
} from "./baseStore";
import { ERROR_MESSAGES, createSuccessState } from "@/lib/utils/errorHandling";

import { StateCreator } from "zustand";

export interface CrudStoreState<T> extends BaseStoreState {
  items: T[];
}

export interface CrudStoreActions<T> extends BaseStoreActions {
  loadItems: () => Promise<void>;
  addItem: (input: any) => Promise<T | null>;
  updateItem: (id: string, patch: any) => Promise<T | null>;
  deleteItem: (id: string) => Promise<void>;
}

/**
 * Creates a CRUD store with common operations
 */
export function createCrudStore<T extends { id: string }>(
  loadOperation: () => Promise<T[]>,
  addOperation: (input: any) => Promise<T>,
  updateOperation: (id: string, patch: any) => Promise<T>,
  deleteOperation: (id: string) => Promise<void>,
  errorMessages: {
    load: string;
    add: string;
    update: string;
    delete: string;
  }
): StateCreator<CrudStoreState<T> & CrudStoreActions<T>> {
  return (set, get) => ({
    items: [],
    loading: false,
    error: null,

    setError: (error) => set({ error }),
    setLoading: (loading) => set({ loading }),

    loadItems: async () => {
      await withAsyncOperation(
        loadOperation,
        (state) => set(state),
        errorMessages.load
      );

      const items = await loadOperation();
      set({ items, loading: false });
    },

    addItem: async (input) => {
      return await withDataUpdate(
        () => addOperation(input),
        set,
        (currentItems, newItem) => [newItem, ...currentItems],
        "id",
        errorMessages.add
      );
    },

    updateItem: async (id, patch) => {
      return await withItemUpdate(
        () => updateOperation(id, patch),
        set,
        (currentItems, updatedItem) =>
          currentItems.map((item) => (item.id === id ? updatedItem : item)),
        "id",
        errorMessages.update
      );
    },

    deleteItem: async (id) => {
      await withAsyncOperation(
        () => deleteOperation(id),
        (state) => set(state),
        errorMessages.delete
      );

      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        ...createSuccessState(),
      }));
    },
  });
}

/**
 * Common error messages for different entity types
 */
export const CRUD_ERROR_MESSAGES = {
  tasks: {
    load: ERROR_MESSAGES.LOAD_TASKS,
    add: ERROR_MESSAGES.ADD_TASK,
    update: ERROR_MESSAGES.UPDATE_TASK,
    delete: "Failed to delete task",
  },
  habits: {
    load: ERROR_MESSAGES.LOAD_HABITS,
    add: ERROR_MESSAGES.ADD_HABIT,
    update: ERROR_MESSAGES.UPDATE_HABIT,
    delete: "Failed to delete habit",
  },
} as const;
