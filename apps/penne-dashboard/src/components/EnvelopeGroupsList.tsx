import React from 'react';
import { EnvelopeGroup, Envelope, Allocation, Transaction, formatCurrency } from '@packages/types';
import { Card, ProgressBar, Badge, Button } from '@packages/ui';
import { Folder, Plus, Target } from 'lucide-react';

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
    <div className="max-w-md mx-auto px-4 py-6 space-y-5 animate-fadeIn pb-28 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#F4F1DE]">Budget Pools & Envelopes</h2>
          <p className="text-xs text-[#A89F95]">Zero-Based Budget Allocation</p>
        </div>
      </div>

      <div className="space-y-4 w-full max-w-full overflow-x-hidden">
        {groups.map((group) => {
          const groupEnvelopes = envelopes.filter((e) => e.envelope_group_id === group.id);

          return (
            <Card key={group.id} className="p-4 sm:p-5 space-y-4 w-full max-w-full overflow-x-hidden">
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#342F2C] gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-[#1A1715] text-[#E07A5F] shrink-0 border border-[#342F2C]">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-[#F4F1DE] text-sm truncate">{group.name}</h3>
                      {group.is_system && (
                        <Badge variant="cream" className="text-[9px] py-0 px-1.5 font-bold uppercase shrink-0">
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-[#A89F95]">{groupEnvelopes.length} Envelopes</p>
                  </div>
                </div>

                {!group.is_system && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenNewEnvelope(group.id)}
                    className="gap-1 text-[#E07A5F] hover:text-[#e89078] text-xs px-2 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </Button>
                )}
              </div>

              {/* Envelopes List */}
              {groupEnvelopes.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#8C837A] border border-dashed border-[#342F2C] rounded-2xl">
                  No envelopes in this pool.
                </div>
              ) : (
                <div className="space-y-3 w-full max-w-full overflow-x-hidden">
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
                        className="bg-[#1A1715] border border-[#342F2C] rounded-2xl p-3.5 space-y-3 w-full max-w-full overflow-x-hidden min-w-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-[#F4F1DE] truncate">
                                {env.is_system ? 'Unallocated Funds Pool' : `Envelope #${env.id.slice(-4)}`}
                              </span>
                              {env.is_system && <Badge variant="slate" className="text-[9px]">System</Badge>}
                            </div>
                            <p className="text-[11px] text-[#A89F95]">Cadence: {env.cadence}</p>
                          </div>

                          {!env.is_system && (
                            <Button
                              size="sm"
                              variant="pastelSage"
                              onClick={() => onOpenQuickAllocate(env)}
                              className="text-xs py-1 px-2.5 shrink-0 font-bold"
                            >
                              Fund
                            </Button>
                          )}
                        </div>

                        {/* Progress Bar & Amounts */}
                        {!env.is_system && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#A89F95] flex items-center gap-1 text-[11px]">
                                <Target className="w-3 h-3 text-[#8C837A]" /> Target: {formatCurrency(env.target_amount_e5)}
                              </span>
                              <span className="font-bold text-[#F4F1DE] text-[11px]">
                                {progressPercent.toFixed(0)}%
                              </span>
                            </div>
                            <ProgressBar
                              value={progressPercent}
                              colorVariant={isOverSpent ? 'rose' : progressPercent >= 100 ? 'emerald' : 'indigo'}
                            />
                          </div>
                        )}

                        {/* Financial Stats Grid */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#342F2C] text-center">
                          <div className="bg-[#24201D] p-2 rounded-xl min-w-0">
                            <p className="text-[9px] text-[#8C837A] uppercase font-bold truncate">Allocated</p>
                            <p className="text-xs font-black text-[#F4F1DE] mt-0.5 truncate">{formatCurrency(allocatedE5)}</p>
                          </div>

                          <div className="bg-[#24201D] p-2 rounded-xl min-w-0">
                            <p className="text-[9px] text-[#8C837A] uppercase font-bold truncate">Spent</p>
                            <p className="text-xs font-black text-[#E8A598] mt-0.5 truncate">{formatCurrency(envSpentE5)}</p>
                          </div>

                          <div className="bg-[#24201D] p-2 rounded-xl min-w-0">
                            <p className="text-[9px] text-[#8C837A] uppercase font-bold truncate">Remaining</p>
                            <p className={`text-xs font-black mt-0.5 truncate ${isOverSpent ? 'text-[#E8A598]' : 'text-[#81B29A]'}`}>
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
