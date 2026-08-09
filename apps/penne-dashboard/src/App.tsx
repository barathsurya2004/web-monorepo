import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import { User, Transaction, AuthSession } from '@packages/types';

import { Header } from './components/Header';
import { SignupPage } from './components/SignupPage';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { AccountView } from './components/AccountView';
import { BottomTabBar, NavTab } from './components/BottomTabBar';
import { NewTxnModal } from './components/Modals';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [recentSessions, setRecentSessions] = useState<AuthSession[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [isServerOffline, setIsServerOffline] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    if (api.isUsingMock()) {
      setIsServerOffline(false);
      try {
        const u = await api.getUser();
        setUser(u);
        setTransactions(await api.getTransactions());
      } catch (e) {
        console.error('Error loading mock data', e);
      }
      return;
    }

    try {
      const u = await api.getUser();
      setUser(u);

      const t = await api.getTransactions();
      setTransactions(Array.isArray(t) ? t : []);

      setIsServerOffline(false);
    } catch (err) {
      console.warn('[Penne App] Live server connection failed', err);
      setIsServerOffline(true);
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
        .catch((err) => {
          console.warn('Initial session user check failed', err);
          if (!api.isUsingMock()) {
            setIsServerOffline(true);
          }
          setIsAuthenticated(true);
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
    bankName: string
  ) => {
    await api.createTransaction(amountE5, txnType, bankName);
    showToast('Transaction recorded successfully!');
    await loadData();
  };

  // Unauthenticated Views (Login / Signup)
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

  // Authenticated Views (Strictly Home & Account Views)
  return (
    <div className="min-h-screen flex flex-col bg-[#171513] text-[#F4F1DE] w-full max-w-full overflow-x-hidden">
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
      />

      {/* Dynamic Tab Contents: Only Home & Account */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeTab === 'home' && (
          <HomePage
            transactions={transactions}
            isServerOffline={isServerOffline}
            isMockMode={isMockMode}
            onRetryConnection={loadData}
            onToggleMock={toggleMockMode}
            onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
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
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Home & Account) */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenNewTxnModal={() => setIsTxnModalOpen(true)}
      />

      {/* New Transaction Modal */}
      <NewTxnModal
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        envelopes={[]}
        onSubmit={handleCreateTxn}
      />
    </div>
  );
};

export default App;
