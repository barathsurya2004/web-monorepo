import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@packages/ui';
import { Transaction, EnvelopeGroup, Envelope, amountToE5, e5ToAmount, formatCurrency } from '@packages/types';
import { Trash2, AlertTriangle, Receipt } from 'lucide-react';
import { EnvelopeMonogramBadge } from '../utils/envelopeVisuals';

// --- New Transaction Modal ---
interface NewTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopes: Envelope[];
  groups?: EnvelopeGroup[];
  onSubmit: (amountE5: number, txnType: string, paymentMethod: string, envelopeId?: string | null, createdAt?: string) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    const targetEnvId = envelopeId || systemEnvId;

    setLoading(true);
    try {
      await onSubmit(amountToE5(parsed), txnType, paymentMethod, targetEnvId);
      setAmount('');
      setEnvelopeId('');
      onClose();
    } finally {
      setLoading(false);
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
