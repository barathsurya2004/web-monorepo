import React from 'react';
import { User } from '@packages/types';
import { Wallet, Server } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  authToken: string | null;
  isMockMode: boolean;
  onToggleMock: () => void;
  onLogout: () => void;
  onOpenNewTxn?: () => void;
  isLoadingData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isMockMode,
  onToggleMock,
  isLoadingData
}) => {
  return (
    // Mobile-First Top App Bar: Extra safe-area status bar padding, compact, 100% overflow-free
    <header className="w-full max-w-full overflow-x-hidden bg-[#1E1B19] border-b border-[#342F2C] px-4 pb-3.5 pt-[max(calc(env(safe-area-inset-top,0px)+0.875rem),1.25rem)]">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 min-w-0">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#E07A5F] p-0.5 shadow-sm shadow-[#E07A5F]/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#1A1715] rounded-[10px] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#E07A5F]" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black tracking-tight text-[#F4F1DE] truncate">
              Penne<span className="text-[#E07A5F]">Budget</span>
            </h1>
          </div>
        </div>

        {/* Right: Live/Demo Status Pill & User Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Server Mode Toggle Pill */}
          <button
            onClick={onToggleMock}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
              isMockMode
                ? 'bg-[#F2CC8F]/15 text-[#F2CC8F] border-[#F2CC8F]/30'
                : 'bg-[#81B29A]/15 text-[#81B29A] border-[#81B29A]/30'
            }`}
            title="Toggle API Server Mode"
          >
            <Server className="w-3 h-3" />
            <span>{isMockMode ? 'Demo' : 'Live'}</span>
          </button>

          {/* User Avatar Circle or Loading Skeleton */}
          {isLoadingData ? (
            <div className="w-7 h-7 rounded-full bg-[#2E2A27] animate-pulse shrink-0" />
          ) : user ? (
            <div
              className="w-7 h-7 rounded-full bg-[#E07A5F]/20 text-[#E07A5F] border border-[#E07A5F]/40 flex items-center justify-center font-black text-xs shrink-0"
              title={user.name}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
