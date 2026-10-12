import React from 'react';
import { useStore } from '@/store';
import { Trophy, CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export const Toasts: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-[max(calc(env(safe-area-inset-top,0px)+0.75rem),3.25rem)] left-3 right-3 sm:left-auto sm:right-6 sm:top-6 z-[9999] flex flex-col gap-2.5 w-auto sm:w-[400px] sm:max-w-md pointer-events-none max-w-full"
    >
      {toasts.map((t) => {
        const isPR = t.tone === 'pr';
        const isCoral = t.tone === 'coral';
        const isAmber = t.tone === 'amber';
        const isLav = t.tone === 'lav';

        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-2xl border transition-all animate-toast cursor-pointer select-none ${
              isPR
                ? 'shimmer-gold border-amber/50 bg-ink-850/98 text-amber shadow-[0_12px_36px_rgba(253,226,184,0.15)]'
                : isCoral
                ? 'border-coral/30 bg-ink-850/98 text-coral shadow-[0_12px_36px_rgba(255,181,167,0.1)]'
                : isAmber
                ? 'border-peach/30 bg-ink-850/98 text-peach shadow-[0_12px_36px_rgba(251,216,179,0.1)]'
                : isLav
                ? 'border-lav/30 bg-ink-850/98 text-lav shadow-[0_12px_36px_rgba(200,182,255,0.1)]'
                : 'border-mint/30 bg-ink-850/98 text-mint shadow-[0_12px_36px_rgba(168,230,207,0.1)]'
            }`}
          >
            <div
              className={`shrink-0 p-1.5 rounded-xl ${
                isPR
                  ? 'bg-amber/20 text-amber'
                  : isCoral
                  ? 'bg-coral/20 text-coral'
                  : isAmber
                  ? 'bg-peach/20 text-peach'
                  : isLav
                  ? 'bg-lav/20 text-lav'
                  : 'bg-mint/20 text-mint'
              }`}
            >
              {isPR ? (
                <Trophy size={18} className="animate-bounce text-amber" />
              ) : isCoral ? (
                <AlertCircle size={18} />
              ) : isAmber ? (
                <Info size={18} />
              ) : isLav ? (
                <Sparkles size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-sm font-black text-fg tracking-tight">{t.title}</div>
              {t.body && <p className="mt-0.5 text-xs text-slate-300 font-sans leading-relaxed">{t.body}</p>}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(t.id);
              }}
              className="text-muted hover:text-fg p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
