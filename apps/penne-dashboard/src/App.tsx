import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api, ApiEventListenerPayload } from './services/api';
import { User, Transaction, AuthSession, ActiveCategory, EnvelopeGroup, Envelope, DashboardSummary } from '@packages/types';
import { useDashboardData, QUERY_KEYS } from './hooks/useDashboardData';
import { queryClient } from './services/queryClient';

import { Header } from './components/Header';
import { SignupPage } from './components/SignupPage';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { TransactionsPage } from './components/TransactionsPage';
import { BudgetPage } from './components/BudgetPage';
import { AccountView } from './components/AccountView';
import { BottomTabBar, NavTab } from './components/BottomTabBar';
import { NewTxnModal, NewCategoryModal, EditTxnModal, EditCategoryModal, EditGroupModal } from './components/Modals';
import { ToastProvider, useToast } from './components/AlertBanner';

export interface ResourceLoadingStates {
  user: boolean;
  transactions: boolean;
  categories: boolean;
  envelopeGroups: boolean;
  envelopes: boolean;
  summary: boolean;
}

const AppInner: React.FC = () => {
  const { addToast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!api.getToken());
  const [authView, setAuthView] = useState<'login' | 'signup'>('signup');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const mainRef = useRef<HTMLElement | null>(null);

  // TanStack Query Request Caching & Optimistic UI Data
  const {
    user,
    transactions,
    dashboardSummary,
    categories,
    envelopes,
    envelopeGroups,
    isLoadingUser,
    isLoadingTransactions,
    isLoadingSummary,
    isLoadingCategories,
    isLoadingEnvelopes,
    isLoadingGroups,
    isFetching,
    refetchAll,
    createTxnMutation,
  } = useDashboardData(isAuthenticated);

  const loadingState: ResourceLoadingStates = useMemo(() => ({
    user: isLoadingUser,
    transactions: isLoadingTransactions,
    categories: isLoadingCategories,
    envelopeGroups: isLoadingGroups,
    envelopes: isLoadingEnvelopes,
    summary: isLoadingSummary,
  }), [isLoadingUser, isLoadingTransactions, isLoadingCategories, isLoadingGroups, isLoadingEnvelopes, isLoadingSummary]);

  const isLoadingAny = useMemo(() => Object.values(loadingState).some(Boolean), [loadingState]);

  // Automatically scroll to the top of the viewport when changing pages/tabs
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
      if (mainRef.current) mainRef.current.scrollTop = 0;
    };

    scrollToTop();
    const rafId = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(rafId);
  }, [activeTab]);

  const [recentSessions, setRecentSessions] = useState<AuthSession[]>([]);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [isServerOffline, setIsServerOffline] = useState<boolean>(false);

  // Modal State
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedTxnForEdit, setSelectedTxnForEdit] = useState<Transaction | null>(null);
  const [isEditTxnModalOpen, setIsEditTxnModalOpen] = useState(false);

  const [selectedEnvelopeForEdit, setSelectedEnvelopeForEdit] = useState<Envelope | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<EnvelopeGroup | null>(null);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);

  const [isLoadingMoreTxns, setIsLoadingMoreTxns] = useState(false);
  const [hasMoreTxns, setHasMoreTxns] = useState(true);

  const handleLoadMoreTransactions = async () => {
    if (isLoadingMoreTxns || transactions.length === 0) return;
    setIsLoadingMoreTxns(true);
    try {
      const lastTxn = transactions[transactions.length - 1];
      const more = await api.getTransactions(
        undefined,
        20,
        lastTxn.created_at,
        lastTxn.id
      );
      if (Array.isArray(more) && more.length > 0) {
        queryClient.setQueryData<Transaction[]>(QUERY_KEYS.transactions, (prev = []) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const uniqueMore = more.filter((t) => !existingIds.has(t.id));
          return [...prev, ...uniqueMore];
        });
        if (more.length < 20) setHasMoreTxns(false);
      } else {
        setHasMoreTxns(false);
      }
    } catch (err) {
      console.warn('[Penne App] Load more transactions failed', err);
    } finally {
      setIsLoadingMoreTxns(false);
    }
  };

  // Subscribe to API Request & Status Events globally
  useEffect(() => {
    const unsubscribe = api.onApiResult((event: ApiEventListenerPayload) => {
      addToast({
        type: event.type,
        statusCode: event.statusCode,
        title: event.title,
        message: event.message,
        method: event.method,
        endpoint: event.endpoint,
        duration: 1000,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [addToast]);

  const loadData = async () => {
    setIsServerOffline(false);
    try {
      await refetchAll();
    } catch (err: any) {
      if (api.isUnauthorizedError(err)) {
        handleLogout();
      } else {
        setIsServerOffline(true);
      }
    }
  };

  // Initial Auth Verification on Mount
  useEffect(() => {
    const cachedSessions = api.getCachedSessions();
    setRecentSessions(cachedSessions);

    const activeToken = api.getToken();
    if (activeToken) {
      setIsAuthenticated(true);
      loadData();
    } else {
      setIsAuthenticated(false);
      setAuthView('signup');
    }
  }, [isMockMode]);

  const handleLoginSuccess = async (authUser: User) => {
    queryClient.setQueryData(QUERY_KEYS.user, authUser);
    setIsAuthenticated(true);
    setRecentSessions(api.getCachedSessions());
    addToast({
      type: 'success',
      statusCode: '200 OK',
      title: 'Welcome Back!',
      message: `Signed in as ${authUser.name}`,
    });
    await refetchAll();
  };

  const handleLogout = () => {
    api.logout();
    queryClient.clear();
    setIsAuthenticated(false);
    setAuthView('signup');
    setActiveTab('home');
    setIsServerOffline(false);
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have signed out of Penne Budget',
    });
  };

  const handleRefreshData = async () => {
    await loadData();
  };

  const toggleMockMode = async () => {
    const nextMock = !isMockMode;
    api.setUseMock(nextMock);
    setIsMockMode(nextMock);
    setIsServerOffline(false);
    addToast({
      type: 'info',
      statusCode: 'MODE CHANGE',
      title: `Switched to ${nextMock ? 'Demo Mode' : 'Live Server'}`,
      message: nextMock
        ? 'Using simulated in-memory store.'
        : 'Connecting to backend server.',
    });
    if (isAuthenticated) {
      await refetchAll();
    }
  };

  const refreshSummarySilent = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardSummary });
  };

  const refreshTransactionsSilent = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
  };

  const refreshCategoriesSilent = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.envelopes });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.envelopeGroups });
  };

  // Optimistic transaction creation handler
  const handleCreateTxn = async (
    amountE5: number,
    txnType: string,
    bankName: string,
    envelopeId?: string | null,
    createdAt?: string
  ) => {
    try {
      await createTxnMutation.mutateAsync({
        amountE5,
        txnType,
        paymentMethod: bankName,
        envelopeId,
        createdAt,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Transaction Failed',
        message: err.message || 'Failed to create transaction',
      });
    }
  };

  const handleSelectTxnForEdit = (txn: Transaction) => {
    setSelectedTxnForEdit(txn);
    setIsEditTxnModalOpen(true);
  };

  const handleUpdateTxn = async (
    txnId: string,
    amountE5: number,
    txnType: string,
    bankName: string,
    envelopeId?: string | null
  ) => {
    // 1. Snapshot previous state for rollback
    const prevTxns = queryClient.getQueryData<Transaction[]>(QUERY_KEYS.transactions) || [];
    const existingTxn = prevTxns.find((t) => t.id === txnId);

    // 2. Immediate optimistic update in cache
    const optimisticTxn: Transaction = {
      ...(existingTxn || {
        id: txnId,
        user_id: api.getUserUUID(),
        country_iso2: 'IN',
        created_at: new Date().toISOString()
      }),
      amount_e5: Math.round(amountE5),
      txn_type: txnType,
      payment_method: bankName,
      envelope_id: envelopeId || null,
    };

    queryClient.setQueryData<Transaction[]>(QUERY_KEYS.transactions, (prev = []) =>
      prev.map((t) => (t.id === txnId ? optimisticTxn : t))
    );

    try {
      const updatedTxn = await api.updateTransaction(
        txnId,
        amountE5,
        txnType,
        bankName,
        envelopeId,
        existingTxn?.created_at
      );
      queryClient.setQueryData<Transaction[]>(QUERY_KEYS.transactions, (prev = []) =>
        prev.map((t) => (t.id === txnId ? updatedTxn : t))
      );
      refreshSummarySilent();
      refreshTransactionsSilent();
      refreshCategoriesSilent();
    } catch (err: any) {
      // Rollback on failure
      queryClient.setQueryData(QUERY_KEYS.transactions, prevTxns);
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Update Failed',
        message: err.message || 'Failed to update transaction',
      });
    }
  };

  const handleDeleteTxn = async (txnId: string) => {
    try {
      await api.deleteTransaction(txnId);
      queryClient.setQueryData<Transaction[]>(QUERY_KEYS.transactions, (prev = []) =>
        prev.filter((t) => t.id !== txnId)
      );
      refreshSummarySilent();
      refreshTransactionsSilent();
      refreshCategoriesSilent();
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete transaction',
      });
    }
  };

  const handleCreateCategory = async (
    groupId: string | null,
    newGroupName: string | null,
    categoryName: string,
    targetAmountE5: number,
    cadence: string
  ) => {
    try {
      let targetGroupId = groupId;
      if (!targetGroupId && newGroupName) {
        const createdGroup = await api.createEnvelopeGroup(newGroupName);
        targetGroupId = createdGroup.id;
        queryClient.setQueryData<EnvelopeGroup[]>(QUERY_KEYS.envelopeGroups, (prev = []) => [...prev, createdGroup]);
      }

      if (!targetGroupId) {
        addToast({
          type: 'warning',
          title: 'Missing Group',
          message: 'Please select or enter a valid Envelope Group',
        });
        return;
      }

      const { envelope } = await api.createCategory(targetGroupId, categoryName, targetAmountE5, cadence);

      // Immediately register newly created envelope in queryClient cache for 0ms latency
      if (envelope && envelope.id) {
        queryClient.setQueryData<Envelope[]>(QUERY_KEYS.envelopes, (prev = []) => {
          const filtered = prev.filter((e) => e.id !== envelope.id);
          return [...filtered, envelope];
        });
        queryClient.setQueryData<ActiveCategory[]>(QUERY_KEYS.categories, (prev = []) => {
          const filtered = prev.filter((c) => c.envelope_id !== envelope.id);
          const newCategory: ActiveCategory = {
            name: envelope.name || categoryName,
            allocated_amount_e5: targetAmountE5,
            is_system: false,
            currency: envelope.country_iso2 || 'IN',
            cadence: envelope.cadence || cadence,
            envelope_id: envelope.id,
          };
          return [...filtered, newCategory];
        });
      }

      refreshCategoriesSilent();
      refreshTransactionsSilent();
      refreshSummarySilent();
      addToast({
        type: 'success',
        statusCode: 'OK',
        title: 'Category Created',
        message: `Created budget category "${categoryName}"`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Category Creation Failed',
        message: err.message || 'Failed to create budget category',
      });
    }
  };

  const handleSelectEnvelopeForEdit = (env: Envelope) => {
    setSelectedEnvelopeForEdit(env);
    setIsEditCategoryModalOpen(true);
  };

  const handleSelectGroupForEdit = (group: EnvelopeGroup) => {
    setSelectedGroupForEdit(group);
    setIsEditGroupModalOpen(true);
  };

  const handleUpdateCategory = async (
    id: string,
    name: string,
    targetAmountE5: number,
    cadence: string,
    envelopeGroupId?: string
  ) => {
    try {
      const updatedEnv = await api.updateEnvelope(id, name, targetAmountE5, cadence, envelopeGroupId);
      queryClient.setQueryData<Envelope[]>(QUERY_KEYS.envelopes, (prev = []) =>
        prev.map((e) => (e.id === id ? updatedEnv : e))
      );
      queryClient.setQueryData<ActiveCategory[]>(QUERY_KEYS.categories, (prev = []) =>
        prev.map((c) =>
          c.envelope_id === id
            ? { ...c, name, allocated_amount_e5: targetAmountE5, cadence }
            : c
        )
      );
      refreshCategoriesSilent();
      refreshSummarySilent();
      refreshTransactionsSilent();
      addToast({
        type: 'success',
        statusCode: 'OK',
        title: 'Category Updated',
        message: `Updated category "${name}"`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Update Failed',
        message: err.message || 'Failed to update category envelope',
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteEnvelope(id);
      queryClient.setQueryData<Envelope[]>(QUERY_KEYS.envelopes, (prev = []) =>
        prev.filter((e) => e.id !== id)
      );
      queryClient.setQueryData<ActiveCategory[]>(QUERY_KEYS.categories, (prev = []) =>
        prev.filter((c) => c.envelope_id !== id)
      );
      refreshCategoriesSilent();
      refreshSummarySilent();
      refreshTransactionsSilent();
      addToast({
        type: 'success',
        statusCode: 'OK',
        title: 'Category Deleted',
        message: 'Successfully deleted category envelope',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete category envelope',
      });
    }
  };

  const handleUpdateGroup = async (id: string, name: string) => {
    try {
      const updatedGroup = await api.updateEnvelopeGroup(id, name);
      queryClient.setQueryData<EnvelopeGroup[]>(QUERY_KEYS.envelopeGroups, (prev = []) =>
        prev.map((g) => (g.id === id ? updatedGroup : g))
      );
      refreshCategoriesSilent();
      addToast({
        type: 'success',
        statusCode: 'OK',
        title: 'Group Updated',
        message: `Renamed envelope group to "${name}"`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Update Failed',
        message: err.message || 'Failed to update envelope group',
      });
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await api.deleteEnvelopeGroup(id);
      queryClient.setQueryData<EnvelopeGroup[]>(QUERY_KEYS.envelopeGroups, (prev = []) =>
        prev.filter((g) => g.id !== id)
      );
      refreshCategoriesSilent();
      addToast({
        type: 'success',
        statusCode: 'OK',
        title: 'Group Deleted',
        message: 'Successfully deleted envelope group',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete envelope group',
      });
    }
  };

  // Unauthenticated Views
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

  // Authenticated Views
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#1A1735] text-[#F5F3FF] w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <Header
        user={user}
        authToken={api.getToken()}
        isMockMode={isMockMode}
        onToggleMock={toggleMockMode}
        onRefresh={handleRefreshData}
        onLogout={handleLogout}
        onOpenNewTxn={() => setIsTxnModalOpen(true)}
        isLoadingUser={loadingState.user}
        isLoadingAny={isLoadingAny}
        isFetching={isFetching}
      />

      {/* Dynamic Tab Contents: Home, Budget & Account */}
      <main ref={mainRef} className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeTab === 'home' && (
          <HomePage
            transactions={transactions}
            envelopes={envelopes}
            envelopeGroups={envelopeGroups}
            categories={categories}
            dashboardSummary={dashboardSummary}
            isServerOffline={isServerOffline}
            isMockMode={isMockMode}
            onRetryConnection={loadData}
            onToggleMock={toggleMockMode}
            onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
            onOpenNewCategoryModal={() => setIsCategoryModalOpen(true)}
            onSelectTxnForEdit={handleSelectTxnForEdit}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            isLoadingTransactions={loadingState.transactions}
            isLoadingEnvelopes={loadingState.envelopes}
            isLoadingSummary={loadingState.summary}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsPage
            transactions={transactions}
            envelopeGroups={envelopeGroups}
            envelopes={envelopes}
            categories={categories}
            isServerOffline={isServerOffline}
            isMockMode={isMockMode}
            onRetryConnection={loadData}
            onToggleMock={toggleMockMode}
            onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
            onSelectTxnForEdit={handleSelectTxnForEdit}
            onLoadMore={handleLoadMoreTransactions}
            hasMore={hasMoreTxns}
            isLoadingMore={isLoadingMoreTxns}
            isLoadingTransactions={loadingState.transactions}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetPage
            categories={categories}
            transactions={transactions}
            envelopeGroups={envelopeGroups}
            envelopes={envelopes}
            isServerOffline={isServerOffline}
            isMockMode={isMockMode}
            onRetryConnection={loadData}
            onToggleMock={toggleMockMode}
            onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
            onOpenNewCategoryModal={() => setIsCategoryModalOpen(true)}
            onSelectTxnForEdit={handleSelectTxnForEdit}
            onSelectEnvelopeForEdit={handleSelectEnvelopeForEdit}
            onSelectGroupForEdit={handleSelectGroupForEdit}
            isLoadingCategories={loadingState.categories}
            isLoadingTransactions={loadingState.transactions}
            isLoadingEnvelopes={loadingState.envelopes}
          />
        )}

        {activeTab === 'account' && (
          <AccountView
            user={user}
            authToken={api.getToken()}
            transactions={transactions}
            dashboardSummary={dashboardSummary}
            isMockMode={isMockMode}
            recentSessions={recentSessions}
            onToggleMock={toggleMockMode}
            onLogout={handleLogout}
            isLoadingUser={loadingState.user}
            isLoadingTransactions={loadingState.transactions}
            isLoadingSummary={loadingState.summary}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
      />

      {/* New Transaction Modal */}
      <NewTxnModal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        envelopes={envelopes}
        groups={envelopeGroups}
        onSubmit={handleCreateTxn}
      />

      {/* Edit Transaction Modal */}
      <EditTxnModal
        isOpen={isEditTxnModalOpen}
        onClose={() => {
          setIsEditTxnModalOpen(false);
          setSelectedTxnForEdit(null);
        }}
        transaction={selectedTxnForEdit}
        envelopes={envelopes}
        groups={envelopeGroups}
        onSubmit={handleUpdateTxn}
        onDelete={handleDeleteTxn}
      />

      {/* New Category Modal */}
      <NewCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        groups={envelopeGroups}
        onSubmit={handleCreateCategory}
      />

      {/* Edit Category (Envelope) Modal */}
      <EditCategoryModal
        isOpen={isEditCategoryModalOpen}
        onClose={() => {
          setIsEditCategoryModalOpen(false);
          setSelectedEnvelopeForEdit(null);
        }}
        envelope={selectedEnvelopeForEdit}
        groups={envelopeGroups}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
        onEditGroup={handleSelectGroupForEdit}
      />

      {/* Edit Envelope Group Modal */}
      <EditGroupModal
        isOpen={isEditGroupModalOpen}
        onClose={() => {
          setIsEditGroupModalOpen(false);
          setSelectedGroupForEdit(null);
        }}
        group={selectedGroupForEdit}
        onUpdate={handleUpdateGroup}
        onDelete={handleDeleteGroup}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
};

export default App;

