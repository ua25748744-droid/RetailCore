import React, { Suspense, useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { LedgerProvider } from './contexts/LedgerContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Navigation } from './components/Navigation';
import { InventoryAlerts } from './components/InventoryAlerts';
import { InventoryPage, POSPage, LedgerPage, ReportsPage, DashboardPage, SettingsPage, LoginPage } from './pages';
import { LogOut } from 'lucide-react';
import './i18n/index';
import './index.css';

type Page = 'dashboard' | 'inventory' | 'pos' | 'ledger' | 'reports' | 'settings';

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-primary-400">Loading...</div>
  </div>
);

// Header component with sign out
const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header
      className="sticky top-0 z-50 border-b shadow-sm"
      style={{ backgroundColor: 'rgb(var(--color-header-bg))', borderColor: 'rgb(var(--color-border))' }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="relative h-10 w-10 overflow-hidden rounded-xl p-0.5"
            style={{ backgroundColor: 'rgb(var(--color-brand-primary))' }}
          >
            <div
              className="flex h-full w-full items-center justify-center rounded-[10px] text-lg font-bold"
              style={{ backgroundColor: 'rgb(var(--color-bg-card))', color: 'rgb(var(--color-text-primary))' }}
            >
              RC
            </div>
          </div>
          <span className="text-xl font-bold" style={{ color: 'rgb(var(--color-brand-primary))' }}>RetailCore</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex items-center gap-2 mr-2">
              <span
                className="text-sm truncate max-w-32"
                style={{ color: 'rgb(var(--color-text-secondary))' }}
              >
                {user.displayName || user.email}
              </span>
            </div>
          )}
          <ThemeSwitcher />
          <LanguageSwitcher />
          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: 'rgb(var(--color-text-secondary))' }}
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// Main App Content (authenticated view)
const AuthenticatedContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showAlerts, setShowAlerts] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'pos':
        return <POSPage />;
      case 'ledger':
        return <LedgerPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen text-foreground transition-colors duration-500 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onAlertsClick={() => setShowAlerts(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 pb-20 md:pb-0 scroll-smooth">
          {renderPage()}
        </main>
      </div>

      {/* Inventory Alerts Modal */}
      <InventoryAlerts isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
    </div>
  );
};

// App Content - shows login or main app based on auth state
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedContent />;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <DatabaseProvider>
              <InventoryProvider>
                <LedgerProvider>
                  <ReportsProvider>
                    <AppContent />
                  </ReportsProvider>
                </LedgerProvider>
              </InventoryProvider>
            </DatabaseProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </Suspense>
  );
};

export default App;
