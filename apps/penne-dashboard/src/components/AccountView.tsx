import React, { useState } from 'react';
import { User, AuthSession } from '@packages/types';
import { Button, Card, Badge } from '@packages/ui';
import { User as UserIcon, Server, LogOut, Copy, Check, ShieldCheck, Key, Clock } from 'lucide-react';

interface AccountViewProps {
  user: User | null;
  authToken: string | null;
  isMockMode: boolean;
  recentSessions: AuthSession[];
  onToggleMock: () => void;
  onLogout: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  authToken,
  isMockMode,
  recentSessions,
  onToggleMock,
  onLogout
}) => {
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    if (authToken) {
      navigator.clipboard.writeText(authToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fadeIn pb-28 w-full max-w-full overflow-x-hidden">
      {/* Account Profile Header */}
      <Card className="text-center py-6 space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#E07A5F]/20 text-[#E07A5F] border-2 border-[#E07A5F]/40 flex items-center justify-center font-black text-2xl mx-auto shadow-md">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h2 className="text-xl font-black text-[#F4F1DE]">{user?.name || 'Penne User'}</h2>
          <p className="text-xs text-[#A89F95] font-mono mt-0.5">{user?.uuid || 'No UUID'}</p>
        </div>
        <div className="pt-2">
          <Badge variant="terracotta" className="text-xs">
            Active Auth Session
          </Badge>
        </div>
      </Card>

      {/* Backend & API Server Settings */}
      <Card className="space-y-4">
        <h3 className="text-sm font-extrabold text-[#F4F1DE] flex items-center gap-2">
          <Server className="w-4 h-4 text-[#E07A5F]" /> Server Connection
        </h3>

        <div className="bg-[#1A1715] p-3.5 rounded-2xl border border-[#342F2C] flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-bold text-[#F4F1DE]">Current Backend Mode</p>
            <p className="text-[11px] text-[#A89F95] truncate">
              {isMockMode ? 'Demo Mode (Offline Local State)' : 'Live Go Server'}
            </p>
          </div>

          <button
            onClick={onToggleMock}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isMockMode
                ? 'bg-[#F2CC8F]/15 text-[#F2CC8F] border border-[#F2CC8F]/30'
                : 'bg-[#81B29A]/15 text-[#81B29A] border border-[#81B29A]/30'
            }`}
          >
            {isMockMode ? 'Switch to Live' : 'Switch to Demo'}
          </button>
        </div>
      </Card>

      {/* Auth Token Card */}
      {authToken && (
        <Card className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#F4F1DE] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#81B29A]" /> Active Bearer Token
          </h3>

          <div className="bg-[#1A1715] p-3 rounded-2xl border border-[#342F2C] flex items-center justify-between gap-2">
            <p className="font-mono text-xs text-[#A89F95] truncate max-w-[220px]">
              {authToken}
            </p>
            <button
              onClick={copyToken}
              className="px-3 py-1.5 rounded-xl bg-[#2E2A27] hover:bg-[#3E3835] text-[#F4F1DE] text-xs font-bold flex items-center gap-1 transition-all shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#81B29A]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </Card>
      )}

      {/* Recent Cached Sessions */}
      {recentSessions.length > 0 && (
        <Card className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#F4F1DE] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F2CC8F]" /> Local Sessions ({recentSessions.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {recentSessions.map((session) => (
              <div
                key={session.token}
                className="bg-[#1A1715] border border-[#342F2C] rounded-2xl p-2.5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#F4F1DE] truncate">{session.name}</p>
                  <p className="font-mono text-[10px] text-[#8C837A] truncate max-w-[180px]">
                    {session.token}
                  </p>
                </div>
                <Badge variant="sage" className="text-[10px]">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sign Out Button */}
      <Button
        variant="danger"
        size="lg"
        onClick={onLogout}
        className="w-full gap-2 font-bold shadow-lg"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of Account</span>
      </Button>
    </div>
  );
};
