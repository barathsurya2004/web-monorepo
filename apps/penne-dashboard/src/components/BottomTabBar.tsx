import React from 'react';
import { Wallet, PieChart, Plus, User } from 'lucide-react';

export type NavTab = 'home' | 'budget' | 'account';

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1C1A18]/95 backdrop-blur-2xl border-t border-[#342F2C] px-4 py-2 pb-safe max-w-full overflow-x-hidden shadow-2xl shadow-black">
      <div className="max-w-sm mx-auto flex items-center justify-between relative">
        {/* Tab 1: Home / Transactions */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#E07A5F] font-extrabold scale-105'
              : 'text-[#A89F95] hover:text-[#F4F1DE]'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Tab 2: Budget Categories */}
        <button
          onClick={() => onTabChange('budget')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'budget'
              ? 'text-[#E07A5F] font-extrabold scale-105'
              : 'text-[#A89F95] hover:text-[#F4F1DE]'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Budget</span>
        </button>

        {/* Center Floating Action Button (FAB): + Add Transaction */}
        <div className="relative -top-3">
          <button
            onClick={onOpenNewTxnModal}
            className="w-12 h-12 rounded-full bg-[#E07A5F] hover:bg-[#d0694e] text-white flex items-center justify-center shadow-lg shadow-[#E07A5F]/40 active:scale-95 transition-all border-4 border-[#1C1A18] cursor-pointer"
            title="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Account / Settings */}
        <button
          onClick={() => onTabChange('account')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
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

