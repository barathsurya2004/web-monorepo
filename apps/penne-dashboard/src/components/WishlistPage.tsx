import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag, Plus, Zap, TrendingUp, Target, Trash2, Edit3, X,
  ChevronRight, Sparkles, Wallet, BarChart3, CheckCircle2,
  Clock, Loader2, AlertTriangle, WifiOff, Settings2, RefreshCw,
} from 'lucide-react';
import {
  wishlistApi,
  e5ToINR,
  inrToE5,
  formatWishlistMonths,
  PRIORITY_LABELS,
  URGENCY_LABELS,
  type WishlistForecastSummary,
  type ItemForecast,
  type ItemAllocationSimulation,
  type CreateWishlistItemPayload,
} from '../services/api';
import { QUERY_KEYS } from '../hooks/useDashboardData';

// ─── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

const ITEM_TYPES = ['want', 'need', 'investment'] as const;
type ItemType = typeof ITEM_TYPES[number];

const TYPE_META: Record<ItemType, { label: string; emoji: string; accent: string; bg: string }> = {
  want:       { label: 'Want',       emoji: '✨', accent: '#C8B6FF', bg: 'rgba(200,182,255,0.12)' },
  need:       { label: 'Need',       emoji: '🎯', accent: '#FBD8B3', bg: 'rgba(251,216,179,0.12)' },
  investment: { label: 'Investment', emoji: '📈', accent: '#A8E6CF', bg: 'rgba(168,230,207,0.12)' },
};

// ─── Progress Ring ───────────────────────────────────────────────────────────

const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number; color?: string }> = ({
  pct, size = 52, stroke = 4, color = '#A8E6CF',
}) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (clamp(pct, 0, 100) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  );
};

// ─── Star Rating ─────────────────────────────────────────────────────────────

const StarRating: React.FC<{
  value: number; onChange?: (v: number) => void;
  max?: number; color?: string; label?: string;
}> = ({ value, onChange, max = 5, color = '#FBD8B3', label }) => (
  <div className="flex flex-col gap-1">
    {label && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>}
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <button
          key={i} type="button"
          onClick={() => onChange?.(i)}
          disabled={!onChange}
          className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition-all ${
            onChange ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
          } ${i <= value ? 'opacity-100' : 'opacity-20'}`}
          style={{ color }}
        >●</button>
      ))}
    </div>
  </div>
);

// ─── Budget Settings Modal ───────────────────────────────────────────────────

const BudgetModal: React.FC<{
  currentBudgetE5: number;
  onSave: (budgetE5: number, salaryDay: number) => Promise<void>;
  onClose: () => void;
}> = ({ currentBudgetE5, onSave, onClose }) => {
  const [budgetInr, setBudgetInr] = useState(Math.round(currentBudgetE5 / 100000));
  const [salaryDay, setSalaryDay] = useState(25);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (budgetInr <= 0) { setErr('Budget must be positive'); return; }
    setSaving(true);
    try { await onSave(inrToE5(budgetInr), salaryDay); onClose(); }
    catch (e: any) { setErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md velvet-card p-6 animate-slide-down" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,216,179,0.15)' }}>
              <Wallet className="w-4 h-4" style={{ color: '#FBD8B3' }} />
            </div>
            <h2 className="font-bold text-[#F5F3FF] text-lg">Budget Settings</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Monthly Budget (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">₹</span>
              <input
                type="number" value={budgetInr || ''}
                onChange={(e) => setBudgetInr(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#F5F3FF] font-mono text-sm focus:outline-none focus:border-[#FBD8B3]/50 transition-colors"
                placeholder="e.g. 50000"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Surplus = Budget − Monthly expenses in your salary cycle</p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Salary Day (1–31)</label>
            <div className="flex gap-1.5 flex-wrap">
              {[1, 5, 10, 15, 20, 25, 28, 30, 31].map((d) => (
                <button
                  key={d} type="button" onClick={() => setSalaryDay(d)}
                  className={`w-9 h-9 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    salaryDay === d ? 'text-[#1A1735]' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                  style={salaryDay === d ? { background: '#FBD8B3' } : {}}
                >{d}</button>
              ))}
              <input
                type="number" value={salaryDay}
                onChange={(e) => setSalaryDay(clamp(parseInt(e.target.value) || 1, 1, 31))}
                className="w-14 px-2 py-0 h-9 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-mono text-xs text-center focus:outline-none focus:border-[#FBD8B3]/50"
                min={1} max={31}
              />
            </div>
          </div>

          {err && <p className="text-xs flex items-center gap-1.5" style={{ color: '#FFB5A7' }}><AlertTriangle className="w-3.5 h-3.5" />{err}</p>}

          <button
            onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:opacity-90"
            style={{ background: '#FBD8B3', color: '#1A1735' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Save Budget Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Add / Edit Item Modal ───────────────────────────────────────────────────

const ItemModal: React.FC<{
  initial?: Partial<CreateWishlistItemPayload & { id: string }>;
  onSave: (p: CreateWishlistItemPayload & { id?: string }) => Promise<void>;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [targetInr, setTargetInr] = useState(initial?.target_amount_e5 ? Math.round(initial.target_amount_e5 / 100000) : 0);
  const [priority, setPriority] = useState(initial?.priority ?? 3);
  const [urgency, setUrgency] = useState(initial?.urgency ?? 3);
  const [itemType, setItemType] = useState<ItemType>((initial?.item_type as ItemType) ?? 'want');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const isEdit = Boolean(initial?.id);

  const handleSave = async () => {
    if (!title.trim()) { setErr('Title is required'); return; }
    if (targetInr <= 0) { setErr('Target amount must be positive'); return; }
    setSaving(true);
    try {
      await onSave({
        ...(isEdit ? { id: initial!.id } : {}),
        title: title.trim(),
        target_amount_e5: inrToE5(targetInr),
        priority, urgency,
        item_type: itemType,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (e: any) { setErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const typeMeta = TYPE_META[itemType];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md velvet-card p-6 animate-slide-down max-h-[90dvh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: typeMeta.bg }}>
              {typeMeta.emoji}
            </div>
            <h2 className="font-bold text-[#F5F3FF] text-lg">{isEdit ? 'Edit Item' : 'New Wish'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">What do you wish for?</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#F5F3FF] text-sm focus:outline-none focus:border-[#FBD8B3]/50 transition-colors"
              placeholder="e.g. Keychron Q1 Keyboard"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Target Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">₹</span>
              <input
                type="number" value={targetInr || ''}
                onChange={(e) => setTargetInr(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#F5F3FF] font-mono text-sm focus:outline-none focus:border-[#FBD8B3]/50 transition-colors"
                placeholder="e.g. 8000"
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Category</label>
            <div className="flex gap-2">
              {ITEM_TYPES.map((t) => {
                const m = TYPE_META[t];
                return (
                  <button
                    key={t} type="button" onClick={() => setItemType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      itemType === t ? 'border-transparent' : 'border-white/10 opacity-50 hover:opacity-70'
                    }`}
                    style={itemType === t ? { background: m.bg, color: m.accent } : {}}
                  >
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority + Urgency */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <StarRating label="Priority" value={priority} onChange={setPriority} color="#FBD8B3" />
            <StarRating label="Urgency" value={urgency} onChange={setUrgency} color="#C8B6FF" />
            <div className="col-span-2 text-[10px] text-slate-500 font-mono">
              Weight = {priority} × {urgency} = <span className="text-[#FBD8B3] font-bold">{priority * urgency}</span>
              &nbsp;· Higher weight → more surplus
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Notes (optional)</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#F5F3FF] text-sm focus:outline-none focus:border-[#FBD8B3]/50 resize-none transition-colors"
              placeholder="Why do you want this? Link, specs…"
            />
          </div>

          {err && <p className="text-xs flex items-center gap-1.5" style={{ color: '#FFB5A7' }}><AlertTriangle className="w-3.5 h-3.5" />{err}</p>}

          <button
            onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:opacity-90"
            style={{ background: '#FBD8B3', color: '#1A1735' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isEdit ? 'Save Changes' : 'Add to Wishlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Distribute Toast ────────────────────────────────────────────────────────

const DistributeToast: React.FC<{ results: ItemAllocationSimulation[]; onClose: () => void }> = ({ results, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 animate-slide-down">
      <div className="velvet-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(168,230,207,0.2)' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#A8E6CF' }} />
          </div>
          <span className="font-bold text-sm text-[#F5F3FF]">Surplus Distributed!</span>
          <button onClick={onClose} className="ml-auto cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-1.5">
          {results.map((r) => (
            <div key={r.item_id} className="flex items-center gap-2 text-xs">
              {r.is_fulfilled
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#A8E6CF' }} />
                : <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: '#FBD8B3' }} />
              }
              <span className="text-slate-300 truncate">{r.item_title}</span>
              <span className="ml-auto shrink-0 font-mono font-bold" style={{ color: '#A8E6CF' }}>
                +{e5ToINR(r.allocated_e5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Wishlist Card ───────────────────────────────────────────────────────────

const URGENCY_COLORS = ['#A7D7F9', '#A8E6CF', '#FBD8B3', '#FFB5A7', '#C8B6FF'];

const WishlistCard: React.FC<{
  forecast: ItemForecast;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ forecast, onEdit, onDelete }) => {
  const pct = clamp(forecast.progress_percentage, 0, 100);
  const fulfilled = forecast.remaining_amount_e5 <= 0;
  const ringColor = fulfilled ? '#A8E6CF' : URGENCY_COLORS[Math.max(0, forecast.urgency - 1)];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`velvet-card group transition-all duration-300 ${fulfilled ? 'opacity-70' : 'hover-lift'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Progress Ring */}
          <div className="relative flex items-center justify-center shrink-0" style={{ width: 52, height: 52 }}>
            <ProgressRing pct={pct} size={52} stroke={4} color={ringColor} />
            <span className="absolute text-[10px] font-mono font-bold" style={{ color: ringColor }}>
              {fulfilled ? '✓' : `${Math.round(pct)}%`}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-semibold text-sm text-[#F5F3FF] truncate">{forecast.item_title}</span>
              {fulfilled && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono" style={{ background: 'rgba(168,230,207,0.15)', color: '#A8E6CF' }}>
                  Fulfilled ✓
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 text-[11px]">
              <span className="font-mono font-bold text-[#F5F3FF]">{e5ToINR(forecast.saved_amount_e5)}</span>
              <span className="text-slate-500">of {e5ToINR(forecast.target_amount_e5)}</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: ringColor }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#F5F3FF] hover:bg-white/10 transition-all cursor-pointer">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-all cursor-pointer hover:bg-white/10" style={{ ['--hover-color' as any]: '#FFB5A7' }}>
              <Trash2 className="w-3.5 h-3.5 hover:text-[#FFB5A7]" />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#F5F3FF] transition-all cursor-pointer ${expanded ? 'bg-white/10 text-[#F5F3FF]' : 'hover:bg-white/10'}`}
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Detail */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/8 animate-slide-down grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Priority</p>
              <p className="text-xs font-semibold text-[#F5F3FF] mb-1">{PRIORITY_LABELS[forecast.priority] ?? forecast.priority}</p>
              <StarRating value={forecast.priority} max={5} color="#FBD8B3" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Urgency</p>
              <p className="text-xs font-semibold text-[#F5F3FF] mb-1">{URGENCY_LABELS[forecast.urgency] ?? forecast.urgency}</p>
              <StarRating value={forecast.urgency} max={5} color="#C8B6FF" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Weight</p>
              <p className="text-base font-mono font-bold text-[#F5F3FF]">{forecast.weight}</p>
              <p className="text-[10px] text-slate-500">P × U</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Monthly</p>
              <p className="text-base font-mono font-bold" style={{ color: '#A8E6CF' }}>
                {e5ToINR(forecast.monthly_contribution_e5)}
              </p>
              <p className="text-[10px] text-slate-500">from surplus</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">ETA</p>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-sm font-semibold text-[#F5F3FF]">
                  {fulfilled ? '🎉 Already saved!' : formatWishlistMonths(forecast.estimated_months)}
                </span>
                {forecast.estimated_date && !fulfilled && (
                  <span className="text-[10px] text-slate-500">
                    ({new Date(forecast.estimated_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main WishlistPage ───────────────────────────────────────────────────────

export const WishlistPage: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: forecast = null,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<WishlistForecastSummary>({
    queryKey: QUERY_KEYS.wishlist,
    queryFn: () => wishlistApi.getWishlists(),
    staleTime: 1000 * 60 * 5, // Keep fresh for 5 minutes; cached data renders instantly on tab return
    refetchOnWindowFocus: true,
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [addModal, setAddModal] = useState<{ open: boolean; editItem?: ItemForecast | null }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [distributing, setDistributing] = useState(false);
  const [distributeResult, setDistributeResult] = useState<ItemAllocationSimulation[] | null>(null);

  const error = actionError || (queryError ? (queryError as any).message || 'Failed to load wishlist' : null);
  const offline = Boolean(
    error && (
      error.includes('fetch') ||
      error.includes('NetworkError') ||
      error.includes('TypeError') ||
      error.includes('BACKEND_UNAVAILABLE')
    )
  );

  const handleSaveItem = async (payload: CreateWishlistItemPayload & { id?: string }) => {
    setActionError(null);
    try {
      if (payload.id) {
        await wishlistApi.updateItem({ ...payload, id: payload.id });
      } else {
        await wishlistApi.createItem(payload);
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
    } catch (e: any) {
      setActionError(e.message || 'Failed to save wish');
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await wishlistApi.deleteItem(id);
      setDeleteConfirm(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
    } catch (e: any) {
      setActionError(e.message || 'Failed to delete wish');
    }
  };

  const handleDistribute = async () => {
    setDistributing(true);
    setActionError(null);
    try {
      const res = await wishlistApi.distributeSurplus();
      setDistributeResult(res.allocations);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
    } catch (e: any) {
      setActionError(e.message || 'Distribution failed');
    } finally {
      setDistributing(false);
    }
  };

  const items = forecast?.items ?? [];
  const activeItems = items.filter((i) => i.remaining_amount_e5 > 0);
  const fulfilledItems = items.filter((i) => i.remaining_amount_e5 <= 0);
  const totalTarget = items.reduce((s, i) => s + i.target_amount_e5, 0);
  const totalSaved = items.reduce((s, i) => s + i.saved_amount_e5, 0);
  const overallPct = totalTarget > 0 ? clamp((totalSaved / totalTarget) * 100, 0, 100) : 0;

  const budget = forecast?.monthly_budget_e5 ?? 0;
  const expenses = forecast?.cycle_expenses_e5 ?? 0;
  const surplus = forecast?.projected_surplus_e5 ?? 0;
  const savingsRate = forecast?.savings_rate_percent ?? 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-32 space-y-4">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Wishlist</h1>
          <p className="text-xs text-slate-400 mt-0.5">Intentions guided by surplus · weighted cascade</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActionError(null); refetch(); }} disabled={isFetching}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Budget
          </button>
          <button
            onClick={() => setAddModal({ open: true })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:opacity-90"
            style={{ background: '#FBD8B3', color: '#1A1735' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Wish
          </button>
        </div>
      </div>

      {/* ── Error / Offline ─────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl text-sm border" style={{ background: 'rgba(255,181,167,0.1)', borderColor: 'rgba(255,181,167,0.3)', color: '#FFB5A7' }}>
          {offline ? <WifiOff className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="flex-1">{error}</span>
          <button onClick={() => { setActionError(null); refetch(); }} className="font-bold underline cursor-pointer text-xs">Retry</button>
        </div>
      )}

      {/* ── Loading Skeleton ─────────────────────────────────────── */}
      {isLoading && !forecast && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 velvet-card animate-pulse" style={{ opacity: 0.4 }} />
          ))}
        </div>
      )}

      {/* ── No Budget Warning ────────────────────────────────────── */}
      {!isLoading && !error && budget === 0 && forecast !== null && (
        <button
          onClick={() => setShowBudgetModal(true)}
          className="w-full p-4 rounded-xl text-left cursor-pointer hover:opacity-90 transition-opacity border flex items-center gap-3"
          style={{ background: 'rgba(251,216,179,0.08)', borderColor: 'rgba(251,216,179,0.2)' }}
        >
          <Wallet className="w-5 h-5 shrink-0" style={{ color: '#FBD8B3' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#FBD8B3' }}>Set your monthly budget</p>
            <p className="text-xs text-slate-400">Required to compute surplus and forecast ETAs</p>
          </div>
          <ChevronRight className="w-4 h-4 ml-auto" style={{ color: '#FBD8B3' }} />
        </button>
      )}

      {/* ── Budget Cycle Card ────────────────────────────────────── */}
      {forecast && budget > 0 && (
        <div className="velvet-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" style={{ color: '#A8E6CF' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This Salary Cycle</span>
            <span className="text-[10px] text-slate-500 ml-auto">
              {new Date(forecast.cycle_start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {' – '}
              {new Date(forecast.cycle_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Budget</p>
              <p className="text-lg font-mono font-bold text-[#F5F3FF]">{e5ToINR(budget)}</p>
              <p className="text-[10px] text-slate-500">monthly</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Spent</p>
              <p className="text-lg font-mono font-bold" style={{ color: '#FFB5A7' }}>{e5ToINR(expenses)}</p>
              <p className="text-[10px] text-slate-500">this cycle</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Surplus</p>
              <p className="text-lg font-mono font-bold" style={{ color: surplus > 0 ? '#A8E6CF' : 'rgba(255,255,255,0.3)' }}>
                {surplus > 0 ? e5ToINR(surplus) : '—'}
              </p>
              <p className="text-[10px] text-slate-500">{surplus > 0 ? `${Math.round(savingsRate)}% saved` : 'over budget'}</p>
            </div>
          </div>

          {/* Spend bar */}
          <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${clamp((expenses / (budget || 1)) * 100, 0, 100)}%`,
                background: expenses > budget ? '#FFB5A7' : surplus > budget * 0.3 ? '#A8E6CF' : '#FBD8B3',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 font-mono">
            <span>₹0</span><span>{e5ToINR(budget)}</span>
          </div>

          {/* Distribute button */}
          {surplus > 0 && activeItems.length > 0 && (
            <button
              onClick={handleDistribute} disabled={distributing}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 hover:opacity-90"
              style={{ background: 'rgba(168,230,207,0.12)', color: '#A8E6CF', border: '1px solid rgba(168,230,207,0.25)' }}
            >
              {distributing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Distribute {e5ToINR(surplus)} Across Wishes
            </button>
          )}
        </div>
      )}

      {/* ── Overall Progress ─────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="velvet-card p-4 flex items-center gap-4">
          <ProgressRing pct={overallPct} size={56} stroke={5} color="#C8B6FF" />
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Total Progress</p>
            <p className="text-lg font-mono font-bold text-[#F5F3FF]">
              {e5ToINR(totalSaved)} <span className="text-sm font-normal text-slate-400">of {e5ToINR(totalTarget)}</span>
            </p>
            <p className="text-[10px] text-slate-500">{fulfilledItems.length} fulfilled · {activeItems.length} in progress</p>
          </div>
          <p className="font-mono font-bold text-2xl" style={{ color: '#C8B6FF' }}>{Math.round(overallPct)}%</p>
        </div>
      )}

      {/* ── Active Items ─────────────────────────────────────────── */}
      {activeItems.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            In Progress ({activeItems.length})
          </p>
          {activeItems.map((item) => (
            <WishlistCard
              key={item.item_id} forecast={item}
              onEdit={() => setAddModal({ open: true, editItem: item })}
              onDelete={() => setDeleteConfirm(item.item_id)}
            />
          ))}
        </div>
      )}

      {/* ── Fulfilled Items ──────────────────────────────────────── */}
      {fulfilledItems.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#A8E6CF' }} />
            Fulfilled ({fulfilledItems.length})
          </p>
          {fulfilledItems.map((item) => (
            <WishlistCard
              key={item.item_id} forecast={item}
              onEdit={() => setAddModal({ open: true, editItem: item })}
              onDelete={() => setDeleteConfirm(item.item_id)}
            />
          ))}
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────────── */}
      {!isLoading && !error && forecast !== null && items.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <ShoppingBag className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <p className="font-bold text-lg text-[#F5F3FF]">Your wishlist is empty</p>
            <p className="text-xs text-slate-400 mt-1">Add something you've been meaning to save for</p>
          </div>
          <button
            onClick={() => setAddModal({ open: true })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer hover:opacity-90"
            style={{ background: '#FBD8B3', color: '#1A1735' }}
          >
            <Plus className="w-4 h-4" />
            Add First Wish
          </button>
        </div>
      )}

      {/* ── Algorithm Note ────────────────────────────────────────── */}
      {items.length > 1 && (
        <div className="p-4 rounded-xl text-[10px] text-slate-500 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <span className="font-bold text-slate-400">How it works: </span>
          Surplus is split proportionally by Weight = Priority × Urgency (iterative waterfall). Items that hit their target cascade overflow to remaining active wishes.
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────── */}
      {showBudgetModal && (
        <BudgetModal
          currentBudgetE5={budget}
          onSave={async (e5, day) => {
            await wishlistApi.updateBudgetSettings(e5, day);
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
          }}
          onClose={() => setShowBudgetModal(false)}
        />
      )}

      {addModal.open && (
        <ItemModal
          initial={addModal.editItem ? {
            title: addModal.editItem.item_title,
            target_amount_e5: addModal.editItem.target_amount_e5,
            priority: addModal.editItem.priority,
            urgency: addModal.editItem.urgency,
          } : undefined}
          onSave={handleSaveItem}
          onClose={() => setAddModal({ open: false })}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-xs velvet-card p-6 text-center animate-slide-down" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-8 h-8 mx-auto mb-3" style={{ color: '#FFB5A7' }} />
            <p className="font-bold text-[#F5F3FF] mb-1">Delete this wish?</p>
            <p className="text-xs text-slate-400 mb-5">This removes all saved amounts and allocation history.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/5 transition-all cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer hover:opacity-90"
                style={{ background: 'rgba(255,181,167,0.15)', color: '#FFB5A7', border: '1px solid rgba(255,181,167,0.3)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {distributeResult && <DistributeToast results={distributeResult} onClose={() => setDistributeResult(null)} />}
    </div>
  );
};
