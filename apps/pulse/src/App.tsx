import React from 'react';
import { useStore } from '@/store';
import { Navigation } from '@/components/Navigation';
import { RestDrawer } from '@/components/RestDrawer';
import { ActiveWorkoutBar } from '@/components/ActiveWorkoutBar';
import { Toasts } from '@/components/Toasts';
import { AuthModal } from '@/components/AuthModal';

// Views
import { HomeView } from '@/views/HomeView';
import { PlannerView } from '@/views/PlannerView';
import { RoutinesView } from '@/views/RoutinesView';
import { BuilderView } from '@/views/BuilderView';
import { WorkoutView } from '@/views/WorkoutView';
import { SummaryView } from '@/views/SummaryView';
import { HistoryView } from '@/views/HistoryView';
import { SessionDetailView } from '@/views/SessionDetailView';
import { AnalyticsView } from '@/views/AnalyticsView';
import { TimerStandaloneView } from '@/views/TimerStandaloneView';
import { SettingsView } from '@/views/SettingsView';

export const App: React.FC = () => {
  const { screen, isAuthModalOpen, closeAuthModal } = useStore();

  const renderView = () => {
    switch (screen.name) {
      case 'home':
        return <HomeView />;
      case 'planner':
        return <PlannerView />;
      case 'routines':
        return <RoutinesView />;
      case 'builder':
        return <BuilderView routineId={screen.routineId} />;
      case 'workout':
        return <WorkoutView />;
      case 'summary':
        return <SummaryView sessionId={screen.sessionId} />;
      case 'history':
        return <HistoryView />;
      case 'session':
        return <SessionDetailView sessionId={screen.sessionId} />;
      case 'analytics':
        return <AnalyticsView />;
      case 'timer':
        return <TimerStandaloneView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 text-fg font-sans antialiased selection:bg-mint/30 selection:text-mint">
      {/* Persistent Navigation bar (header + mobile bottom dock) */}
      <Navigation />

      {/* Main View Area */}
      <main className="min-h-[calc(100vh-60px)]">
        {renderView()}
      </main>

      {/* Persistent Background Active Workout Floating Mini-Bar */}
      <ActiveWorkoutBar />

      {/* Ambient Floating Rest Timer Pill */}
      <RestDrawer />

      {/* Toast notifications */}
      <Toasts />

      {/* Cloud Authentication & Zero-Data-Loss Backfill Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
};
