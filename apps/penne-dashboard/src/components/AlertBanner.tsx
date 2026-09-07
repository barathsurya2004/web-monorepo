import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Pause } from 'lucide-react';
import gsap from 'gsap';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  statusCode?: string | number;
  title: string;
  message?: string;
  method?: string;
  endpoint?: string;
  duration?: number; // ms
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// --- Single GSAP-Powered Alert Banner Item ---
const AlertBannerItem: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 2500;
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timerTweenRef = useRef<gsap.core.Tween | null>(null);
  const isDismissingRef = useRef<boolean>(false);

  // GSAP Smooth Exit Animation
  const handleDismiss = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    if (timerTweenRef.current) {
      timerTweenRef.current.kill();
    }

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -16,
        opacity: 0,
        scale: 0.95,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          onDismiss(toast.id);
        }
      });
    } else {
      onDismiss(toast.id);
    }
  }, [onDismiss, toast.id]);

  // GSAP Smooth Entrance & Depleting Timer Tween
  useEffect(() => {
    const cardEl = cardRef.current;
    const barEl = progressBarRef.current;

    if (!cardEl || !barEl) return;

    // Entrance Animation with GSAP spring-like ease
    gsap.fromTo(
      cardEl,
      { y: -20, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
    );

    // Ultra-smooth GSAP scaleX timer depletion animation
    const tween = gsap.to(barEl, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: duration / 1000,
      ease: 'none',
      onComplete: () => {
        handleDismiss();
      }
    });

    timerTweenRef.current = tween;

    return () => {
      tween.kill();
    };
  }, [duration, handleDismiss]);

  // Pause / Resume Event Handlers
  const handlePause = () => {
    if (timerTweenRef.current && !isDismissingRef.current) {
      timerTweenRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (timerTweenRef.current && !isDismissingRef.current) {
      timerTweenRef.current.play();
      setIsPaused(false);
    }
  };

  // Visual Theme mapping based on ToastType & Status Code
  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-[#232044]/95 backdrop-blur-xl',
          border: 'border-[#A8E6CF]/40 shadow-[0_8px_32px_rgba(168,230,207,0.15)]',
          badgeBg: 'bg-[#A8E6CF]/20 text-[#A8E6CF] border-[#A8E6CF]/40 font-mono',
          progressBg: 'bg-gradient-to-r from-[#A8E6CF] via-[#81B29A] to-[#FBD8B3]',
          icon: <CheckCircle2 className="w-5 h-5 text-[#A8E6CF] shrink-0 mt-0.5" />,
          titleColor: 'text-white'
        };
      case 'error':
        return {
          bg: 'bg-[#2E2038]/95 backdrop-blur-xl',
          border: 'border-[#FFB5A7]/40 shadow-[0_8px_32px_rgba(255,181,167,0.2)]',
          badgeBg: 'bg-[#FFB5A7]/20 text-[#FFB5A7] border-[#FFB5A7]/40 font-mono',
          progressBg: 'bg-gradient-to-r from-[#FFB5A7] via-[#f87171] to-[#ef4444]',
          icon: <XCircle className="w-5 h-5 text-[#FFB5A7] shrink-0 mt-0.5" />,
          titleColor: 'text-white'
        };
      case 'warning':
        return {
          bg: 'bg-[#2E2835]/95 backdrop-blur-xl',
          border: 'border-[#FDE2B8]/40 shadow-[0_8px_32px_rgba(253,226,184,0.15)]',
          badgeBg: 'bg-[#FDE2B8]/20 text-[#FDE2B8] border-[#FDE2B8]/40 font-mono',
          progressBg: 'bg-gradient-to-r from-[#FDE2B8] via-[#fbbf24] to-[#FBD8B3]',
          icon: <AlertTriangle className="w-5 h-5 text-[#FDE2B8] shrink-0 mt-0.5" />,
          titleColor: 'text-white'
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#232044]/95 backdrop-blur-xl',
          border: 'border-[#FBD8B3]/35 shadow-[0_8px_32px_rgba(251,216,179,0.15)]',
          badgeBg: 'bg-[#FBD8B3]/20 text-[#FBD8B3] border-[#FBD8B3]/40 font-mono',
          progressBg: 'bg-gradient-to-r from-[#FBD8B3] via-[#C8B6FF] to-[#A7D7F9]',
          icon: <Info className="w-5 h-5 text-[#FBD8B3] shrink-0 mt-0.5" />,
          titleColor: 'text-white'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      ref={cardRef}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
      className={`relative overflow-hidden rounded-2xl border ${theme.bg} ${theme.border} p-3.5 sm:p-4 shadow-2xl pointer-events-auto w-full max-w-full`}
    >
      {/* Depleting Timer Progress Bar along Top Edge (GSAP ScaleX) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#141210]/60 overflow-hidden">
        <div
          ref={progressBarRef}
          className={`h-full w-full ${theme.progressBg}`}
        />
      </div>

      <div className="flex items-start gap-3 pt-0.5">
        {theme.icon}

        <div className="flex-1 min-w-0 pr-1">
          {/* Header row with Status Code, Method, and Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
            {toast.statusCode && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black tracking-wider uppercase border ${theme.badgeBg}`}>
                {toast.statusCode}
              </span>
            )}
            {toast.method && (
              <span className="px-1.5 py-0.5 rounded bg-[#2E2A27] text-[#A89F95] text-[10px] font-mono font-bold border border-[#3E3835]">
                {toast.method}
              </span>
            )}
            <h4 className={`text-xs sm:text-sm font-bold ${theme.titleColor} truncate max-w-full`}>
              {toast.title}
            </h4>
          </div>

          {/* Body message */}
          {toast.message && (
            <p className="text-xs sm:text-xs text-[#D8D2C9] leading-relaxed break-words font-medium">
              {toast.message}
            </p>
          )}

          {/* Endpoint details */}
          {toast.endpoint && (
            <p className="text-[10px] text-[#8C837A] font-mono mt-1 truncate">
              {toast.endpoint}
            </p>
          )}
        </div>

        {/* Action Controls: Pause Indicator & Mobile-Optimized Dismiss Button */}
        <div className="flex items-center gap-1 shrink-0">
          {isPaused && (
            <span className="text-[9px] text-[#A89F95] font-bold bg-[#2A2623] px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#3E3835]">
              <Pause className="w-2.5 h-2.5 text-amber-400 animate-pulse" /> Paused
            </span>
          )}

          <button
            onClick={handleDismiss}
            className="text-[#A89F95] hover:text-[#F4F1DE] active:scale-95 p-1.5 sm:p-1 rounded-xl hover:bg-[#342F2C] transition-all min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            title="Dismiss Notification"
            aria-label="Dismiss Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Mobile-Optimized Floating Toast Overlay ---
export const AlertBannerContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[max(calc(env(safe-area-inset-top,0px)+0.75rem),1.25rem)] left-3 right-3 sm:left-auto sm:right-6 sm:top-6 z-[9999] flex flex-col gap-2.5 w-auto sm:w-[400px] sm:max-w-md pointer-events-none max-w-full">
      {toasts.map((t) => (
        <AlertBannerItem key={t.id} toast={t} onDismiss={removeToast} />
      ))}
    </div>
  );
};

// --- Toast Provider Component ---
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id' | 'createdAt'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = {
      ...toast,
      id,
      createdAt: Date.now()
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <AlertBannerContainer />
    </ToastContext.Provider>
  );
};
