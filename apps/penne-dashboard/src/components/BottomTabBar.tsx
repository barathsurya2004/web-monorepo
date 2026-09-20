import React, { useState, useEffect, useRef } from 'react';
import { Wallet, ArrowLeftRight, PieChart, Plus, User, ShoppingBag } from 'lucide-react';

export type NavTab = 'home' | 'transactions' | 'budget' | 'wishlist' | 'account';

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
  const [isFabVisible, setIsFabVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Reset FAB to visible whenever the active tab changes
  useEffect(() => {
    setIsFabVisible(true);
    lastScrollY.current = 0;
  }, [activeTab]);

  // Scroll detection: disappear on scroll-down, rotate back into view on scroll-up
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY =
            window.scrollY ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0;
          const diff = currentScrollY - lastScrollY.current;

          // Always visible near top of the page
          if (currentScrollY < 30) {
            setIsFabVisible(true);
          } else if (diff > 6) {
            // Scrolling down -> hide FAB
            setIsFabVisible(false);
          } else if (diff < -6) {
            // Scrolling up -> reveal FAB with rotation
            setIsFabVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tab = (id: NavTab, icon: React.ReactNode, label: string) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => onTabChange(id)}
        className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 ${
          isActive ? 'text-[#FBD8B3] font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#FBD8B3]/20 text-[#FBD8B3] scale-110' : ''}`}>
          {icon}
        </div>
        <span className="text-[10px] tracking-tight font-medium font-mono">{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Floating Action Button (FAB) - Record Expense with scroll-hide & rotate-reveal */}
      <aside className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-50">
        <div className="flex justify-end px-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.75rem)]">
          <button
            onClick={onOpenNewTxnModal}
            className={`pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-tr from-[#FBD8B3] to-[#ffe2c4] text-[#1A1835] flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_20px_rgba(251,216,179,0.35)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.5),0_0_28px_rgba(251,216,179,0.5)] hover:scale-105 active:scale-95 border border-white/30 cursor-pointer group transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isFabVisible
                ? 'opacity-100 scale-100 rotate-0 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-50 -rotate-90 translate-y-8 pointer-events-none'
            }`}
            title="Record Expense"
            aria-label="Record Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5] text-[#1A1835] transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar - All 5 tabs */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-dock px-2 pt-2 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] z-40 flex items-center justify-around select-none">
        {tab('home', <Wallet className="w-5 h-5" />, 'Overview')}
        {tab('transactions', <ArrowLeftRight className="w-5 h-5" />, 'Ledger')}
        {tab('budget', <PieChart className="w-5 h-5" />, 'Budgets')}
        {tab('wishlist', <ShoppingBag className="w-5 h-5" />, 'Wishlist')}
        {tab('account', <User className="w-5 h-5" />, 'Vault')}
      </nav>
    </>
  );
};
