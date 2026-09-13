import React from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, Button } from '@packages/ui';

export const ChallengeTrack: React.FC = () => {
  const { challenges, setScreen } = useApp();

  const currentChallenge = challenges.find((c) => c.isCurrent) || challenges[0];
  const currentWeek = currentChallenge ? currentChallenge.weekNumber : 1;
  const totalTargetSessions = challenges.reduce((acc, c) => acc + c.targetSessions, 0);
  const totalCompletedSessions = challenges.reduce((acc, c) => acc + c.completedSessions, 0);
  const progressPercent =
    totalTargetSessions > 0
      ? Math.min(Math.round((totalCompletedSessions / totalTargetSessions) * 100), 100)
      : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-soft-fade">
      {/* Banner Card */}
      <div className="bg-gradient-to-br from-[var(--clay-soft)] to-[var(--surface-warm)] border border-[var(--clay-border)] rounded-2xl p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Badge variant="terracotta">Year-Long Quest</Badge>
          <span className="font-mono text-xs font-bold text-[var(--ochre-seed)]">
            Week {currentWeek} of {challenges.length > 0 ? challenges.length : 52}
          </span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--fg)]">
          52-Week Creative Challenge
        </h2>
        <p className="text-xs sm:text-sm text-[var(--fg-soft)] font-serif italic leading-relaxed">
          A gentle year-long curriculum to cultivate intuitive visual thinking through weekly themed practices.
        </p>

        {/* Year Progress */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono text-[var(--muted)]">
            <span>Overall Journey</span>
            <span>{progressPercent}% Completed ({totalCompletedSessions}/{totalTargetSessions} sessions)</span>
          </div>
          <div className="h-2 bg-[var(--surface-pebble)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Curriculum Weeks Header */}
      <div className="flex justify-between items-baseline">
        <h3 className="font-display text-lg font-semibold text-[var(--fg)]">Curriculum Milestones</h3>
        <span className="font-mono text-xs text-[var(--muted)]">Structured Growth</span>
      </div>

      {/* Milestone Stones List */}
      <div className="flex flex-col gap-3">
        {challenges.map((item) => (
          <div
            key={item.weekNumber}
            onClick={() => {
              if (!item.isLocked) {
                setScreen('challenge-detail');
              }
            }}
            className={`bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm ${
              item.isCurrent
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-md shadow-[var(--clay-glow)] scale-[1.01]'
                : item.isLocked
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:border-[var(--accent)] hover:translate-x-1'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--accent)]">
                  Week {item.weekNumber}
                </span>
                {item.isCurrent && (
                  <Badge variant="terracotta" className="!text-[9px] !py-0 !px-1.5">
                    Active Track
                  </Badge>
                )}
              </div>
              <h4 className="font-display text-base sm:text-lg font-semibold text-[var(--fg)] truncate">
                {item.title}
              </h4>
              <p className="text-xs text-[var(--muted)] truncate font-serif">
                {item.subtitle}
              </p>
            </div>

            <div className="shrink-0 text-right font-mono text-xs">
              {item.isCurrent ? (
                <Button
                  variant="pastelTerracotta"
                  size="sm"
                  className="!min-h-[32px] !py-1 !px-3 font-mono text-xs font-bold"
                >
                  Explore ➔
                </Button>
              ) : item.completedSessions >= item.targetSessions ? (
                <span className="text-[var(--matcha-leaf)] font-bold">✓ Complete</span>
              ) : (
                <span className="text-[var(--muted)]">Locked 🔒</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
