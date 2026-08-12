import React, { useEffect, useState } from 'react';
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

const AppInner: React.FC = () => {
  const { addToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!api.getToken());
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => !!api.getToken());
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
    setIsLoadingData(true);
    if (api.isUsingMock()) {
      setIsServerOffline(false);
      try {
        const u = await api.getUser();
        setUser(u);
        setTransactions(await api.getTransactions());
        setCategories(await api.getActiveCategories());
        setEnvelopeGroups(await api.getEnvelopeGroups());
        setEnvelopes(await api.getEnvelopes());
      } catch (e) {
        console.error('Error loading mock data', e);
      } finally {
        setIsLoadingData(false);
      }
      return;
    }

    try {
      const u = await api.getUser();
      setUser(u);

      const [t, c, g, envs] = await Promise.all([
        api.getTransactions().catch((err) => {
          if (api.isUnauthorizedError(err)) throw err;
          return [];
        }),
        api.getActiveCategories().catch((err) => {
          if (api.isUnauthorizedError(err)) throw err;
          return [];
        }),
        api.getEnvelopeGroups().catch((err) => {
          if (api.isUnauthorizedError(err)) throw err;
          return [];
        }),
        api.getEnvelopes().catch((err) => {
          if (api.isUnauthorizedError(err)) throw err;
          return [];
        })
      ]);

      setTransactions(Array.isArray(t) ? t : []);
      setCategories(Array.isArray(c) ? c : []);
      setEnvelopeGroups(Array.isArray(g) ? g : []);
      setEnvelopes(Array.isArray(envs) ? envs : []);
      setIsServerOffline(false);
      setIsLoadingData(false);
    } catch (err: any) {
      console.warn('[Penne App] Live server connection or auth check failed', err);
      if (api.isUnauthorizedError(err)) {
        api.logout();
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingData(false);
        setAuthView('signup');
        addToast({
          type: 'warning',
          statusCode: '401 UNAUTHORIZED',
          title: 'Session Expired',
          message: 'Your session has expired. Redirecting to Signup.'
        });
      } else {
        setIsServerOffline(true);
        setIsLoadingData(false);
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
      setIsLoadingData(false);
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
    setIsLoadingData(false);
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

  const handleCreateTxn = async (
    amountE5: number,
    txnType: string,
    bankName: string,
    envelopeId?: string | null
  ) => {
    try {
      await api.createTransaction(amountE5, txnType, bankName, envelopeId);
      await loadData();
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
      await api.updateTransaction(txnId, amountE5, txnType, bankName, envelopeId);
      await loadData();
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
      await loadData();
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
      await loadData();
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
        isLoadingData={isLoadingData}
      />

      {/* Dynamic Tab Contents: Home, Budget & Account */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeTab === 'home' && (
          <HomePage
            transactions={transactions}
            isServerOffline={isServerOffline}
            isMockMode={isMockMode}
            onRetryConnection={loadData}
            onToggleMock={toggleMockMode}
            onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
            onOpenNewCategoryModal={() => setIsCategoryModalOpen(true)}
            onSelectTxnForEdit={handleSelectTxnForEdit}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            isLoadingData={isLoadingData}
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
            isLoadingData={isLoadingData}
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
            isLoadingData={isLoadingData}
          />
        )}

        {activeTab === 'account' && (
          <AccountView
            user={user}
            authToken={api.getToken()}
            isMockMode={isMockMode}
            recentSessions={recentSessions}
            onToggleMock={toggleMockMode}
            onLogout={handleLogout}
            isLoadingData={isLoadingData}
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

