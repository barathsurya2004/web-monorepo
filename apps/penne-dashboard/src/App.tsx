import React, { useEffect, useState, useMemo } from 'react';
import { api, ApiEventListenerPayload } from './services/api';
import { User, Transaction, AuthSession, ActiveCategory, EnvelopeGroup, Envelope } from '@packages/types';

import { Header } from './components/Header';
import { SignupPage } from './components/SignupPage';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { TransactionsPage } from './components/TransactionsPage';
import { BudgetPage } from './components/BudgetPage';
import { AccountView } from './components/AccountView';
import { BottomTabBar, NavTab } from './components/BottomTabBar';
import { NewTxnModal, NewCategoryModal, EditTxnModal } from './components/Modals';
import { ToastProvider, useToast } from './components/AlertBanner';

export interface ResourceLoadingStates {
  user: boolean;
  transactions: boolean;
  categories: boolean;
  envelopeGroups: boolean;
  envelopes: boolean;
}

const AppInner: React.FC = () => {
  const { addToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!api.getToken());
  const [loadingState, setLoadingState] = useState<ResourceLoadingStates>(() => ({
    user: !!api.getToken(),
    transactions: !!api.getToken(),
    categories: !!api.getToken(),
    envelopeGroups: !!api.getToken(),
    envelopes: !!api.getToken()
  }));
  const [authView, setAuthView] = useState<'login' | 'signup'>('signup');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [recentSessions, setRecentSessions] = useState<AuthSession[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<ActiveCategory[]>([]);
  const [envelopeGroups, setEnvelopeGroups] = useState<EnvelopeGroup[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [isServerOffline, setIsServerOffline] = useState<boolean>(false);

  // Modal State
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedTxnForEdit, setSelectedTxnForEdit] = useState<Transaction | null>(null);
  const [isEditTxnModalOpen, setIsEditTxnModalOpen] = useState(false);

  const setResourceLoading = (resource: keyof ResourceLoadingStates, loading: boolean) => {
    setLoadingState((prev) => ({ ...prev, [resource]: loading }));
  };

  const isLoadingAny = useMemo(() => Object.values(loadingState).some(Boolean), [loadingState]);

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
        duration: 1000
      });
    });

    return () => {
      unsubscribe();
    };
  }, [addToast]);

  const loadData = async () => {
    setIsServerOffline(false);
    setLoadingState({
      user: true,
      transactions: true,
      categories: true,
      envelopeGroups: true,
      envelopes: true
    });

    const isUnauthorized = (err: any) => {
      if (api.isUnauthorizedError(err)) {
        api.logout();
        setUser(null);
        setIsAuthenticated(false);
        setAuthView('signup');
        addToast({
          type: 'warning',
          statusCode: '401 UNAUTHORIZED',
          title: 'Session Expired',
          message: 'Your session has expired. Redirecting to Signup.'
        });
        return true;
      }
      return false;
    };

    // 1. Fetch User Profile independently
    const fetchUser = api
      .getUser()
      .then((u) => setUser(u))
      .catch((err) => {
        if (!isUnauthorized(err)) console.warn('Failed to load user', err);
      })
      .finally(() => setResourceLoading('user', false));

    // 2. Fetch Transactions independently
    const fetchTransactions = api
      .getTransactions()
      .then((t) => {
        setTransactions(Array.isArray(t) ? t : []);
        setIsServerOffline(false);
      })
      .catch((err) => {
        if (!isUnauthorized(err)) {
          console.warn('Failed to load transactions', err);
          setIsServerOffline(true);
        }
      })
      .finally(() => setResourceLoading('transactions', false));

    // 3. Fetch Active Categories independently
    const fetchCategories = api
      .getActiveCategories()
      .then((c) => setCategories(Array.isArray(c) ? c : []))
      .catch((err) => {
        if (!isUnauthorized(err)) console.warn('Failed to load categories', err);
      })
      .finally(() => setResourceLoading('categories', false));

    // 4. Fetch Envelope Groups independently
    const fetchGroups = api
      .getEnvelopeGroups()
      .then((g) => setEnvelopeGroups(Array.isArray(g) ? g : []))
      .catch((err) => {
        if (!isUnauthorized(err)) console.warn('Failed to load envelope groups', err);
      })
      .finally(() => setResourceLoading('envelopeGroups', false));

    // 5. Fetch Envelopes independently
    const fetchEnvelopes = api
      .getEnvelopes()
      .then((envs) => setEnvelopes(Array.isArray(envs) ? envs : []))
      .catch((err) => {
        if (!isUnauthorized(err)) console.warn('Failed to load envelopes', err);
      })
      .finally(() => setResourceLoading('envelopes', false));

    // Execute all resource fetches concurrently without blocking each other
    await Promise.allSettled([fetchUser, fetchTransactions, fetchCategories, fetchGroups, fetchEnvelopes]);
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
      setLoadingState({
        user: false,
        transactions: false,
        categories: false,
        envelopeGroups: false,
        envelopes: false
      });
      setAuthView('signup');
    }
  }, [isMockMode]);

  const handleLoginSuccess = async (authUser: User) => {
    setUser(authUser);
    setIsAuthenticated(true);
    setRecentSessions(api.getCachedSessions());
    addToast({
      type: 'success',
      statusCode: '200 OK',
      title: 'Welcome Back!',
      message: `Signed in as ${authUser.name}`
    });
    await loadData();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
    setLoadingState({
      user: false,
      transactions: false,
      categories: false,
      envelopeGroups: false,
      envelopes: false
    });
    setAuthView('signup');
    setActiveTab('home');
    setIsServerOffline(false);
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have signed out of Penne Budget'
    });
  };

  const handleRefreshData = async () => {
    await loadData();
    addToast({
      type: 'info',
      title: 'Data Synced',
      message: 'Latest transactions & budget envelopes rehydrated.'
    });
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
        : 'Connecting to backend server.'
    });
    if (isAuthenticated) {
      await loadData();
    }
  };

  const refreshTransactionsSilent = async () => {
    try {
      const t = await api.getTransactions();
      if (Array.isArray(t)) setTransactions(t);
    } catch (err) {
      console.warn('[Penne App] Silent transactions refresh failed', err);
    }
  };

  const refreshCategoriesSilent = async () => {
    try {
      const c = await api.getActiveCategories();
      if (Array.isArray(c)) setCategories(c);
      const envs = await api.getEnvelopes();
      if (Array.isArray(envs)) setEnvelopes(envs);
      const groups = await api.getEnvelopeGroups();
      if (Array.isArray(groups)) setEnvelopeGroups(groups);
    } catch (err) {
      console.warn('[Penne App] Silent categories refresh failed', err);
    }
  };

  const handleCreateTxn = async (
    amountE5: number,
    txnType: string,
    bankName: string,
    envelopeId?: string | null,
    createdAt?: string
  ) => {
    try {
      const createdTxn = await api.createTransaction(amountE5, txnType, bankName, envelopeId, createdAt);
      setTransactions((prev) => [createdTxn, ...prev]);
      refreshTransactionsSilent();
      refreshCategoriesSilent();
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Transaction Failed',
        message: err.message || 'Failed to create transaction'
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
    try {
      const updatedTxn = await api.updateTransaction(txnId, amountE5, txnType, bankName, envelopeId);
      setTransactions((prev) => prev.map((t) => (t.id === txnId ? updatedTxn : t)));
      refreshTransactionsSilent();
      refreshCategoriesSilent();
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Update Failed',
        message: err.message || 'Failed to update transaction'
      });
    }
  };

  const handleDeleteTxn = async (txnId: string) => {
    try {
      await api.deleteTransaction(txnId);
      setTransactions((prev) => prev.filter((t) => t.id !== txnId));
      refreshCategoriesSilent();
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete transaction'
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
        setEnvelopeGroups((prev) => [...prev, createdGroup]);
      }

      if (!targetGroupId) {
        addToast({
          type: 'warning',
          title: 'Missing Group',
          message: 'Please select or enter a valid Envelope Group'
        });
        return;
      }

      await api.createCategory(targetGroupId, categoryName, targetAmountE5, cadence);
      refreshCategoriesSilent();
    } catch (err: any) {
      addToast({
        type: 'error',
        statusCode: err.status || 'ERROR',
        title: 'Category Creation Failed',
        message: err.message || 'Failed to create budget category'
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
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#171513] text-[#F4F1DE] w-full max-w-full overflow-x-hidden">
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
      />

      {/* Dynamic Tab Contents: Home, Budget & Account */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeTab === 'home' && (
          <HomePage
            transactions={transactions}
            envelopes={envelopes}
            envelopeGroups={envelopeGroups}
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
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsPage
            transactions={transactions}
            envelopeGroups={envelopeGroups}
            envelopes={envelopes}
            isServerOffline={isServerOffline}
            isMockMode={isMockMode}
            onRetryConnection={loadData}
            onToggleMock={toggleMockMode}
            onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
            onSelectTxnForEdit={handleSelectTxnForEdit}
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
            isMockMode={isMockMode}
            recentSessions={recentSessions}
            onToggleMock={toggleMockMode}
            onLogout={handleLogout}
            isLoadingUser={loadingState.user}
            isLoadingTransactions={loadingState.transactions}
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

