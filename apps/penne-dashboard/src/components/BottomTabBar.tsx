import React from 'react';
import { Wallet, ArrowLeftRight, PieChart, Plus, User } from 'lucide-react';

export type NavTab = 'home' | 'transactions' | 'budget' | 'account';

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1C1A18]/95 backdrop-blur-2xl border-t border-[#342F2C] px-3 pt-2 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] max-w-full overflow-x-hidden shadow-2xl shadow-black">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 min-h-[44px] min-w-[48px] rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'home'
              ? 'text-[#E07A5F] font-extrabold scale-105'
              : 'text-[#A89F95] hover:text-[#F4F1DE]'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Tab 2: Transactions */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 min-h-[44px] min-w-[48px] rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'transactions'
              ? 'text-[#E07A5F] font-extrabold scale-105'
              : 'text-[#A89F95] hover:text-[#F4F1DE]'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Txns</span>
        </button>

        {/* Center Floating Action Button (FAB): + Add Transaction */}
        <div className="relative -top-3">
          <button
            onClick={onOpenNewTxnModal}
            className="w-12 h-12 rounded-full bg-[#E07A5F] hover:bg-[#d0694e] text-white flex items-center justify-center shadow-lg shadow-[#E07A5F]/40 active:scale-90 transition-all border-4 border-[#1C1A18] cursor-pointer"
            title="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Budget Categories */}
        <button
          onClick={() => onTabChange('budget')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 min-h-[44px] min-w-[48px] rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'budget'
              ? 'text-[#E07A5F] font-extrabold scale-105'
              : 'text-[#A89F95] hover:text-[#F4F1DE]'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Budget</span>
        </button>

        {/* Tab 4: Account / Settings */}
        <button
          onClick={() => onTabChange('account')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 min-h-[44px] min-w-[48px] rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'account'
              ? 'text-[#E07A5F] font-extrabold scale-105'
              : 'text-[#A89F95] hover:text-[#F4F1DE]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Account</span>
        </button>
      </div>
    </nav>
  );
};


