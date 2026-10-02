import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag, Plus, Zap, TrendingUp, Target, Trash2, Edit3, X,
  ChevronRight, Sparkles, Wallet, BarChart3, CheckCircle2,
  Clock, Loader2, AlertTriangle, WifiOff, Settings2, RefreshCw,
  Coins, Landmark, CreditCard,
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
import { useToast } from './AlertBanner';
import { PageTagHeader } from './PageTagHeader';

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

// ─── Mobile-First Allocate Bottom Sheet ──────────────────────────────────────

interface AllocateMoneyModalProps {
  item: ItemForecast;
  onClose: () => void;
  onSuccess: (allocation: ItemAllocationSimulation) => void;
}

const AllocateMoneyModal: React.FC<AllocateMoneyModalProps> = ({ item, onClose, onSuccess }) => {
  const neededINR = Math.max(0, Math.round(item.remaining_amount_e5 / 100000));
  const targetINR = Math.round(item.target_amount_e5 / 100000);
  const savedINR = Math.round(item.saved_amount_e5 / 100000);

  // Default to full needed amount for 1-tap fulfillment
  const [allocatedINR, setAllocatedINR] = useState<number>(neededINR > 0 ? neededINR : 0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_account' | 'bank_card'>('bank_account');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customInputStr, setCustomInputStr] = useState<string>(String(neededINR));
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  // Projected calculation
  const projectedSaved = savedINR + (allocatedINR || 0);
  const projectedPct = targetINR > 0 ? clamp((projectedSaved / targetINR) * 100, 0, 100) : 100;
  const willFulfill = projectedSaved >= targetINR;

  const quickPresets = useMemo(() => {
    const list: Array<{ label: string; amount: number }> = [];
    if (neededINR > 0) {
      list.push({ label: `Full (₹${neededINR.toLocaleString('en-IN')})`, amount: neededINR });
      if (neededINR >= 2000) {
        list.push({ label: `50% (₹${Math.round(neededINR / 2).toLocaleString('en-IN')})`, amount: Math.round(neededINR / 2) });
      }
      if (neededINR > 1000 && !list.some((p) => p.amount === 1000)) {
        list.push({ label: '₹1,000', amount: 1000 });
      }
      if (neededINR > 500 && !list.some((p) => p.amount === 500)) {
        list.push({ label: '₹500', amount: 500 });
      }
    }
    return list;
  }, [neededINR]);

  const selectPreset = (amt: number) => {
    setAllocatedINR(amt);
    setCustomInputStr(String(amt));
    setIsCustomMode(false);
    setErr(null);
  };

  const handleCustomChange = (valStr: string) => {
    setCustomInputStr(valStr);
    const parsed = parseFloat(valStr) || 0;
    setAllocatedINR(parsed);
    setErr(null);
  };

  const handleAllocate = async () => {
    if (allocatedINR <= 0) {
      setErr('Please select or enter an amount greater than ₹0');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const amountE5 = inrToE5(allocatedINR);
      const res = await wishlistApi.allocateMoney(item.item_id, amountE5, paymentMethod);
      onSuccess(res.allocation);
      onClose();
    } catch (e: any) {
      setErr(e.message || 'Failed to allocate money');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#24204A] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-6 shadow-2xl animate-slide-up flex flex-col space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Allocate Funds</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#A8E6CF]/15 text-[#A8E6CF] font-bold">
                ₹{neededINR.toLocaleString('en-IN')} needed
              </span>
            </div>
            <h3 className="text-base font-bold text-[#F5F3FF] truncate mt-0.5">{item.item_title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Hero */}
        <div className="py-3 px-4 rounded-2xl bg-white/[0.04] border border-white/5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Allocation Amount</p>
          <div className="flex items-center justify-center gap-1 font-mono font-black text-3xl sm:text-4xl text-[#A8E6CF]">
            <span>₹</span>
            {isCustomMode ? (
              <input
                type="number"
                min="1"
                step="any"
                value={customInputStr}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-44 bg-transparent border-b-2 border-[#A8E6CF] text-center font-mono font-black focus:outline-none text-[#A8E6CF]"
                autoFocus
              />
            ) : (
              <span onClick={() => setIsCustomMode(true)} className="cursor-pointer hover:underline" title="Tap to enter custom amount">
                {allocatedINR.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Live Progress Projection */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>{Math.round(item.progress_percentage)}% saved</span>
              <span className={willFulfill ? 'text-[#A8E6CF] font-bold' : 'text-slate-300'}>
                {willFulfill ? '🎉 100% Fulfilled!' : `➔ ${Math.round(projectedPct)}% after allocation`}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#C8B6FF] to-[#A8E6CF]"
                style={{ width: `${projectedPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Presets / Steppers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Quick Select</span>
            <button
              type="button"
              onClick={() => setIsCustomMode((v) => !v)}
              className="text-xs text-[#FBD8B3] hover:underline cursor-pointer font-bold"
            >
              {isCustomMode ? 'Use Presets' : 'Custom Amount'}
            </button>
          </div>

          {!isCustomMode ? (
            <div className="grid grid-cols-2 gap-2">
              {quickPresets.map((p) => {
                const isSelected = allocatedINR === p.amount;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => selectPreset(p.amount)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-[#A8E6CF]/20 text-[#A8E6CF] border-[#A8E6CF]/50 shadow-sm'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {p.amount === neededINR && <Sparkles className="w-3.5 h-3.5 text-[#A8E6CF]" />}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCustomChange(String(Math.max(0, allocatedINR - 500)))}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:bg-white/10 active:scale-95"
              >
                - ₹500
              </button>
              <button
                type="button"
                onClick={() => handleCustomChange(String(allocatedINR + 500))}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:bg-white/10 active:scale-95"
              >
                + ₹500
              </button>
              <button
                type="button"
                onClick={() => handleCustomChange(String(allocatedINR + 1000))}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:bg-white/10 active:scale-95"
              >
                + ₹1,000
              </button>
            </div>
          )}
        </div>

        {/* Account Selector (Recorded to Ledger) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Deduct From (Ledger Account)</span>
            <span className="text-[10px] text-[#A8E6CF] font-bold">Ledger Debit</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_account')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-2 active:scale-95 ${
                paymentMethod === 'bank_account'
                  ? 'bg-[#64D2FF]/20 text-[#64D2FF] border-[#64D2FF]/50 shadow-sm'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Primary Bank</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_card')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-2 active:scale-95 ${
                paymentMethod === 'bank_card'
                  ? 'bg-[#C8B6FF]/20 text-[#C8B6FF] border-[#C8B6FF]/50 shadow-sm'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Obsidian Card</span>
            </button>
          </div>
          <p className="text-[10px] font-mono text-slate-400 text-center">
            Logged as an expenditure of ₹{allocatedINR.toLocaleString('en-IN')} in your Ledger.
          </p>
        </div>

        {err && (
          <p className="text-xs flex items-center gap-1.5 text-[#FFB5A7] font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {err}
          </p>
        )}

        {/* Primary Action Button (Thumb-Friendly CTA) */}
        <button
          onClick={handleAllocate}
          disabled={submitting || allocatedINR <= 0}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-[#A8E6CF]/20"
          style={{ background: '#A8E6CF', color: '#1A1735' }}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Coins className="w-4 h-4" />
          )}
          <span>
            {willFulfill
              ? `Confirm & Fulfill Wish (₹${allocatedINR.toLocaleString('en-IN')})`
              : `Allocate ₹${allocatedINR.toLocaleString('en-IN')}`}
          </span>
        </button>
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
  onAllocate: () => void;
}> = ({ forecast, onEdit, onDelete, onAllocate }) => {
  const pct = clamp(forecast.progress_percentage, 0, 100);
  const fulfilled = forecast.remaining_amount_e5 <= 0;
  const ringColor = fulfilled ? '#A8E6CF' : URGENCY_COLORS[Math.max(0, forecast.urgency - 1)];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`velvet-card transition-all duration-300 ${fulfilled ? 'opacity-70' : 'hover-lift'}`}>
      <div className="p-4 space-y-3">
        {/* Card Main Info */}
        <div className="flex items-start gap-3">
          {/* Progress Ring */}
          <div className="relative flex items-center justify-center shrink-0" style={{ width: 48, height: 48 }}>
            <ProgressRing pct={pct} size={48} stroke={4} color={ringColor} />
            <span className="absolute text-[10px] font-mono font-bold" style={{ color: ringColor }}>
              {fulfilled ? '✓' : `${Math.round(pct)}%`}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-bold text-sm text-[#F5F3FF] truncate">{forecast.item_title}</span>
              {fulfilled && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono bg-[#A8E6CF]/15 text-[#A8E6CF]">
                  Fulfilled ✓
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 text-xs">
              <span className="font-mono font-bold text-[#F5F3FF]">{e5ToINR(forecast.saved_amount_e5)}</span>
              <span className="text-slate-400">of {e5ToINR(forecast.target_amount_e5)}</span>
              {!fulfilled && (
                <span className="text-[11px] font-mono text-[#A8E6CF] ml-auto">
                  ₹{Math.round(forecast.remaining_amount_e5 / 100000).toLocaleString('en-IN')} needed
                </span>
              )}
            </div>
            {/* Progress Bar */}
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: ringColor }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Action Bar */}
        <div className="pt-2 border-t border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{fulfilled ? 'Already saved!' : formatWishlistMonths(forecast.estimated_months)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {!fulfilled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAllocate();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-[#A8E6CF] text-[#1A1735] active:scale-95 shadow-sm shadow-[#A8E6CF]/20 hover:opacity-95"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Allocate</span>
              </button>
            )}
            <button
              onClick={onEdit}
              title="Edit wish"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#F5F3FF] hover:bg-white/10 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete wish"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#FFB5A7] hover:bg-white/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'Collapse' : 'Details'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#F5F3FF] transition-all cursor-pointer ${
                expanded ? 'bg-white/10 text-[#F5F3FF]' : 'hover:bg-white/10'
              }`}
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Detail */}
        {expanded && (
          <div className="pt-2 border-t border-white/8 animate-slide-down grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Priority</p>
              <p className="font-semibold text-[#F5F3FF] mb-1">{PRIORITY_LABELS[forecast.priority] ?? forecast.priority}</p>
              <StarRating value={forecast.priority} max={5} color="#FBD8B3" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Urgency</p>
              <p className="font-semibold text-[#F5F3FF] mb-1">{URGENCY_LABELS[forecast.urgency] ?? forecast.urgency}</p>
              <StarRating value={forecast.urgency} max={5} color="#C8B6FF" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Weight</p>
              <p className="text-sm font-mono font-bold text-[#F5F3FF]">{forecast.weight}</p>
              <p className="text-[10px] text-slate-500">Priority × Urgency</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Monthly Contribution</p>
              <p className="text-sm font-mono font-bold text-[#A8E6CF]">{e5ToINR(forecast.monthly_contribution_e5)}</p>
              <p className="text-[10px] text-slate-500">from surplus</p>
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
  const { addToast } = useToast();

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
  const [allocateModalItem, setAllocateModalItem] = useState<ItemForecast | null>(null);

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
        addToast({
          type: 'success',
          statusCode: 'OK',
          title: 'Wish Updated',
          message: `Saved changes to "${payload.title}"`,
          method: 'PUT',
          endpoint: '/wishlist/items',
        });
      } else {
        await wishlistApi.createItem(payload);
        addToast({
          type: 'success',
          statusCode: 'CREATED',
          title: 'Wish Created',
          message: `Added "${payload.title}" to wishlist`,
          method: 'POST',
          endpoint: '/wishlist/items',
        });
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
    } catch (e: any) {
      setActionError(e.message || 'Failed to save wish');
      addToast({
        type: 'error',
        statusCode: e.status || 'ERROR',
        title: 'Save Failed',
        message: e.message || 'Failed to save wish',
      });
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await wishlistApi.deleteItem(id);
      setDeleteConfirm(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
      addToast({
        type: 'success',
        statusCode: 'OK',
        title: 'Wish Deleted',
        message: 'Wishlist item was removed',
        method: 'DELETE',
        endpoint: '/wishlist/items',
      });
    } catch (e: any) {
      setActionError(e.message || 'Failed to delete wish');
      addToast({
        type: 'error',
        statusCode: e.status || 'ERROR',
        title: 'Delete Failed',
        message: e.message || 'Failed to delete wish',
      });
    }
  };

  const handleDistribute = async () => {
    setDistributing(true);
    setActionError(null);
    try {
      const res = await wishlistApi.distributeSurplus();
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardSummary });
      const allocations = res.allocations || [];
      const totalAllocated = allocations.reduce((acc, a) => acc + (a.allocated_e5 || 0), 0);

      addToast({
        type: 'success',
        statusCode: 'OK',
        title: 'Surplus Distributed!',
        message: `Allocated ${e5ToINR(totalAllocated)} across ${allocations.length} goal${allocations.length === 1 ? '' : 's'}`,
        method: 'POST',
        endpoint: '/wishlist/distribute',
        duration: 4500,
        children: allocations.length > 0 ? (
          <div className="space-y-1 pt-1.5 border-t border-white/10 mt-1">
            {allocations.map((r) => (
              <div key={r.item_id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300 truncate max-w-[200px]">{r.item_title}</span>
                <span className="font-mono font-bold text-[#A8E6CF] shrink-0">+{e5ToINR(r.allocated_e5)}</span>
              </div>
            ))}
          </div>
        ) : undefined,
      });
    } catch (e: any) {
      setActionError(e.message || 'Distribution failed');
      addToast({
        type: 'error',
        statusCode: e.status || 'ERROR',
        title: 'Distribution Failed',
        message: e.message || 'Distribution failed',
      });
    } finally {
      setDistributing(false);
    }
  };

  const now = new Date();
  const cycleEndDate = forecast ? new Date(forecast.cycle_end_date) : null;
  const daysUntilCycleEnd = cycleEndDate
    ? Math.ceil((cycleEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  // Button to distribute money across wishes is only visible 1-2 days before cycle ends
  const isDistributeEligible = daysUntilCycleEnd !== null && daysUntilCycleEnd <= 2 && daysUntilCycleEnd >= 0;

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
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fadeIn pb-28 overflow-x-hidden">
      {/* Top Tag Header */}
      <PageTagHeader
        title="Wishlist & Goals"
        dotColor="#C8B6FF"
        badgeText={`${items.length} ${items.length === 1 ? 'Wish' : 'Wishes'}`}
      />

      {/* Actions Controls Bar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400 font-sans truncate">
          Intentions guided by surplus
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { setActionError(null); refetch(); }}
            disabled={isFetching}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            title="Refresh Wishlist"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Budget</span>
          </button>
          <button
            onClick={() => setAddModal({ open: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:opacity-90 shadow-sm"
            style={{ background: '#FBD8B3', color: '#1A1735' }}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Wish</span>
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

          {/* Distribute button (visible only 1-2 days before cycle ends) */}
          {surplus > 0 && activeItems.length > 0 && (
            isDistributeEligible ? (
              <button
                onClick={handleDistribute} disabled={distributing}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 hover:opacity-90"
                style={{ background: 'rgba(168,230,207,0.12)', color: '#A8E6CF', border: '1px solid rgba(168,230,207,0.25)' }}
              >
                {distributing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Distribute {e5ToINR(surplus)} Across Wishes
              </button>
            ) : (
              <div className="mt-4 flex items-center justify-between py-2 px-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Surplus distribution unlocks 1–2 days before cycle ends</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full bg-white/5">
                  {daysUntilCycleEnd !== null && daysUntilCycleEnd > 2
                    ? `in ${daysUntilCycleEnd - 2 === 1 ? '1 day' : `${daysUntilCycleEnd - 2} days`}`
                    : 'locked'}
                </span>
              </div>
            )
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
              onAllocate={() => setAllocateModalItem(item)}
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
              onAllocate={() => setAllocateModalItem(item)}
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
            try {
              await wishlistApi.updateBudgetSettings(e5, day);
              await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
              addToast({
                type: 'success',
                statusCode: 'OK',
                title: 'Budget Settings Saved',
                message: `Monthly budget updated to ₹${Math.round(e5 / 100000).toLocaleString('en-IN')}`,
                method: 'PUT',
                endpoint: '/wishlist/budget',
              });
            } catch (err: any) {
              addToast({
                type: 'error',
                statusCode: err.status || 'ERROR',
                title: 'Update Failed',
                message: err.message || 'Failed to update budget settings',
              });
            }
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

      {allocateModalItem && (
        <AllocateMoneyModal
          item={allocateModalItem}
          onClose={() => setAllocateModalItem(null)}
          onSuccess={async (sim) => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardSummary });
            addToast({
              type: 'success',
              statusCode: 'OK',
              title: sim.is_fulfilled ? 'Goal Fulfilled! 🎉' : 'Funds Allocated!',
              message: `Allocated +${e5ToINR(sim.allocated_e5)} to ${sim.item_title}${sim.is_fulfilled ? ' (Goal 100% Reached!)' : ''}`,
              method: 'POST',
              endpoint: '/wishlist/allocate',
              duration: 3500,
            });
          }}
        />
      )}
    </div>
  );
};
