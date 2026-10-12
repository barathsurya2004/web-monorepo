import React, { useEffect } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useStore } from '@/store';
import type { Accent } from '@/types';
import { ACCENT_HEX } from '@/lib/calc';

// ── Re-export shared UI components from workspace @packages/ui ────
export {
  Button,
  type ButtonProps,
  Card as SharedCard,
  type CardProps as SharedCardProps,
  Input as SharedInput,
  type InputProps as SharedInputProps,
  Select as SharedSelect,
  type SelectProps as SharedSelectProps,
  Badge,
  type BadgeProps,
  SegmentedControl,
  type SegmentedControlProps,
  ProgressBar,
  type ProgressBarProps,
  StatCard,
  type StatCardProps,
  Modal,
  type ModalProps,
  ProgressRing,
  type ProgressRingProps,
  Toggle,
  type ToggleProps,
  EmptyState,
  type EmptyStateProps,
} from '@packages/ui';

// ── Page layout primitives ──────────────────────────────────

export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-4 pb-36 pt-4 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  action,
  back,
}: {
  title: React.ReactNode;
  eyebrow?: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  back?: boolean;
}) {
  const { back: goBack, canGoBack } = useStore();
  return (
    <header className="mb-6 flex animate-rise items-end justify-between gap-4">
      <div className="min-w-0">
        {back && canGoBack && (
          <button
            id="page-back"
            onClick={goBack}
            className="-ml-1.5 mb-3 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm text-muted transition-colors hover:text-fg"
          >
            <ChevronLeft size={18} /> Back
          </button>
        )}
        {eyebrow && <div className="label mb-1.5">{eyebrow}</div>}
        <h1 className="truncate text-3xl font-bold text-fg sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-fg">{children}</h2>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = '',
  hover = false,
  onClick,
  id,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  id?: string;
  style?: React.CSSProperties;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      id={id}
      onClick={onClick}
      style={style}
      className={`velvet-card ${hover || onClick ? 'velvet-card-hover cursor-pointer text-left' : ''} ${className}`}
    >
      {children}
    </Comp>
  );
}

export function Stat({
  label,
  value,
  unit,
  accent,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  accent?: Accent;
  sub?: React.ReactNode;
}) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="num text-2xl font-semibold" style={{ color: accent ? ACCENT_HEX[accent] : undefined }}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 text-xs text-dim">{sub}</div>}
    </div>
  );
}

export function AccentDot({ accent, size = 8 }: { accent: Accent; size?: number }) {
  const c = ACCENT_HEX[accent];
  return <span className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: c, boxShadow: `0 0 10px ${c}80` }} />;
}

// ── Progress Ring / Bar ────────────────────────────────────

export function Ring({
  value,
  size = 64,
  stroke = 6,
  color = '#A8E6CF',
  track = 'rgba(255,255,255,0.07)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1), stroke 0.3s', filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color = '#A8E6CF', className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color, boxShadow: `0 0 10px ${color}66` }}
      />
    </div>
  );
}

// ── Bottom sheet / modal ───────────────────────────────────

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-ink-950/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`glass relative flex max-h-[88dvh] w-full animate-sheet flex-col rounded-t-3xl sm:animate-rise sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        {title && (
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="rounded-full p-2 text-muted transition-colors hover:bg-white/5 hover:text-fg" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="safe-bottom border-t border-white/[0.06] px-5 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

// ── Segmented control ──────────────────────────────────────

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: React.ReactNode }>;
  id?: string;
}) {
  return (
    <div id={id} className="inline-flex rounded-xl border border-white/[0.07] bg-ink-950/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            value === o.value ? 'bg-white/10 text-fg shadow-sm' : 'text-muted hover:text-fg'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Empty state alias ──────────────────────────────────────

export function Empty({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="velvet-card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-lav">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
