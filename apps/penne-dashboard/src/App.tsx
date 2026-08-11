import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import { User, Transaction, AuthSession, ActiveCategory, EnvelopeGroup, Envelope } from '@packages/types';

import { Header } from './components/Header';
import { SignupPage } from './components/SignupPage';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { BudgetPage } from './components/BudgetPage';
import { AccountView } from './components/AccountView';
import { BottomTabBar, NavTab } from './components/BottomTabBar';
import { NewTxnModal, NewCategoryModal, EditTxnModal } from './components/Modals';

export const App: React.FC = () => {
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedTxnForEdit, setSelectedTxnForEdit] = useState<Transaction | null>(null);
  const [isEditTxnModalOpen, setIsEditTxnModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
        // Backend unauthorized/unauthenticated failure -> clear token & redirect to Signup page
        api.logout();
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingData(false);
        setAuthView('signup');
        showToast('Unauthorized session. Redirected to Signup.');
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
    showToast(`Welcome back, ${authUser.name}!`);
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
    showToast('Signed out of Penne Budget');
  };

  const toggleMockMode = async () => {
    const nextMock = !isMockMode;
    api.setUseMock(nextMock);
    setIsMockMode(nextMock);
    setIsServerOffline(false);
    showToast(`Switched to ${nextMock ? 'Demo Mode' : 'Live Backend Server'}`);
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
    await api.createTransaction(amountE5, txnType, bankName, envelopeId);
    showToast('Transaction recorded successfully!');
    await loadData();
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
    await api.updateTransaction(txnId, amountE5, txnType, bankName, envelopeId);
    showToast('Transaction details updated!');
    await loadData();
  };

  const handleCreateCategory = async (
    groupId: string | null,
    newGroupName: string | null,
    categoryName: string,
    targetAmountE5: number,
    cadence: string
  ) => {
    let targetGroupId = groupId;
    if (!targetGroupId && newGroupName) {
      const createdGroup = await api.createEnvelopeGroup(newGroupName);
      targetGroupId = createdGroup.id;
    }

    if (!targetGroupId) {
      showToast('Please select or enter a valid Envelope Group');
      return;
    }

    await api.createCategory(targetGroupId, categoryName, targetAmountE5, cadence);
    showToast(`Category '${categoryName}' created successfully!`);
    await loadData();
  };

  // Unauthenticated Views (Only Signup / Login pages shown when user does not have a token)
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

  // Authenticated Views (Instant entry when token present with Skeleton Loaders during Lazy Load)
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#171513] text-[#F4F1DE] w-full max-w-full overflow-x-hidden">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 bg-[#E07A5F] text-[#F4F1DE] px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl shadow-[#E07A5F]/30 animate-fadeIn flex items-center gap-2 border border-[#E07A5F]/40 max-w-xs truncate">
          <span>✨</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Non-sticky Top Header */}
      <Header
        user={user}
        authToken={api.getToken()}
        isMockMode={isMockMode}
        onToggleMock={toggleMockMode}
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

      {/* Mobile Fixed Bottom Navigation Bar (Home, Budget & Account) */}
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


export default App;
