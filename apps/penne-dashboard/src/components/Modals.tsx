import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '@packages/ui';
import { EnvelopeGroup, Envelope, amountToE5, formatCurrency } from '@packages/types';

// --- New Transaction Modal ---
interface NewTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopes: Envelope[];
  onSubmit: (amountE5: number, txnType: string, bankName: string, envelopeId?: string) => Promise<void>;
}

export const NewTxnModal: React.FC<NewTxnModalProps> = ({
  isOpen,
  onClose,
  envelopes,
  onSubmit
}) => {
  const [amount, setAmount] = useState<string>('');
  const [txnType, setTxnType] = useState<string>('debit');
  const [bankName, setBankName] = useState<string>('HDFC Bank');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    setLoading(true);
    try {
      await onSubmit(amountToE5(parsed), txnType, bankName);
      setAmount('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Expense / Income">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 1500.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />

        <Select
          label="Transaction Type"
          value={txnType}
          onChange={(e) => setTxnType(e.target.value)}
          options={[
            { value: 'debit', label: 'Expense (Debit Outflow)' },
            { value: 'credit', label: 'Income (Credit Inflow)' }
          ]}
        />

        <Input
          label="Bank / Account Name"
          type="text"
          placeholder="e.g. HDFC Bank, ICICI Bank, Cash"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-[#342F2C]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// --- New Envelope Group Modal ---
interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim());
      setName('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Budget Pool Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group Name"
          type="text"
          placeholder="e.g. Monthly Needs, Savings"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-[#342F2C]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// --- New Envelope Modal ---
interface NewEnvModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: EnvelopeGroup[];
  defaultGroupId?: string;
  onSubmit: (groupId: string, targetAmountE5: number, cadence: string) => Promise<void>;
}

export const NewEnvModal: React.FC<NewEnvModalProps> = ({
  isOpen,
  onClose,
  groups,
  defaultGroupId,
  onSubmit
}) => {
  const [groupId, setGroupId] = useState(defaultGroupId || groups[0]?.id || '');
  const [targetAmount, setTargetAmount] = useState('');
  const [cadence, setCadence] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(targetAmount);
    if (isNaN(parsed) || parsed < 0 || !groupId) return;

    setLoading(true);
    try {
      await onSubmit(groupId, amountToE5(parsed), cadence);
      setTargetAmount('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const groupOptions = groups
    .filter((g) => !g.is_system)
    .map((g) => ({ value: g.id, label: g.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Budget Envelope">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Target Pool Group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          options={groupOptions.length > 0 ? groupOptions : [{ value: '', label: 'No Groups Available' }]}
        />

        <Input
          label="Target Amount (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 10000.00"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
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

        <div className="flex justify-end gap-3 pt-3 border-t border-[#342F2C]">
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

// --- Allocation Modal ---
interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopes: Envelope[];
  readyToAssignE5: number;
  selectedEnvelopeId?: string;
  onSubmit: (envelopeId: string, amountE5: number) => Promise<void>;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  onClose,
  envelopes,
  readyToAssignE5,
  selectedEnvelopeId,
  onSubmit
}) => {
  const [envelopeId, setEnvelopeId] = useState(selectedEnvelopeId || envelopes[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !envelopeId) return;

    setLoading(true);
    try {
      await onSubmit(envelopeId, amountToE5(parsed));
      setAmount('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const options = envelopes
    .filter((e) => !e.is_system)
    .map((e) => ({
      value: e.id,
      label: `Envelope #${e.id.slice(-4)} (Target: ${formatCurrency(e.target_amount_e5)})`
    }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fund Envelope">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Target Envelope"
          value={envelopeId}
          onChange={(e) => setEnvelopeId(e.target.value)}
          options={options.length > 0 ? options : [{ value: '', label: 'No Envelopes' }]}
        />

        <Input
          label="Fund Amount (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 5000.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-[#342F2C]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Funding...' : 'Fund Envelope'}
          </Button>
        </div>
      </form>
    </Modal>
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

  React.useEffect(() => {
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
        {/* Parent Envelope Group Selection */}
        <div className="space-y-2">
          <Select
            label="Parent Envelope Group"
            value={isCreatingNewGroup ? 'NEW_GROUP' : selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            options={groupOptions}
          />
        </div>

        {/* Dynamic New Group Name Input if creating new group */}
        {isCreatingNewGroup && (
          <div className="p-3.5 rounded-2xl bg-[#1A1715] border border-[#E07A5F]/40 space-y-2 animate-fadeIn">
            <span className="text-[11px] font-bold text-[#E07A5F] uppercase tracking-wider">
              ✨ New Parent Group Info
            </span>
            <Input
              label="Group Name"
              type="text"
              placeholder="e.g. Food, Transportation, Housing, Fun"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required={isCreatingNewGroup}
            />
          </div>
        )}

        {/* Category Name */}
        <Input
          label="Category Name"
          type="text"
          placeholder="e.g. Groceries, Dining Out, Snacks"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
        />

        {/* Budget Amount (₹) */}
        <Input
          label="Budget Amount (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 5000.00"
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
          required
        />

        {/* Cadence */}
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

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#342F2C]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
