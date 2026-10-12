import React from 'react';
import { useStore } from '@/store';
import { Trophy, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toasts: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const isPR = t.tone === 'pr';

        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all animate-toast cursor-pointer ${
              isPR
                ? 'shimmer-gold border-amber/50 bg-ink-850/95 text-amber'
                : t.tone === 'coral'
                ? 'border-coral/40 bg-ink-850/95 text-coral'
                : 'border-mint/40 bg-ink-850/95 text-mint'
            }`}
          >
            <div className="shrink-0 pt-0.5">
              {isPR ? (
                <Trophy size={18} className="animate-bounce text-amber" />
              ) : t.tone === 'coral' ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-fg tracking-tight">{t.title}</div>
              {t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(t.id);
              }}
              className="text-muted hover:text-fg p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
