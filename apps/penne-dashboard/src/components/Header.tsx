import React, { useState } from 'react';
import { Button, Badge } from '@packages/ui';
import { User } from '@packages/types';
import { Wallet, Server, ShieldCheck, Plus, DollarSign, Layers, LogOut, Copy, Check } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  authToken: string | null;
  isMockMode: boolean;
  onToggleMock: () => void;
  onLogout: () => void;
  onOpenNewTxn: () => void;
  onOpenNewGroup: () => void;
  onOpenNewEnv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  authToken,
  isMockMode,
  onToggleMock,
  onLogout,
  onOpenNewTxn,
  onOpenNewGroup,
  onOpenNewEnv
}) => {
  const [copiedToken, setCopiedToken] = useState(false);

  const copyToken = () => {
    if (authToken) {
      navigator.clipboard.writeText(authToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/80 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-50">
                Penne<span className="text-emerald-400">Dashboard</span>
              </h1>
              <Badge variant="apple" className="text-[10px] tracking-wider uppercase font-semibold">
                Apple Auth
              </Badge>
            </div>
            <p className="text-xs text-slate-400">Zero-Based Budgeting Architecture</p>
          </div>
        </div>

        {/* User Info, Token Badge & Server Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onToggleMock}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 transition-all text-xs text-slate-300"
            title="Toggle API Server Mode"
          >
            <Server className={`w-3.5 h-3.5 ${isMockMode ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>Mode: <strong className={isMockMode ? 'text-amber-400' : 'text-emerald-400'}>{isMockMode ? 'Demo Preview' : 'Live Server'}</strong></span>
          </button>

          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-slate-200 font-semibold">{user.name}</span>

              {authToken && (
                <button
                  onClick={copyToken}
                  title="Copy Auth Token"
                  className="ml-1 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                >
                  {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'Copied' : 'Token'}</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <Button size="sm" variant="outline" onClick={onOpenNewGroup} className="gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Group</span>
          </Button>

          <Button size="sm" variant="outline" onClick={onOpenNewEnv} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            <span>Envelope</span>
          </Button>

          <Button size="sm" variant="primary" onClick={onOpenNewTxn} className="gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Transaction</span>
          </Button>

          <Button size="sm" variant="ghost" onClick={onLogout} className="text-rose-400 hover:text-rose-300 gap-1">
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
