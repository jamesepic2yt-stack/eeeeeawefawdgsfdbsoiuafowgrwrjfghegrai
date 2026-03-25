/**
 * Global app state hook using React Context.
 *
 * Manages user profile, daily summary, and provides actions
 * for logging food and refreshing data.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type { User, DailySummary, FoodSearchResult } from '../types';
import * as api from '../services/api';

interface AppState {
  user: User | null;
  summary: DailySummary | null;
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_USER'; user: User }
  | { type: 'SET_SUMMARY'; summary: DailySummary }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR' };

const initialState: AppState = {
  user: null,
  summary: null,
  isLoading: false,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, error: null };
    case 'SET_SUMMARY':
      return { ...state, summary: action.summary, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  initUser: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  logFood: (food: FoodSearchResult, servings: number, mealType: string, source: string) => Promise<void>;
  deleteLog: (logId: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initUser = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      // Try to get existing user, or create a default one
      let user: User;
      try {
        user = await api.getUser(1);
      } catch {
        user = await api.createUser({
          email: 'user@fuel.app',
          name: 'You',
          targets: {
            target_calories: 2000,
            target_protein_g: 150,
            target_fat_g: 65,
            target_carbs_g: 250,
          },
        });
      }
      dispatch({ type: 'SET_USER', user });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: 'Could not connect to server' });
    }
  }, []);

  const refreshSummary = useCallback(async () => {
    if (!state.user) return;
    try {
      const summary = await api.getDailySummary(state.user.id);
      dispatch({ type: 'SET_SUMMARY', summary });
    } catch (err) {
      // Silently fail — summary will show empty state
      console.warn('Failed to refresh summary:', err);
    }
  }, [state.user]);

  const logFood = useCallback(
    async (food: FoodSearchResult, servings: number, mealType: string, source: string) => {
      if (!state.user) return;
      await api.createLog({
        user_id: state.user.id,
        food_name: food.name,
        brand: food.brand,
        calories: food.calories,
        protein_g: food.protein_g,
        fat_g: food.fat_g,
        carbs_g: food.carbs_g,
        serving_size: food.serving_size,
        serving_unit: food.serving_unit,
        servings,
        barcode: food.barcode,
        source,
        meal_type: mealType,
      });
      // Refresh summary after logging
      await refreshSummary();
    },
    [state.user, refreshSummary],
  );

  const deleteLog = useCallback(
    async (logId: number) => {
      await api.deleteLog(logId);
      await refreshSummary();
    },
    [refreshSummary],
  );

  // Auto-init user on mount
  useEffect(() => {
    initUser();
  }, [initUser]);

  // Auto-refresh summary when user is loaded
  useEffect(() => {
    if (state.user) {
      refreshSummary();
    }
  }, [state.user, refreshSummary]);

  const value: AppContextValue = {
    state,
    initUser,
    refreshSummary,
    logFood,
    deleteLog,
  };

  return React.createElement(AppContext.Provider, { value }, children);
}

export function useAppState(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
