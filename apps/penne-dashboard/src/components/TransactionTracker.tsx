import React, { useState } from 'react';
import { Transaction, Envelope, formatCurrency, formatDate } from '@packages/types';
import { Card, Badge, Input, Select, Button } from '@packages/ui';
import { ArrowDownLeft, ArrowUpRight, Search, Filter, CreditCard, Building2, Tag } from 'lucide-react';

interface TransactionTrackerProps {
  transactions: Transaction[];
  envelopes: Envelope[];
  onOpenNewTxnModal: () => void;
}

export const TransactionTracker: React.FC<TransactionTrackerProps> = ({
  transactions,
  envelopes,
  onOpenNewTxnModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeEnvelopes = Array.isArray(envelopes) ? envelopes : [];

  const filteredTxns = safeTransactions.filter((t) => {
    if (!t) return false;
    const bank = t.bank_name || '';
    const id = t.id || '';

    const matchesSearch =
      bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || t.txn_type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <Card className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Transaction History
          </h2>
          <p className="text-xs text-slate-400">Recorded bank transactions and envelope assignments</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search bank or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 w-full text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="credit">Income (Credit)</option>
            <option value="debit">Expense (Debit)</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTxns.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
          No transactions recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Bank</th>
                <th className="py-3 px-4">Envelope Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredTxns.map((t, idx) => {
                const isCredit = t.txn_type === 'credit';
                const assignedEnv = safeEnvelopes.find((e) => e && e.id === t.envelope_id);
                const dateStr = formatDate(t.created_at || t.CreatedAt);

                return (
                  <tr key={t.id || idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-semibold capitalize text-slate-200">{t.txn_type || 'debit'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.bank_name || 'Bank'}</span>
                        <span className="text-[10px] text-slate-500">({t.country_iso2 || 'IN'})</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {assignedEnv ? (
                        <Badge variant="indigo" className="gap-1">
                          <Tag className="w-3 h-3" />
                          <span>{assignedEnv.is_system ? 'Unallocated Pool' : `Envelope #${assignedEnv.id.slice(-4)}`}</span>
                        </Badge>
                      ) : (
                        <Badge variant="amber">Uncategorized</Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {dateStr}
                    </td>

                    <td className={`py-3 px-4 text-right font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(t.amount_e5 || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
