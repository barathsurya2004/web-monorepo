import React from 'react';
import { EnvelopeGroup, Envelope, Allocation, Transaction, formatCurrency } from '@packages/types';
import { Card, ProgressBar, Badge, Button } from '@packages/ui';
import { Folder, Plus, Target, CheckCircle2, AlertCircle } from 'lucide-react';

interface EnvelopeGroupsListProps {
  groups: EnvelopeGroup[];
  envelopes: Envelope[];
  allocations: Allocation[];
  transactions: Transaction[];
  onOpenNewEnvelope: (groupId: string) => void;
  onOpenQuickAllocate: (envelope: Envelope) => void;
}

export const EnvelopeGroupsList: React.FC<EnvelopeGroupsListProps> = ({
  groups,
  envelopes,
  allocations,
  transactions,
  onOpenNewEnvelope,
  onOpenQuickAllocate
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Budget Envelopes</h2>
          <p className="text-xs text-slate-400">Organized into groups matching penne-server budget models</p>
        </div>
      </div>

      <div className="space-y-6">
        {groups.map((group) => {
          const groupEnvelopes = envelopes.filter((e) => e.envelope_group_id === group.id);

          return (
            <Card key={group.id} className="p-6">
              {/* Group Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800/80 text-emerald-400">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100 text-base">{group.name}</h3>
                      {group.is_system && (
                        <Badge variant="amber" className="text-[10px]">
                          System Group
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{groupEnvelopes.length} Envelopes</p>
                  </div>
                </div>

                {!group.is_system && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenNewEnvelope(group.id)}
                    className="gap-1 text-slate-300 hover:text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Envelope</span>
                  </Button>
                )}
              </div>

              {/* Envelopes List */}
              {groupEnvelopes.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No envelopes in this group yet. Click "Add Envelope" to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupEnvelopes.map((env) => {
                    const alloc = allocations.find((a) => a.envelope_id === env.id);
                    const allocatedE5 = alloc ? alloc.allocated_amount_e5 : 0;
                    
                    const envSpentE5 = transactions
                      .filter((t) => t.envelope_id === env.id && t.txn_type === 'debit')
                      .reduce((acc, t) => acc + t.amount_e5, 0);

                    const remainingE5 = allocatedE5 - envSpentE5;
                    const progressPercent = env.target_amount_e5 > 0
                      ? Math.min((allocatedE5 / env.target_amount_e5) * 100, 100)
                      : 100;

                    const isOverSpent = envSpentE5 > allocatedE5;

                    return (
                      <div
                        key={env.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700/80 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-100">
                                {env.is_system ? 'Unallocated Funds Pool' : `Envelope #${env.id.slice(-4)}`}
                              </span>
                              {env.is_system && <Badge variant="indigo">System</Badge>}
                            </div>
                            <p className="text-xs text-slate-400">Cadence: {env.cadence}</p>
                          </div>

                          {!env.is_system && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenQuickAllocate(env)}
                              className="text-xs py-1 px-2.5"
                            >
                              Fund
                            </Button>
                          )}
                        </div>

                        {/* Progress Bar & Amounts */}
                        {!env.is_system && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Target className="w-3 h-3 text-slate-400" /> Target: {formatCurrency(env.target_amount_e5)}
                              </span>
                              <span className="font-semibold text-slate-200">
                                {progressPercent.toFixed(0)}% Funded
                              </span>
                            </div>
                            <ProgressBar
                              value={progressPercent}
                              colorVariant={isOverSpent ? 'rose' : progressPercent >= 100 ? 'emerald' : 'indigo'}
                            />
                          </div>
                        )}

                        {/* Financial Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/50 text-center">
                          <div className="bg-slate-900/60 p-2 rounded-lg">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Allocated</p>
                            <p className="text-xs font-bold text-slate-200 mt-0.5">{formatCurrency(allocatedE5)}</p>
                          </div>

                          <div className="bg-slate-900/60 p-2 rounded-lg">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Spent</p>
                            <p className="text-xs font-bold text-rose-400 mt-0.5">{formatCurrency(envSpentE5)}</p>
                          </div>

                          <div className="bg-slate-900/60 p-2 rounded-lg">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</p>
                            <p className={`text-xs font-bold mt-0.5 ${isOverSpent ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {formatCurrency(remainingE5)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
