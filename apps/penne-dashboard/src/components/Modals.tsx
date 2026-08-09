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
  const [envelopeId, setEnvelopeId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    setLoading(true);
    try {
      await onSubmit(amountToE5(parsed), txnType, bankName, envelopeId || undefined);
      setAmount('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const envOptions = [
    { value: '', label: 'Uncategorized / General' },
    ...envelopes.map((e) => ({
      value: e.id,
      label: e.is_system ? 'Unallocated Budget Pool' : `Envelope #${e.id.slice(-4)}`
    }))
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record New Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 1500.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Select
          label="Transaction Type"
          value={txnType}
          onChange={(e) => setTxnType(e.target.value)}
          options={[
            { value: 'debit', label: 'Debit (Expense Outflow)' },
            { value: 'credit', label: 'Credit (Income Inflow)' }
          ]}
        />

        <Input
          label="Bank Name"
          type="text"
          placeholder="e.g. HDFC Bank, ICICI Bank"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          required
        />

        <Select
          label="Category Envelope"
          value={envelopeId}
          onChange={(e) => setEnvelopeId(e.target.value)}
          options={envOptions}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Envelope Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group Name"
          type="text"
          placeholder="e.g. Subscriptions, Travel, Investments"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
          label="Envelope Group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          options={groupOptions}
        />

        <Input
          label="Target Budget Amount (₹)"
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

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate Funds to Envelope">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between">
          <span className="text-slate-400">Ready to Assign:</span>
          <span className="font-bold text-emerald-400">{formatCurrency(readyToAssignE5)}</span>
        </div>

        <Select
          label="Target Envelope"
          value={envelopeId}
          onChange={(e) => setEnvelopeId(e.target.value)}
          options={options}
        />

        <Input
          label="Allocation Amount (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 5000.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Allocating...' : 'Allocate Money'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
