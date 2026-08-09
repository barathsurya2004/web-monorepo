import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import {
  User,
  EnvelopeGroup,
  Envelope,
  Allocation,
  Transaction,
  AuthSession,
  e5ToAmount
} from '@packages/types';

import { Header } from './components/Header';
import { SignupPage } from './components/SignupPage';
import { LoginPage } from './components/LoginPage';
import { BudgetOverview } from './components/BudgetOverview';
import { EnvelopeGroupsList } from './components/EnvelopeGroupsList';
import { TransactionTracker } from './components/TransactionTracker';
import {
  NewTxnModal,
  NewGroupModal,
  NewEnvModal,
  AllocationModal
} from './components/Modals';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [recentSessions, setRecentSessions] = useState<AuthSession[]>([]);

  const [groups, setGroups] = useState<EnvelopeGroup[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'budget' | 'transactions'>('budget');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [selectedEnvId, setSelectedEnvId] = useState<string | undefined>();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      const u = await api.getUser();
      setUser(u);

      const g = await api.getEnvelopeGroups();
      setGroups(Array.isArray(g) ? g : []);

      const e = await api.getEnvelopes();
      setEnvelopes(Array.isArray(e) ? e : []);

      const a = await api.getActiveAllocations();
      setAllocations(Array.isArray(a) ? a : []);

      const t = await api.getTransactions();
      setTransactions(Array.isArray(t) ? t : []);
    } catch (err) {
      console.error('Failed loading data from API', err);
      setGroups([]);
      setEnvelopes([]);
      setAllocations([]);
      setTransactions([]);
    }
  };

  // Initial Auth Verification on Mount
  useEffect(() => {
    const cachedSessions = api.getCachedSessions();
    setRecentSessions(cachedSessions);

    const activeToken = api.getToken();
    if (activeToken) {
      api
        .getUser()
        .then((u) => {
          setUser(u);
          setIsAuthenticated(true);
          loadData();
        })
        .catch(() => {
          setIsAuthenticated(false);
        });
    } else {
      setIsAuthenticated(false);
    }
  }, [isMockMode]);

  const handleLoginSuccess = async (authUser: User) => {
    setUser(authUser);
    setIsAuthenticated(true);
    setRecentSessions(api.getCachedSessions());
    showToast(`Welcome back, ${authUser.name}!`);
    await loadData();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthView('login');
    showToast('Signed out of Penne Budget');
  };

  const toggleMockMode = async () => {
    const nextMock = !isMockMode;
    api.setUseMock(nextMock);
    setIsMockMode(nextMock);
    showToast(`Switched to ${nextMock ? 'Demo Mode' : 'Live Backend Server'}`);
    if (isAuthenticated) {
      await loadData();
    }
  };

  // Render Unauthenticated Signup / Login Pages
  if (!isAuthenticated) {
    if (authView === 'signup') {
      return (
        <SignupPage
          onSignupSuccess={handleLoginSuccess}
          onNavigateToLogin={() => setAuthView('login')}
          onSignup={(name, email, pass) => api.signup(name, email, pass).then((res) => res.user)}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSignup={() => setAuthView('signup')}
        recentSessions={recentSessions}
        onLoginWithEmail={(email, pass) => api.login(email, pass).then((res) => res.user)}
        onLoginWithToken={(token) => api.loginWithToken(token)}
      />
    );
  }

  // Calculations for ZBB with array fallback guards
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeAllocations = Array.isArray(allocations) ? allocations : [];
  const safeEnvelopes = Array.isArray(envelopes) ? envelopes : [];
  const safeGroups = Array.isArray(groups) ? groups : [];

  const totalIncomeE5 = safeTransactions
    .filter((t) => t && t.txn_type === 'credit')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const totalAllocatedE5 = safeAllocations.reduce((acc, a) => acc + (a.allocated_amount_e5 || 0), 0);

  const totalSpentE5 = safeTransactions
    .filter((t) => t && t.txn_type === 'debit')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const readyToAssignE5 = totalIncomeE5 - totalAllocatedE5;

  // Handlers
  const handleCreateTxn = async (
    amountE5: number,
    txnType: string,
    bankName: string,
    envelopeId?: string
  ) => {
    await api.createTransaction(amountE5, txnType, bankName, envelopeId);
    showToast('Transaction recorded successfully!');
    await loadData();
  };

  const handleCreateGroup = async (name: string) => {
    await api.createEnvelopeGroup(name);
    showToast(`Envelope Group "${name}" created!`);
    await loadData();
  };

  const handleCreateEnv = async (groupId: string, targetE5: number, cadence: string) => {
    await api.createEnvelope(groupId, targetE5, cadence);
    showToast('Budget Envelope created!');
    await loadData();
  };

  const handleAllocate = async (envelopeId: string, amountE5: number) => {
    await api.createAllocation(envelopeId, amountE5);
    showToast('Envelope funded successfully!');
    await loadData();
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xl shadow-emerald-500/30 animate-fadeIn flex items-center gap-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        user={user}
        authToken={api.getToken()}
        isMockMode={isMockMode}
        onToggleMock={toggleMockMode}
        onLogout={handleLogout}
        onOpenNewTxn={() => setIsTxnModalOpen(true)}
        onOpenNewGroup={() => setIsGroupModalOpen(true)}
        onOpenNewEnv={() => {
          setSelectedGroupId(undefined);
          setIsEnvModalOpen(true);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Top Summary Banner */}
        <BudgetOverview
          totalIncomeE5={totalIncomeE5}
          totalAllocatedE5={totalAllocatedE5}
          totalSpentE5={totalSpentE5}
          readyToAssignE5={readyToAssignE5}
          onOpenAllocateModal={() => {
            setSelectedEnvId(undefined);
            setIsAllocateModalOpen(true);
          }}
        />

        {/* View Switcher Tabs */}
        <div className="flex items-center border-b border-slate-800 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('budget')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'budget'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Envelope Budgeting ({safeEnvelopes.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'transactions'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Transaction Tracker ({safeTransactions.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'budget' ? (
          <EnvelopeGroupsList
            groups={safeGroups}
            envelopes={safeEnvelopes}
            allocations={safeAllocations}
            transactions={safeTransactions}
            onOpenNewEnvelope={(gId) => {
              setSelectedGroupId(gId);
              setIsEnvModalOpen(true);
            }}
            onOpenQuickAllocate={(env) => {
              setSelectedEnvId(env.id);
              setIsAllocateModalOpen(true);
            }}
          />
        ) : (
          <TransactionTracker
            transactions={safeTransactions}
            envelopes={safeEnvelopes}
            onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <NewTxnModal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        envelopes={safeEnvelopes}
        onSubmit={handleCreateTxn}
      />

      <NewGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleCreateGroup}
      />

      <NewEnvModal
        isOpen={isEnvModalOpen}
        onClose={() => setIsEnvModalOpen(false)}
        groups={safeGroups}
        defaultGroupId={selectedGroupId}
        onSubmit={handleCreateEnv}
      />

      <AllocationModal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        envelopes={safeEnvelopes}
        readyToAssignE5={readyToAssignE5}
        selectedEnvelopeId={selectedEnvId}
        onSubmit={handleAllocate}
      />
    </div>
  );
};

export default App;
