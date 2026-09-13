import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { DockNav } from '@/components/DockNav';
import { AddHabitModal } from '@/components/AddHabitModal';

// Views
import { TodayDashboard } from '@/views/TodayDashboard';
import { EmptyToday } from '@/views/EmptyToday';
import { FocusSanctuary } from '@/views/FocusSanctuary';
import { FocusComplete } from '@/views/FocusComplete';
import { HabitDetail } from '@/views/HabitDetail';
import { HabitsLibrary } from '@/views/HabitsLibrary';
import { ConsistencyCalendar } from '@/views/ConsistencyCalendar';
import { GrowthAnalytics } from '@/views/GrowthAnalytics';
import { ChallengeTrack } from '@/views/ChallengeTrack';
import { ChallengeDetail } from '@/views/ChallengeDetail';
import { SettingsView } from '@/views/SettingsView';

export const AppContent: React.FC = () => {
  const { activeScreen } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Scroll window to top whenever page changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeScreen]);

  const renderActiveView = () => {
    switch (activeScreen) {
      case 'today':
        return <TodayDashboard onOpenAddModal={() => setIsAddModalOpen(true)} />;
      case 'empty-today':
        return <EmptyToday onOpenAddModal={() => setIsAddModalOpen(true)} />;
      case 'focus':
        return <FocusSanctuary />;
      case 'focus-complete':
        return <FocusComplete />;
      case 'detail':
        return <HabitDetail />;
      case 'library':
        return <HabitsLibrary onOpenAddModal={() => setIsAddModalOpen(true)} />;
      case 'calendar':
        return <ConsistencyCalendar />;
      case 'analytics':
        return <GrowthAnalytics onOpenAddModal={() => setIsAddModalOpen(true)} />;
      case 'challenge':
        return <ChallengeTrack />;
      case 'challenge-detail':
        return <ChallengeDetail />;
      case 'settings':
        return <SettingsView />;
      default:
        return <TodayDashboard onOpenAddModal={() => setIsAddModalOpen(true)} />;
    }
  };

  // Fullscreen, non-scrolling Focus Sanctuary
  if (activeScreen === 'focus') {
    return (
      <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300 flex flex-col justify-center">
        <FocusSanctuary />
        <AddHabitModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300">
      {/* Top App Header */}
      <Header onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Main Responsive App Canvas with adaptive padding */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-3.5 sm:px-6 pt-2 sm:pt-6 pb-32 md:pb-12">
        {renderActiveView()}
      </main>

      {/* Fixed Floating Bottom Navigation (Mobile View) */}
      <DockNav />

      {/* Add Habit Modal Sheet */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
