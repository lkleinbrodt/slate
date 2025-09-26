/**
 * Base store factory to reduce duplication in store patterns
 */

import {
  createErrorState,
  createLoadingState,
  createSuccessState,
} from "@/lib/utils/errorHandling";

import { StateCreator } from "zustand";

export interface BaseStoreState {
  loading: boolean;
  error: string | null;
}

export interface BaseStoreActions {
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Creates a base store with common state and actions
 */
export function createBaseStore<T extends BaseStoreState>(
  initialState: Omit<T, keyof BaseStoreState>
): StateCreator<T & BaseStoreActions> {
  return (set) =>
    ({
      ...initialState,
      loading: false,
      error: null,

      setError: (error) => set({ error } as Partial<T & BaseStoreActions>),
      setLoading: (loading) =>
        set({ loading } as Partial<T & BaseStoreActions>),
    } as T & BaseStoreActions);
}

/**
 * Common async operation wrapper that handles loading and error states
 */
export async function withAsyncOperation<T>(
  operation: () => Promise<T>,
  setState: (state: Partial<BaseStoreState>) => void,
  errorMessage: string
): Promise<T | null> {
  setState(createLoadingState());

  try {
    const result = await operation();
    setState(createSuccessState());
    return result;
  } catch (error) {
    setState(createErrorState(error, errorMessage));
    return null;
  }
}

/**
 * Common async operation wrapper that updates existing data
 */
export async function withDataUpdate<T, K extends keyof T>(
  operation: () => Promise<T>,
  setState: (fn: (state: any) => any) => void,
  updateFn: (currentData: T[], newItem: T) => T[],
  dataKey: K,
  errorMessage: string
): Promise<T | null> {
  try {
    const result = await operation();
    setState((state) => ({
      [dataKey]: updateFn(state[dataKey], result),
      ...createSuccessState(),
    }));
    return result;
  } catch (error) {
    setState((state) => createErrorState(error, errorMessage));
    return null;
  }
}

/**
 * Common async operation wrapper for updates that modify existing items
 */
export async function withItemUpdate<T extends { id: string }>(
  operation: () => Promise<T>,
  setState: (fn: (state: any) => any) => void,
  updateFn: (currentData: T[], updatedItem: T) => T[],
  dataKey: keyof T,
  errorMessage: string
): Promise<T | null> {
  try {
    const result = await operation();
    setState((state) => ({
      [dataKey]: updateFn(state[dataKey], result),
      ...createSuccessState(),
    }));
    return result;
  } catch (error) {
    setState((state) => createErrorState(error, errorMessage));
    return null;
  }
}
