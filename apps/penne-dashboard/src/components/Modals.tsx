import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@packages/ui';
import { Transaction, EnvelopeGroup, Envelope, Subscription, SubscriptionCycle, SubscriptionStatus, amountToE5, e5ToAmount, formatCurrency } from '@packages/types';
import { Trash2, AlertTriangle, Receipt, Sparkles, Gift, ExternalLink, CreditCard, Landmark, CheckCircle2, Calendar, Zap, RefreshCw } from 'lucide-react';
import { EnvelopeMonogramBadge } from '../utils/envelopeVisuals';
import { WishlistItem } from '../services/api';

// --- New Transaction Modal ---
interface NewTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopes: Envelope[];
  groups?: EnvelopeGroup[];
  onSubmit: (amountE5: number, txnType: string, paymentMethod: string, envelopeId?: string | null, createdAt?: string) => Promise<void> | void;
}

export const NewTxnModal: React.FC<NewTxnModalProps> = ({
  isOpen,
  onClose,
  envelopes,
  groups = [],
  onSubmit
}) => {
  const systemEnv = (envelopes || []).find((e) => e && (e.is_system || e.name === 'Unallocated Budget'));
  const systemEnvId = systemEnv?.id || '';

  const [amount, setAmount] = useState<string>('');
  const [txnType, setTxnType] = useState<string>('debit');
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_card');
  const [envelopeId, setEnvelopeId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (!envelopeId && systemEnvId) {
        setEnvelopeId(systemEnvId);
      }
    }
  }, [isOpen, systemEnvId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    const targetEnvId = envelopeId || systemEnvId;
    const amtE5 = amountToE5(parsed);

    // Optimistic UI: dispatch transaction immediately so balances & accounts update instantly
    try {
      onSubmit(amtE5, txnType, paymentMethod, targetEnvId);
    } catch (err) {
      console.error('[NewTxnModal] Submit error:', err);
    }

    // Instantly reset and close modal for perfectly snappy experience
    setAmount('');
    setEnvelopeId('');
    onClose();
  };

  const groupMap = new Map<string, string>();
  (groups || []).forEach((g) => {
    if (g && g.id) groupMap.set(g.id, g.name);
  });

  const envelopeOptions = (envelopes || []).map((env) => {
    const gName = groupMap.get(env.envelope_group_id);
    const envName = env.name || (env.is_system ? 'Unallocated Budget' : `Envelope #${env.id.slice(-4)}`);
    const label = env.is_system
      ? 'Unallocated General Surplus'
      : gName
      ? `${gName} › ${envName}`
      : envName;
    return {
      value: env.id,
      label
    };
  });

  if (envelopeOptions.length === 0) {
    envelopeOptions.push({
      value: systemEnvId,
      label: 'Unallocated General Surplus'
    });
  }

  const parsedAmt = parseFloat(amount);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Expense / Income">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Pills */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#232044] rounded-2xl border border-white/5 font-mono text-xs">
          {[
            { id: 'debit', label: 'Debit' },
            { id: 'credit', label: 'Inflow' },
            { id: 'transfer', label: 'Transfer' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTxnType(t.id)}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                txnType === t.id
                  ? 'bg-[#FBD8B3] text-[#1A1835] shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Currency Amount Input */}
        <div>
          <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase block mb-1">
            Amount (₹)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xl font-mono text-[#FBD8B3] font-bold">₹</span>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-[#232044] border border-white/10 rounded-2xl text-2xl font-mono font-black text-white focus:outline-none focus:border-[#FBD8B3]"
            />
          </div>
          {parsedAmt > 0 && (
            <span className="text-[10px] font-mono text-[#FBD8B3] mt-1 block">
              Calculated E5: {amountToE5(parsedAmt).toLocaleString()} E5 units
            </span>
          )}
        </div>

        {/* Envelope Selector */}
        {txnType !== 'credit' && (
          <div className="space-y-1.5">
            <Select
              label="Assigned Budget Envelope"
              value={envelopeId}
              onChange={(e) => setEnvelopeId(e.target.value)}
              options={envelopeOptions}
            />
            {envelopeId && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1835] border border-white/5 animate-fadeIn">
                <EnvelopeMonogramBadge
                  name={(envelopes || []).find((e) => e?.id === envelopeId)?.name || 'General'}
                  size="xs"
                />
                <span className="text-[11px] font-mono text-slate-300 truncate">
                  {(envelopes || []).find((e) => e?.id === envelopeId)?.name || 'Unallocated Surplus Pool'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Payment Rail Selector */}
        <div>
          <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase block mb-1">
            Payment Account Rail
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'bank_card', label: 'Obsidian CC' },
              { id: 'bank_account', label: 'Primary Bank (ACH)' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`p-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === m.id
                    ? 'bg-[#FBD8B3] text-[#1A1835] font-black border-[#FBD8B3] shadow-sm'
                    : 'bg-[#232044] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Recording...' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Edit Transaction Modal ---
interface EditTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  envelopes: Envelope[];
  groups?: EnvelopeGroup[];
  onSubmit: (txnId: string, amountE5: number, txnType: string, paymentMethod: string, envelopeId?: string | null) => Promise<void>;
  onDelete?: (txnId: string) => Promise<void>;
}

export const EditTxnModal: React.FC<EditTxnModalProps> = ({
  isOpen,
  onClose,
  transaction,
  envelopes,
  groups = [],
  onSubmit,
  onDelete
}) => {
  const systemEnv = (envelopes || []).find((e) => e && (e.is_system || e.name === 'Unallocated Budget'));
  const systemEnvId = systemEnv?.id || '';

  const [amount, setAmount] = useState<string>('');
  const [txnType, setTxnType] = useState<string>('debit');
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_card');
  const [envelopeId, setEnvelopeId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (transaction) {
      setAmount(e5ToAmount(transaction.amount_e5 || 0).toString());
      setTxnType(transaction.txn_type || 'debit');
      setPaymentMethod(transaction.payment_method || 'bank_card');
      setEnvelopeId(transaction.envelope_id || systemEnvId);
    }
    if (!isOpen) {
      setIsDeleteConfirmOpen(false);
    }
  }, [transaction, isOpen, systemEnvId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    const targetEnvId = envelopeId || systemEnvId;

    setLoading(true);
    try {
      await onSubmit(
        transaction.id,
        amountToE5(parsed),
        txnType,
        paymentMethod,
        targetEnvId
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!transaction || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const groupMap = new Map<string, string>();
  (groups || []).forEach((g) => {
    if (g && g.id) groupMap.set(g.id, g.name);
  });

  const envelopeOptions = (envelopes || []).map((env) => {
    const gName = groupMap.get(env.envelope_group_id);
    const envName = env.name || (env.is_system ? 'Unallocated Budget' : `Envelope #${env.id.slice(-4)}`);
    const label = env.is_system
      ? 'Unallocated General Surplus'
      : gName
      ? `${gName} › ${envName}`
      : envName;
    return {
      value: env.id,
      label
    };
  });

  if (envelopeOptions.length === 0) {
    envelopeOptions.push({
      value: systemEnvId,
      label: 'Unallocated General Surplus'
    });
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Modify Transaction Entry">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#232044] rounded-2xl border border-white/5 font-mono text-xs">
            {[
              { id: 'debit', label: 'Debit' },
              { id: 'credit', label: 'Inflow' },
              { id: 'transfer', label: 'Transfer' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTxnType(t.id)}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  txnType === t.id
                    ? 'bg-[#FBD8B3] text-[#1A1835] shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase block mb-1">
              Amount (₹)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xl font-mono text-[#FBD8B3] font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-[#232044] border border-white/10 rounded-2xl text-2xl font-mono font-black text-white focus:outline-none focus:border-[#FBD8B3]"
              />
            </div>
          </div>

          {/* Envelope Selector */}
          <div className="space-y-1.5">
            <Select
              label="Assigned Envelope"
              value={envelopeId}
              onChange={(e) => setEnvelopeId(e.target.value)}
              options={envelopeOptions}
            />
            {envelopeId && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1835] border border-white/5 animate-fadeIn">
                <EnvelopeMonogramBadge
                  name={(envelopes || []).find((e) => e?.id === envelopeId)?.name || 'General'}
                  size="xs"
                />
                <span className="text-[11px] font-mono text-slate-300 truncate">
                  {(envelopes || []).find((e) => e?.id === envelopeId)?.name || 'Unallocated Surplus Pool'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase block mb-1">
              Payment Rail
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'bank_card', label: 'Obsidian CC' },
                { id: 'bank_account', label: 'Primary Bank (ACH)' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? 'bg-[#FBD8B3] text-[#1A1835] font-black border-[#FBD8B3] shadow-sm'
                      : 'bg-[#232044] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
            {onDelete ? (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="p-3 rounded-2xl bg-[#FFB5A7]/20 text-[#FFB5A7] border border-[#FFB5A7]/30 hover:bg-[#FFB5A7]/30 transition-colors cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Update Entry'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          title="Delete Transaction"
        >
          <div className="space-y-4">
            <div className="p-4 bg-[#FFB5A7]/10 border border-[#FFB5A7]/20 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-[#FFB5A7]/20 text-[#FFB5A7] rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Delete Transaction Entry?</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  Confirm removing this transaction of{' '}
                  <span className="font-bold text-[#FFB5A7]">
                    {formatCurrency(transaction?.amount_e5 || 0)}
                  </span>
                  . This balance will be returned to the account.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// --- Wishlist Transaction Modal ---
export interface WishlistModalItem {
  id?: string;
  title?: string;
  target_amount_e5: number;
  saved_amount_e5: number;
  status?: string;
}

export interface WishlistTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  wishlistItem?: WishlistModalItem | null;
  onSubmit: (
    txnId: string,
    amountE5: number,
    txnType: string,
    paymentMethod: string,
    envelopeId?: string | null,
    description?: string,
    wishlistItemId?: string | null
  ) => Promise<void> | void;
  onDelete?: (txnId: string) => Promise<void> | void;
  onNavigateToWishlist?: () => void;
}

export const WishlistTxnModal: React.FC<WishlistTxnModalProps> = ({
  isOpen,
  onClose,
  transaction,
  wishlistItem,
  onSubmit,
  onDelete,
  onNavigateToWishlist
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_account');
  const [loading, setLoading] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (transaction) {
      setAmount(e5ToAmount(transaction.amount_e5 || 0).toString());
      setPaymentMethod(transaction.payment_method || 'bank_account');
    }
    if (!isOpen) {
      setIsDeleteConfirmOpen(false);
    }
  }, [transaction, isOpen]);

  if (!transaction) return null;

  const currentAmt = e5ToAmount(transaction.amount_e5 || 0);
  const parsedAmt = parseFloat(amount) || 0;
  const delta = parsedAmt - currentAmt;

  const itemTitle =
    wishlistItem?.title ||
    transaction.description?.replace(/^wishlist:\s*/i, '').trim() ||
    'Wishlist Goal';

  const targetAmt = wishlistItem ? e5ToAmount(wishlistItem.target_amount_e5) : null;
  const savedAmt = wishlistItem ? e5ToAmount(wishlistItem.saved_amount_e5) : null;
  const currentPct = targetAmt && targetAmt > 0 && savedAmt !== null
    ? Math.min(100, Math.round((savedAmt / targetAmt) * 100))
    : null;

  const projectedSaved = savedAmt !== null ? Math.max(0, savedAmt + delta) : null;
  const projectedPct = targetAmt && targetAmt > 0 && projectedSaved !== null
    ? Math.min(100, Math.round((projectedSaved / targetAmt) * 100))
    : null;

  const isFulfilled = wishlistItem?.status === 'fulfilled' || (projectedSaved !== null && targetAmt !== null && projectedSaved >= targetAmt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedAmt) || parsedAmt <= 0) return;

    setLoading(true);
    try {
      await onSubmit(
        transaction.id,
        amountToE5(parsedAmt),
        'debit',
        paymentMethod,
        transaction.envelope_id,
        transaction.description,
        transaction.wishlist_item_id
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Wishlist Allocation Entry">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Linked Wishlist Item Card */}
          <div className="p-3.5 bg-[#232044] rounded-2xl border border-[#A8E6CF]/25 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-[#A8E6CF] uppercase font-bold tracking-wider">
                    Funding Target
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">
                    {itemTitle}
                  </h4>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 uppercase tracking-wider ${
                  isFulfilled
                    ? 'bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/40'
                    : 'bg-[#C8B6FF]/20 text-[#C8B6FF] border border-[#C8B6FF]/40'
                }`}
              >
                {isFulfilled ? 'Fulfilled 🎯' : 'Active Goal'}
              </span>
            </div>

            {targetAmt !== null && savedAmt !== null && (
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">
                    Saved: <strong className="text-white">₹{Math.round(savedAmt).toLocaleString('en-IN')}</strong> of ₹{Math.round(targetAmt).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[#A8E6CF] font-bold">
                    {currentPct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#A8E6CF] to-[#85D6B8] rounded-full transition-all duration-300"
                    style={{ width: `${currentPct}%` }}
                  />
                </div>
                {delta !== 0 && projectedSaved !== null && (
                  <p className="text-[10px] font-mono text-slate-300 pt-0.5">
                    Preview after change: <span className="text-[#FBD8B3] font-bold">₹{Math.round(projectedSaved).toLocaleString('en-IN')}</span> ({projectedPct}%)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Allocation Amount */}
          <div>
            <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase block mb-1">
              Allocation Amount (₹)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xl font-mono text-[#A8E6CF] font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-[#232044] border border-white/10 rounded-2xl text-2xl font-mono font-black text-white focus:outline-none focus:border-[#A8E6CF]"
              />
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Modifying this value directly updates the wishlist item balance and your ledger expenses.
            </p>
          </div>

          {/* Payment Method Rail */}
          <div>
            <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase block mb-1">
              Payment Rail
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'bank_account', label: 'Primary Bank (UPI/BA)', icon: Landmark },
                { id: 'bank_card', label: 'Obsidian CC', icon: CreditCard }
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      active
                        ? 'bg-[#A8E6CF]/20 text-[#A8E6CF] border-[#A8E6CF]/50 font-bold shadow-sm'
                        : 'bg-[#232044] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="p-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  title="Refund & Remove Allocation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {onNavigateToWishlist && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToWishlist();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-[#A8E6CF]" />
                  <span>View in Wishlist</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Allocation'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          title="Refund Wishlist Allocation?"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[#FFB5A7]">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Refund Allocation to {itemTitle}?</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  This transaction of{' '}
                  <span className="font-bold text-[#FFB5A7]">
                    {formatCurrency(transaction?.amount_e5 || 0)}
                  </span>{' '}
                  will be removed from your ledger, and the saved progress on this item will be reduced accordingly.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Keep Allocation
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Refunding...' : 'Confirm Refund & Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// --- New Category Modal ---
export interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: EnvelopeGroup[];
  onSubmit: (
    groupId: string | null,
    newGroupName: string | null,
    categoryName: string,
    targetAmountE5: number,
    cadence: string
  ) => Promise<void>;
}

export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  isOpen,
  onClose,
  groups,
  onSubmit
}) => {
  const safeGroups = (Array.isArray(groups) ? groups : []).filter((g) => !g.is_system);
  const defaultGroup = safeGroups[0]?.id || 'NEW_GROUP';

  const [selectedGroupId, setSelectedGroupId] = useState<string>(defaultGroup);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const [cadence, setCadence] = useState<string>('monthly');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (safeGroups.length > 0 && (!selectedGroupId || selectedGroupId === '')) {
      setSelectedGroupId(safeGroups[0].id);
    }
  }, [groups]);

  const isCreatingNewGroup = selectedGroupId === 'NEW_GROUP' || safeGroups.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    const parsedBudget = parseFloat(budgetAmount);
    if (isNaN(parsedBudget) || parsedBudget <= 0) return;

    if (isCreatingNewGroup && !newGroupName.trim()) return;

    setLoading(true);
    try {
      const groupIdToUse = isCreatingNewGroup ? null : selectedGroupId;
      const groupNameToUse = isCreatingNewGroup ? newGroupName.trim() : null;

      await onSubmit(groupIdToUse, groupNameToUse, categoryName.trim(), amountToE5(parsedBudget), cadence);

      setCategoryName('');
      setBudgetAmount('');
      setNewGroupName('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const groupOptions = [
    ...safeGroups.map((g) => ({ value: g.id, label: g.name })),
    { value: 'NEW_GROUP', label: '+ Create New Envelope Group...' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Budget Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Parent Classification Group"
          value={isCreatingNewGroup ? 'NEW_GROUP' : selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          options={groupOptions}
        />

        {isCreatingNewGroup && (
          <div className="p-3.5 rounded-2xl bg-[#232044] border border-[#FBD8B3]/30 space-y-2 animate-fadeIn">
            <span className="text-[11px] font-bold font-mono text-[#FBD8B3] uppercase tracking-wider">
              ✨ New Group Name
            </span>
            <Input
              label="Group Name"
              type="text"
              placeholder="e.g. Essential Living, Lifestyle & Social"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required={isCreatingNewGroup}
            />
          </div>
        )}

        <Input
          label="Envelope Title"
          type="text"
          placeholder="e.g. Artisanal Roasteries & Teas"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
        />

        <Input
          label="Monthly Target Budget (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 12000.00"
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
          required
        />

        <Select
          label="Cadence"
          value={cadence}
          onChange={(e) => setCadence(e.target.value)}
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'yearly', label: 'Yearly' }
          ]}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Envelope'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Edit Category Modal ---
interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: Envelope | null;
  groups: EnvelopeGroup[];
  onUpdate: (id: string, name: string, targetAmountE5: number, cadence: string, envelopeGroupId?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onEditGroup?: (group: EnvelopeGroup) => void;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  envelope,
  groups = [],
  onUpdate,
  onDelete
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [cadence, setCadence] = useState('monthly');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (envelope && isOpen) {
      setCategoryName(envelope.name || '');
      setBudgetAmount(e5ToAmount(envelope.target_amount_e5).toString());
      setCadence(envelope.cadence || 'monthly');
      setGroupId(envelope.envelope_group_id || '');
      setShowConfirmDelete(false);
    }
  }, [envelope, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envelope) return;
    const parsed = parseFloat(budgetAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    setLoading(true);
    try {
      await onUpdate(envelope.id, categoryName, amountToE5(parsed), cadence, groupId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!envelope || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(envelope.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: g.name
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Envelope">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Envelope Title"
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
        />

        <Input
          label="Monthly Target Budget (₹)"
          type="number"
          step="0.01"
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
          required
        />

        <Select
          label="Cadence"
          value={cadence}
          onChange={(e) => setCadence(e.target.value)}
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'yearly', label: 'Yearly' }
          ]}
        />

        {groupOptions.length > 0 && (
          <Select
            label="Parent Classification Group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            options={groupOptions}
          />
        )}

        {showConfirmDelete ? (
          <div className="p-3.5 rounded-2xl bg-[#FFB5A7]/10 border border-[#FFB5A7]/30 space-y-2">
            <p className="text-xs text-[#FFB5A7] font-bold flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-4 h-4" />
              Confirm Release to Pool?
            </p>
            <p className="text-[11px] text-slate-300 font-mono">
              Deleting this envelope releases its balance back into the Unallocated Surplus pool.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="pastelRose"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full text-xs font-bold"
              >
                {deleting ? 'Releasing...' : 'Yes, Delete Envelope'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmDelete(false)}
                className="w-full text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {onDelete && !envelope?.is_system ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs font-bold text-[#FFB5A7] hover:underline flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Envelope</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

// --- Edit Envelope Group Modal ---
interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: EnvelopeGroup | null;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  onUpdate,
  onDelete
}) => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (group && isOpen) {
      setGroupName(group.name || '');
      setShowConfirmDelete(false);
    }
  }, [group, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !groupName.trim()) return;

    setLoading(true);
    try {
      await onUpdate(group.id, groupName.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!group || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(group.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Classification Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Envelope Group Name"
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />

        {showConfirmDelete ? (
          <div className="p-3.5 rounded-2xl bg-[#FFB5A7]/10 border border-[#FFB5A7]/30 space-y-2">
            <p className="text-xs text-[#FFB5A7] font-bold flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-4 h-4" />
              Confirm Group Deletion?
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="pastelRose"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full text-xs font-bold"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Group'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmDelete(false)}
                className="w-full text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {onDelete && !group?.is_system ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs font-bold text-[#FFB5A7] hover:underline flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Group</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Group'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

// --- Add / Edit Subscription Modal ---
interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionToEdit?: Subscription | null;
  envelopes?: Envelope[];
  onSubmit: (sub: Partial<Subscription>) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscriptionToEdit,
  envelopes = [],
  onSubmit,
  onDelete,
}) => {
  const isEditing = !!subscriptionToEdit;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<SubscriptionCycle>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_card');
  const [envelopeId, setEnvelopeId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name || '');
      setAmount(subscriptionToEdit.amount_e5 ? e5ToAmount(subscriptionToEdit.amount_e5).toString() : '');
      setBillingCycle(subscriptionToEdit.billing_cycle || 'monthly');
      const dateStr = subscriptionToEdit.next_billing_date ? subscriptionToEdit.next_billing_date.split('T')[0] : '';
      setNextBillingDate(dateStr);
      setPaymentMethod(subscriptionToEdit.payment_method || 'bank_card');
      setEnvelopeId(subscriptionToEdit.envelope_id || '');
      setNotes(subscriptionToEdit.notes || '');
      setAutoRenew(subscriptionToEdit.auto_renew ?? true);
      setStatus(subscriptionToEdit.status || 'active');
    } else {
      setName('');
      setAmount('');
      setBillingCycle('monthly');
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setNextBillingDate(defaultDate.toISOString().split('T')[0]);
      setPaymentMethod('bank_card');
      setEnvelopeId('');
      setNotes('');
      setAutoRenew(true);
      setStatus('active');
    }
    setShowConfirmDelete(false);
  }, [subscriptionToEdit, isOpen]);

  const PRESETS = [
    { name: 'Netflix Premium', amount: 649, cycle: 'monthly' as SubscriptionCycle },
    { name: 'Spotify Duo', amount: 149, cycle: 'monthly' as SubscriptionCycle },
    { name: 'YouTube Premium', amount: 149, cycle: 'monthly' as SubscriptionCycle },
    { name: 'Amazon Prime', amount: 299, cycle: 'monthly' as SubscriptionCycle },
    { name: 'ChatGPT Plus', amount: 1999, cycle: 'monthly' as SubscriptionCycle },
    { name: 'GitHub Copilot', amount: 820, cycle: 'monthly' as SubscriptionCycle },
    { name: 'iCloud+ 50GB', amount: 75, cycle: 'monthly' as SubscriptionCycle },
  ];

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setAmount(preset.amount.toString());
    setBillingCycle(preset.cycle);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setLoading(true);
    try {
      const payload: Partial<Subscription> = {
        name: name.trim(),
        amount_e5: amountToE5(parsedAmount),
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate ? new Date(nextBillingDate).toISOString() : new Date().toISOString(),
        payment_method: paymentMethod,
        envelope_id: envelopeId || undefined,
        notes: notes.trim(),
        auto_renew: autoRenew,
        status: status,
      };

      if (subscriptionToEdit?.id) {
        payload.id = subscriptionToEdit.id;
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('[SubscriptionModal] Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!subscriptionToEdit?.id || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(subscriptionToEdit.id);
      onClose();
    } catch (err) {
      console.error('[SubscriptionModal] Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subscription' : 'Add New Subscription'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preset Quick Select Pills (Only on create) */}
        {!isEditing && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    name === p.name
                      ? 'bg-[#FBD8B3]/20 border-[#FBD8B3] text-[#FBD8B3] font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {p.name} (₹{p.amount})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Name */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
            Service / Subscription Name <span className="text-[#FFB5A7]">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Netflix, Spotify, Gym, Cloud Storage"
            required
            autoFocus={!isEditing}
          />
        </div>

        {/* Amount & Cycle Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
              Amount (₹) <span className="text-[#FFB5A7]">*</span>
            </label>
            <Input
              type="number"
              step="any"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 649"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
              Billing Cycle
            </label>
            <Select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as SubscriptionCycle)}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly (Annual)' },
                { value: 'quarterly', label: 'Quarterly (Every 3 mos)' },
                { value: 'weekly', label: 'Weekly' },
              ]}
            />
          </div>
        </div>

        {/* Next Billing Date & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
              Next Billing Date <span className="text-[#FFB5A7]">*</span>
            </label>
            <Input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
              Payment Method
            </label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'bank_card', label: 'Debit / Credit Card' },
                { value: 'bank_account', label: 'Bank Auto-Debit / ECS' },
                { value: 'upi', label: 'UPI AutoPay' },
              ]}
            />
          </div>
        </div>

        {/* Envelope Linking & Status (if editing) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
              Link to Envelope (Optional)
            </label>
            <Select
              value={envelopeId}
              onChange={(e) => setEnvelopeId(e.target.value)}
              options={[
                { value: '', label: 'None (Unassigned)' },
                ...envelopes
                  .filter((e) => !e.is_system)
                  .map((e) => ({
                    value: e.id,
                    label: e.name || 'Category Envelope',
                  })),
              ]}
            />
          </div>

          {isEditing ? (
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
                Subscription Status
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                options={[
                  { value: 'active', label: 'Active (Ongoing)' },
                  { value: 'paused', label: 'Paused (Temporarily stopped)' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="autoRenew"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#FBD8B3] focus:ring-[#FBD8B3] cursor-pointer"
              />
              <label htmlFor="autoRenew" className="text-xs text-slate-300 font-mono cursor-pointer select-none">
                Auto-Renew Cycle
              </label>
            </div>
          )}
        </div>

        {/* Plan Notes */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
            Notes / Plan Details (Optional)
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 4K Family plan, split with Alex"
          />
        </div>

        {/* Delete Confirmation Box (when editing) */}
        {showConfirmDelete ? (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Delete this subscription?</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono">
              This will remove tracking for "{name}". Existing past transactions will remain in your ledger.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="pastelRose"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full text-xs font-bold"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmDelete(false)}
                className="w-full text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs font-bold text-[#FFB5A7] hover:underline flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Subscription'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

