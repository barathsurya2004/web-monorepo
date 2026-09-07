import React from 'react';
import { User } from '@packages/types';
import { RefreshCw, Server } from 'lucide-react';
import { UserHeaderSkeleton } from './Skeleton';

interface HeaderProps {
  user: User | null;
  authToken: string | null;
  isMockMode: boolean;
  onToggleMock: () => void;
  onRefresh?: () => void;
  onLogout: () => void;
  onOpenNewTxn?: () => void;
  isLoadingUser?: boolean;
  isLoadingAny?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isMockMode,
  onToggleMock,
  onRefresh,
  isLoadingUser,
  isLoadingAny
}) => {
  const userName = user?.name || 'Barath';
  const firstLetter = userName.charAt(0).toUpperCase();

  return (
    <header className="w-full max-w-full overflow-x-hidden bg-transparent px-4 pt-5 pb-2">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3 min-w-0">
        {/* Left: Brand Logo & Title */}
        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 block uppercase font-mono leading-none mb-1">
            Penne
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
            Bill & <span className="text-[#FBD8B3]">Budget</span>
          </h1>
        </div>

        {/* Right: Live/Demo Status Pill, Refresh Button & User Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Server Mode Toggle Pill */}
          <button
            onClick={onToggleMock}
            className={`h-9 px-3 rounded-full text-[11px] font-mono font-bold inline-flex items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
              !isMockMode
                ? 'bg-[#FBD8B3] text-[#1A1835] border-[#FBD8B3] shadow-[0_0_14px_rgba(251,216,179,0.35)]'
                : 'bg-[#232044] text-slate-300 border-white/10 hover:border-white/20'
            }`}
            title="Toggle API Server Mode"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${!isMockMode ? 'bg-[#1A1835]' : 'bg-[#FBD8B3] animate-pulse'}`}></span>
            <span>{!isMockMode ? 'Live' : 'Demo'}</span>
          </button>

          {/* Data Rehydrate / Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoadingAny}
              className="w-9 h-9 rounded-full bg-[#232044] hover:bg-[#322E5C] hover:text-[#FBD8B3] border border-white/10 flex items-center justify-center text-slate-300 active:scale-90 transition-all duration-200 cursor-pointer disabled:opacity-50 shrink-0"
              title="Rehydrate balances"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAny ? 'animate-spin text-[#FBD8B3]' : ''}`} />
            </button>
          )}

          {/* User Avatar Circle */}
          {isLoadingUser ? (
            <UserHeaderSkeleton />
          ) : (
            <button
              className="w-9 h-9 rounded-full bg-[#232044] border-2 border-[#FBD8B3]/80 hover:border-[#FBD8B3] hover:shadow-[0_0_12px_rgba(251,216,179,0.4)] flex items-center justify-center text-xs font-black text-[#FBD8B3] shadow-[0_4px_12px_rgba(0,0,0,0.3)] shrink-0 transition-all duration-200 active:scale-95 cursor-pointer"
              title={`Logged in as ${userName}`}
              aria-label={userName}
            >
              {firstLetter}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
