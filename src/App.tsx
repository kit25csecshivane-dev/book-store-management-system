import React, { useState, useEffect } from 'react';
import { NavTab } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { BillingPage } from './pages/BillingPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { testFirestoreConnection } from './firebase/config';
import { ShieldAlert, BookOpen } from 'lucide-react';
import { getBooks } from './services/bookService';

const MainLayout: React.FC = () => {
  const { userProfile, activeRole, isAdmin, loading } = useAuth();
  const { settings } = useSettings();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lowStockAlertCount, setLowStockAlertCount] = useState(0);

  // Cross-page quick action triggers
  const [openAddBookTrigger, setOpenAddBookTrigger] = useState(false);
  const [openAddCustomerTrigger, setOpenAddCustomerTrigger] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Initial Firestore connection check
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Poll or calculate low-stock alerts count for the notification bell
  useEffect(() => {
    if (!userProfile) return;
    const checkAlerts = async () => {
      try {
        const books = await getBooks(false);
        const low = books.filter(
          b => b.stockQuantity <= (b.lowStockThreshold || 5)
        ).length;
        setLowStockAlertCount(low);
      } catch (e) {
        // silent catch
      }
    };
    checkAlerts();
  }, [userProfile, currentTab]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-amber-800 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold text-stone-600">
            Initializing Book Store Management System...
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <LoginPage />;
  }

  const handleGlobalSearch = (query: string) => {
    setGlobalSearchQuery(query);
    setCurrentTab('books');
  };

  const handleOpenAddBook = () => {
    setOpenAddBookTrigger(true);
    setCurrentTab('books');
  };

  const handleOpenAddCustomer = () => {
    setOpenAddCustomerTrigger(true);
    setCurrentTab('customers');
  };

  // Render current active tab
  const renderTabContent = () => {
    // Role protection for Admin-only pages
    if ((currentTab === 'reports' || currentTab === 'settings') && !isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Access Restricted</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm">
            This module requires Administrator privileges. Toggle your role view in the top header to Administrator to access this view.
          </p>
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={tab => setCurrentTab(tab)}
            onOpenAddBook={handleOpenAddBook}
            onOpenAddCustomer={handleOpenAddCustomer}
          />
        );
      case 'books':
        return (
          <BooksPage
            initialOpenAdd={openAddBookTrigger}
            onResetInitialOpenAdd={() => setOpenAddBookTrigger(false)}
            initialSearchQuery={globalSearchQuery}
          />
        );
      case 'inventory':
        return <InventoryPage />;
      case 'customers':
        return (
          <CustomersPage
            initialOpenAdd={openAddCustomerTrigger}
            onResetInitialOpenAdd={() => setOpenAddCustomerTrigger(false)}
          />
        );
      case 'sales':
        return <SalesPage />;
      case 'billing':
        return <BillingPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={tab => setCurrentTab(tab)} onOpenAddBook={handleOpenAddBook} onOpenAddCustomer={handleOpenAddCustomer} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50/50 text-stone-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          setGlobalSearchQuery('');
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole={activeRole}
        storeName={settings.storeName}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky Top Header */}
        <Header
          currentTab={currentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          lowStockCount={lowStockAlertCount}
          onQuickSearch={handleGlobalSearch}
          onSelectTab={tab => setCurrentTab(tab)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MainLayout />
      </SettingsProvider>
    </AuthProvider>
  );
}
