import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MealItem, PendingMealJob, User } from './types';
import { api } from './services/api';
import {
  useDailyLog,
  useAddManualMealMutation,
  useUpdateMealItemMutation,
  useDeleteMealMutation,
  useDeleteMealItemMutation,
  useSaveGoalsMutation,
  QUERY_KEYS,
} from './hooks/useNutritionData';
import { Navbar } from './components/Navbar';
import { MacroRingCard } from './components/MacroRingCard';
import { ClipboardPasteZone } from './components/ClipboardPasteZone';
import { MealLogList } from './components/MealLogList';
import { MealItemEditModal } from './components/MealItemEditModal';
import { ManualMealModal } from './components/ManualMealModal';
import { GoalsModal } from './components/GoalsModal';
import { AuthModal } from './components/AuthModal';
import { LoginView } from './components/LoginView';
import { RecipeAssistantTeaser } from './components/RecipeAssistantTeaser';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getCurrentUser());
  const [currentDate, setCurrentDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // Optimized server state via TanStack Query (mirrors penne-dashboard)
  const { data: summary, isLoading } = useDailyLog(currentDate, !!currentUser);

  // Optimized server mutations
  const addManualMealMutation = useAddManualMealMutation(currentDate);
  const updateMealItemMutation = useUpdateMealItemMutation(currentDate);
  const deleteMealMutation = useDeleteMealMutation(currentDate);
  const deleteMealItemMutation = useDeleteMealItemMutation(currentDate);
  const saveGoalsMutation = useSaveGoalsMutation(currentDate);

  const [pendingJobs, setPendingJobs] = useState<PendingMealJob[]>([]);
  const [recentlyAddedMealId, setRecentlyAddedMealId] = useState<string | null>(null);
  const [celebrationToast, setCelebrationToast] = useState<{
    message: string;
    subtext: string;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'switch'>('login');
  const [activeTab, setActiveTab] = useState<'diary' | 'recipes'>('diary');

  const handleAuthSuccess = (user: User, action: 'login' | 'signup' | 'switch') => {
    setCurrentUser(user);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });

    const title =
      action === 'signup'
        ? `🎉 Account created! Welcome, ${user.name}`
        : action === 'switch'
        ? `Switched profile to ${user.name}`
        : `👋 Welcome back, ${user.name}!`;

    setCelebrationToast({
      message: title,
      subtext: `Target: ${user.calorie_goal || 2250} kcal · Syncing diary meals...`,
    });
    setTimeout(() => setCelebrationToast(null), 4500);
  };

  const handleLogout = () => {
    api.clearSession();
    setCurrentUser(null);
    setPendingJobs([]);
    queryClient.clear();

    setCelebrationToast({
      message: 'Signed out successfully',
      subtext: 'Please log in to continue.',
    });
    setTimeout(() => setCelebrationToast(null), 3000);
  };

  // Warn user if they attempt to close the tab/app while an upload is still in flight
  useEffect(() => {
    const hasActiveUploads = pendingJobs.some((j) => j.job_id.startsWith('client-temp-'));
    if (!hasActiveUploads) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Photo upload is still in progress. Please do not close the app until upload finishes.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingJobs]);

  // Asynchronously append new pending meal job without blocking subsequent uploads
  const handleJobStarted = (newJob: PendingMealJob) => {
    setPendingJobs((prev) => [newJob, ...prev]);
  };

  // Reconcile temporary client job ID with real backend job ID
  const handleJobIdAssigned = (tempJobId: string, realJobId: string) => {
    setPendingJobs((prev) =>
      prev.map((j) => (j.job_id === tempJobId ? { ...j, job_id: realJobId } : j))
    );

    // Alert user that upload has reached cloud and they are now safe to close the app
    setCelebrationToast({
      message: '✅ Photo uploaded safely!',
      subtext: 'You can safely close the app now — AI is processing your meal in the cloud.',
    });
    setTimeout(() => setCelebrationToast(null), 5500);
  };

  const handleJobFailed = (tempJobId: string, errorMessage: string) => {
    setPendingJobs((prev) =>
      prev.map((j) =>
        j.job_id === tempJobId
          ? {
              ...j,
              status: 'FAILED',
              stage: errorMessage || 'Photo upload failed',
              error_message: errorMessage || 'Photo upload failed',
            }
          : j
      )
    );
  };

  // Triggered when an individual pending task in Today's Meals completes
  const handleJobComplete = (jobId: string, items: MealItem[], mealLogId?: string) => {
    setPendingJobs((prev) => prev.filter((p) => p.job_id !== jobId));

    if (mealLogId) {
      setRecentlyAddedMealId(mealLogId);
      setTimeout(() => setRecentlyAddedMealId(null), 5000);
    }

    if (items && items.length > 0) {
      const totalCal = items.reduce((acc, it) => acc + (it.calories || 0), 0);
      const totalProt = items.reduce((acc, it) => acc + (it.protein_grams || 0), 0);
      const dishNames = items.map((it) => it.name).slice(0, 2).join(', ');

      setCelebrationToast({
        message: `✨ AI detected: ${dishNames}${items.length > 2 ? '...' : ''}`,
        subtext: `+${Math.round(totalCal)} kcal · +${Math.round(totalProt)}g Protein added to diary!`,
      });
      setTimeout(() => setCelebrationToast(null), 5500);
    }

    // Refresh today's summary via TanStack Query invalidation
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyLog(currentDate) });
  };

  const handleDismissPending = (jobId: string) => {
    setPendingJobs((prev) => prev.filter((p) => p.job_id !== jobId));
  };

  const handleEditItem = (item: MealItem) => {
    setEditingItem(item);
  };

  const handleSaveItem = async (updated: MealItem) => {
    await updateMealItemMutation.mutateAsync({ itemId: updated.id, item: updated });
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteMealItemMutation.mutateAsync(itemId);
  };

  const handleDeleteMeal = async (mealId: string) => {
    await deleteMealMutation.mutateAsync(mealId);
  };

  const handleSaveManualMeal = async (meal: {
    meal_type: string;
    notes?: string;
    items: Omit<MealItem, 'id'>[];
  }) => {
    await addManualMealMutation.mutateAsync(meal);
    setIsManualModalOpen(false);
  };

  const handleSaveGoals = async (goals: any) => {
    await saveGoalsMutation.mutateAsync(goals);
    setIsGoalsModalOpen(false);
    setCurrentUser(api.getCurrentUser());
  };

  if (!currentUser) {
    return <LoginView onSuccess={handleAuthSuccess} />;
  }

  const safeMeals = summary?.meals ?? [];
  const mealsCount = safeMeals.length + pendingJobs.length;

  return (
    <div className="min-h-screen w-full max-w-full bg-ink-900 text-fg font-sans antialiased selection:bg-mint/30 selection:text-mint flex flex-col relative">
      {/* Toast Alert Notification */}
      {celebrationToast && (
        <div className="fixed top-[max(calc(env(safe-area-inset-top,0px)+4.25rem),5rem)] left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-ink-850/95 backdrop-blur-xl border border-mint/50 text-fg shadow-2xl shadow-mint/20 flex items-center gap-3 animate-rise max-w-sm sm:max-w-md w-[92%]">
          <div className="w-8 h-8 rounded-xl bg-mint/20 border border-mint/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-mint animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-fg truncate">
              {celebrationToast.message}
            </div>
            <div className="text-[11px] font-mono text-mint truncate">
              {celebrationToast.subtext}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Navigation Bar */}
      <Navbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onOpenGoals={() => setIsGoalsModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={currentUser}
        onOpenAuth={(tab) => {
          setAuthModalTab(tab || 'login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 pt-3 pb-[max(calc(env(safe-area-inset-bottom,0px)+2rem),2.5rem)] sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {isLoading || !summary ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-mint border-t-transparent animate-spin" />
          </div>
        ) : activeTab === 'diary' ? (
          <>
            {/* Visual Macro & Calories Counter Card */}
            <MacroRingCard summary={summary} />

            {/* Quick Snapshot & Global Clipboard Paste Dropzone (Always available for new requests) */}
            <ClipboardPasteZone
              onJobStarted={handleJobStarted}
              onJobIdAssigned={handleJobIdAssigned}
              onJobFailed={handleJobFailed}
              onManualClick={() => setIsManualModalOpen(true)}
            />

            {/* Daily Log of Confirmed Meals & Concurrent In-Flight AI Processing Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-display font-bold text-base text-fg">
                  Today's Meals
                </h3>
                <span className="text-xs text-muted font-mono">
                  {mealsCount} {mealsCount === 1 ? 'entry' : 'entries'}
                  {pendingJobs.length > 0 && ` (${pendingJobs.length} processing)`}
                </span>
              </div>
              <MealLogList
                meals={safeMeals}
                pendingJobs={pendingJobs}
                recentlyAddedMealId={recentlyAddedMealId}
                onJobComplete={handleJobComplete}
                onDismissPending={handleDismissPending}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onDeleteMeal={handleDeleteMeal}
              />
            </div>
          </>
        ) : (
          <RecipeAssistantTeaser summary={summary} />
        )}
      </main>

      {/* Modals */}
      {editingItem && (
        <MealItemEditModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {isManualModalOpen && (
        <ManualMealModal
          onSave={handleSaveManualMeal}
          onClose={() => setIsManualModalOpen(false)}
        />
      )}

      {isGoalsModalOpen && (
        <GoalsModal
          currentGoals={summary?.goals || {
            calories_target: currentUser.calorie_goal || 2200,
            protein_grams: 160,
            carbs_grams: 220,
            fat_grams: 65,
            fiber_grams: 30,
            sodium_mg: 2300,
          }}
          onSave={handleSaveGoals}
          onClose={() => setIsGoalsModalOpen(false)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialTab={authModalTab}
      />
    </div>
  );
};
