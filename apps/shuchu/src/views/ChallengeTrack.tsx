import React from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, Button } from '@packages/ui';
import { Check, Lock, ArrowRight } from 'lucide-react';

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
          One creative experiment every week. Cultivate consistency and creative confidence through weekly mindful prompts.
        </p>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between font-mono text-xs font-semibold text-[var(--fg-soft)]">
            <span>Overall Path Progress</span>
            <span>{totalCompletedSessions} of {totalTargetSessions} Sessions</span>
          </div>
          <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--clay-border)]">
            <div
              className="h-full bg-[var(--clay-terracotta)] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Week Grid / List */}
      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold text-[var(--fg)]">Quest Milestones</h3>

        {challenges.length === 0 ? (
          <div className="text-center py-8 bg-[var(--surface-warm)] border border-dashed border-[var(--border-subtle)] rounded-2xl space-y-2 p-6">
            <p className="text-xs sm:text-sm font-medium text-[var(--fg)]">No active challenge quests</p>
            <p className="text-xs text-[var(--muted)] font-serif italic">
              Plant daily habits and practice in the sanctuary to begin your personalized mindful journey.
            </p>
            <Button
              variant="pastelTerracotta"
              size="sm"
              onClick={() => setScreen('today')}
              className="font-mono text-xs font-bold !min-h-[34px] mt-1"
            >
              Go to Today
            </Button>
          </div>
        ) : (
          challenges.map((item) => (
            <div
              key={item.weekNumber}
              onClick={() => {
                if (!item.isLocked) {
                  setScreen('challenge-detail');
                }
              }}
              className={`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all cursor-pointer ${
                item.isCurrent
                  ? 'bg-[var(--surface)] border-[var(--accent)] shadow-md'
                  : item.completedSessions >= item.targetSessions
                  ? 'bg-[var(--surface-warm)] border-[var(--matcha-border)] opacity-85'
                  : 'bg-[var(--surface-warm)] border-[var(--border-subtle)] opacity-60'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--muted)]">
                    Week {item.weekNumber}
                  </span>
                  {item.isCurrent && (
                    <Badge variant="terracotta" className="!text-[9px] !py-0 !px-1.5">
                      Active This Week
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
                    className="!min-h-[32px] !py-1 !px-3 font-mono text-xs font-bold gap-1"
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : item.completedSessions >= item.targetSessions ? (
                  <span className="text-[var(--matcha-leaf)] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </span>
                ) : (
                  <span className="text-[var(--muted)] flex items-center gap-1">
                    <span>Locked</span>
                    <Lock className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
