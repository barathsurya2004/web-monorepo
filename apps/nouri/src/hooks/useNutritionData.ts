import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { DailyNutritionSummary, MealItem, MealLog, NutritionGoals } from '../types';

export const QUERY_KEYS = {
  all: ['nutrition'] as const,
  dailyLog: (date: string) => ['nutrition', 'daily', date] as const,
  goals: ['nutrition', 'goals'] as const,
  jobStatus: (jobId: string) => ['nutrition', 'job', jobId] as const,
};

/**
 * Optimized server fetching for daily diary summary, macro aggregates, and meal logs.
 * Matches penne-dashboard caching: background sync on window focus, instant cache access.
 */
export function useDailyLog(date: string, enabled = true) {
  return useQuery<DailyNutritionSummary>({
    queryKey: QUERY_KEYS.dailyLog(date),
    queryFn: () => api.getDailyLog(date),
    enabled: enabled && !!date,
    staleTime: 1000 * 15, // 15 seconds fresh
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch daily nutrition goals from server.
 */
export function useGoals(enabled = true) {
  return useQuery<NutritionGoals>({
    queryKey: QUERY_KEYS.goals,
    queryFn: () => api.getGoals(),
    enabled,
    staleTime: 1000 * 60, // 1 minute fresh
  });
}

/**
 * Mutation for adding manual meals with immediate cache invalidation.
 */
export function useAddManualMealMutation(currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meal: { meal_type: string; notes?: string; items: Omit<MealItem, 'id'>[] }) =>
      api.addManualMeal(meal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyLog(currentDate) });
    },
  });
}

/**
 * Mutation for updating individual meal items and macros.
 */
export function useUpdateMealItemMutation(currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, item }: { itemId: string; item: Partial<MealItem> }) =>
      api.updateMealItem(itemId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyLog(currentDate) });
    },
  });
}

/**
 * Mutation for deleting a meal log.
 */
export function useDeleteMealMutation(currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mealId: string) => api.deleteMealLog(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyLog(currentDate) });
    },
  });
}

/**
 * Mutation for deleting an individual meal item.
 */
export function useDeleteMealItemMutation(currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.deleteMealItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyLog(currentDate) });
    },
  });
}

/**
 * Mutation for saving goals with immediate synchronization across diary and goals cache.
 */
export function useSaveGoalsMutation(currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goals: NutritionGoals) => api.setGoals(goals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyLog(currentDate) });
    },
  });
}
