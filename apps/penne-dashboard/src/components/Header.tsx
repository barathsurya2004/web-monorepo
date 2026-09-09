import React, { useState, useEffect, useRef } from 'react';
import { User } from '@packages/types';
import { RefreshCw, Check } from 'lucide-react';
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
  isFetching?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isMockMode,
  onToggleMock,
  onRefresh,
  isLoadingUser,
  isLoadingAny,
  isFetching = false,
}) => {
  const userName = user?.name || 'Barath';
  const firstLetter = userName.charAt(0).toUpperCase();

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const prevFetchingRef = useRef(isFetching);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFetching) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSyncStatus('syncing');
    } else if (prevFetchingRef.current && !isFetching) {
      // Background rehydration or refetch has completed!
      setSyncStatus('synced');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setSyncStatus('idle');
      }, 2500);
    }
    prevFetchingRef.current = isFetching;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isFetching]);

  const handleManualRefresh = () => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    if (onRefresh) onRefresh();
  };

  const isSpinning = syncStatus === 'syncing' || isLoadingAny;

  return (
    <>
      {/* Dynamic Island Micro Sync Notification (Non-banner, floating micro-pill) */}
      {syncStatus !== 'idle' && (
        <aside
          aria-live="polite"
          aria-atomic="true"
          className="fixed top-3.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none transition-all duration-300"
        >
          {syncStatus === 'syncing' ? (
            <div className="animate-sync-pill flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1735]/95 backdrop-blur-md border border-[#FBD8B3]/40 shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-[11px] font-mono text-[#FBD8B3]">
              <RefreshCw className="w-3 h-3 animate-spin text-[#FBD8B3]" />
              <span className="font-semibold tracking-wide">Syncing backend...</span>
            </div>
          ) : (
            <div className="animate-bump flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#132A22]/95 backdrop-blur-md border border-[#A8E6CF]/50 shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-[11px] font-mono text-[#A8E6CF]">
              <span className="w-3.5 h-3.5 rounded-full bg-[#A8E6CF]/20 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[#A8E6CF]" />
              </span>
              <span className="font-semibold tracking-wide">Synced with backend</span>
            </div>
          )}
        </aside>
      )}

      <header className="w-full max-w-full overflow-x-hidden bg-transparent px-4 pt-[max(calc(env(safe-area-inset-top,0px)+1rem),3.25rem)] sm:pt-6 pb-2">
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
                onClick={handleManualRefresh}
                disabled={isSpinning}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${
                  syncStatus === 'syncing'
                    ? 'bg-[#322E5C] text-[#FBD8B3] border-[#FBD8B3]/60 shadow-[0_0_14px_rgba(251,216,179,0.35)] scale-105'
                    : syncStatus === 'synced'
                    ? 'animate-bump bg-[#A8E6CF]/20 text-[#A8E6CF] border-[#A8E6CF]/60 shadow-[0_0_14px_rgba(168,230,207,0.35)]'
                    : 'bg-[#232044] hover:bg-[#322E5C] text-slate-300 hover:text-[#FBD8B3] border-white/10 hover:scale-105 active:scale-90 disabled:opacity-50'
                }`}
                title={
                  syncStatus === 'syncing'
                    ? 'Syncing data with backend...'
                    : syncStatus === 'synced'
                    ? 'Synced with backend'
                    : 'Rehydrate balances'
                }
                aria-label="Refresh Data"
              >
                {syncStatus === 'synced' ? (
                  <Check className="w-3.5 h-3.5 text-[#A8E6CF]" />
                ) : (
                  <RefreshCw
                    className={`w-3.5 h-3.5 transition-colors ${
                      isSpinning ? 'animate-spin text-[#FBD8B3]' : ''
                    }`}
                  />
                )}
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
    </>
  );
};
