import React from 'react';
import { Wallet, ArrowLeftRight, PieChart, Plus, User } from 'lucide-react';

export type NavTab = 'home' | 'transactions' | 'account' | 'budget';

interface BottomTabBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewTxnModal: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  onOpenNewTxnModal
}) => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-dock px-4 pt-2 pb-[max(env(safe-area-inset-bottom,0px),1rem)] z-40 flex items-center justify-around select-none">
      {/* Tab 1: Overview (Home) */}
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'home' ? 'text-[#FBD8B3] font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1.5 rounded-xl transition-all duration-200 ${activeTab === 'home' ? 'bg-[#FBD8B3]/20 text-[#FBD8B3] scale-110' : ''}`}>
          <Wallet className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight font-medium font-mono">Overview</span>
      </button>

      {/* Tab 2: Ledger (Transactions) */}
      <button
        onClick={() => onTabChange('transactions')}
        className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'transactions' ? 'text-[#FBD8B3] font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1.5 rounded-xl transition-all duration-200 ${activeTab === 'transactions' ? 'bg-[#FBD8B3]/20 text-[#FBD8B3] scale-110' : ''}`}>
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight font-medium font-mono">Ledger</span>
      </button>

      {/* Center Elevated Warm Apricot FAB */}
      <div className="relative -top-3">
        <button
          onClick={onOpenNewTxnModal}
          className="w-14 h-14 rounded-full bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] flex items-center justify-center shadow-[0_6px_24px_rgba(251,216,179,0.45)] hover:shadow-[0_8px_30px_rgba(251,216,179,0.6)] hover:scale-105 active:scale-90 transition-all duration-200 p-3.5 border-4 border-[#232044] cursor-pointer aspect-square shrink-0"
          title="Record Expense"
        >
          <Plus className="w-6 h-6 stroke-[3] text-[#1A1835]" />
        </button>
      </div>

      {/* Tab 3: Envelopes (Budget) */}
      <button
        onClick={() => onTabChange('budget')}
        className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'budget' ? 'text-[#FBD8B3] font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1.5 rounded-xl transition-all duration-200 ${activeTab === 'budget' ? 'bg-[#FBD8B3]/20 text-[#FBD8B3] scale-110' : ''}`}>
          <PieChart className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight font-medium font-mono">Envelopes</span>
      </button>

      {/* Tab 4: Vault (Account) */}
      <button
        onClick={() => onTabChange('account')}
        className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 ${
          activeTab === 'account' ? 'text-[#FBD8B3] font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1.5 rounded-xl transition-all duration-200 ${activeTab === 'account' ? 'bg-[#FBD8B3]/20 text-[#FBD8B3] scale-110' : ''}`}>
          <User className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight font-medium font-mono">Vault</span>
      </button>
    </nav>
  );
};
