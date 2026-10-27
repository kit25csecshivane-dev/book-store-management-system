import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Shield,
  ShieldAlert,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { NavTab, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  currentTab: NavTab;
  onOpenSidebar: () => void;
  lowStockCount?: number;
  onQuickSearch?: (query: string) => void;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSidebar,
  lowStockCount = 0,
  onQuickSearch,
  onSelectTab,
}) => {
  const { userProfile, activeRole, setActiveRole, signOut } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of store inventory, sales, and analytics' },
    books: { title: 'Book Catalog', subtitle: 'Manage books, prices, ISBNs, and categories' },
    inventory: { title: 'Stock & Inventory', subtitle: 'Monitor stock levels, adjustments, and audit trail' },
    customers: { title: 'Customer Directory', subtitle: 'Registered customer profiles and purchase history' },
    sales: { title: 'Point of Sale (POS)', subtitle: 'Fast checkout, inventory deduction, and instant billing' },
    billing: { title: 'Billing & Invoices', subtitle: 'Historical receipts, reprints, and PDF export' },
    reports: { title: 'Reports & Analytics', subtitle: 'Revenue, profit margins, bestsellers, and CSV export' },
    settings: { title: 'System Settings', subtitle: 'Store configurations, demo data, and project info' },
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onQuickSearch) {
      onQuickSearch(searchValue);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenSidebar}
          className="rounded-xl p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-stone-900 sm:text-xl">
            {titles[currentTab]?.title || 'Bookstore'}
          </h2>
          <p className="hidden text-xs text-stone-500 sm:block">
            {titles[currentTab]?.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Global Search, Demo Role Switcher, Low Stock Bell, User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search books, ISBN..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="h-9.5 w-48 rounded-xl border border-stone-200 bg-stone-50/70 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-700/20 lg:w-64"
          />
        </form>

        {/* Live Presentation Role Switcher */}
        <div className="hidden sm:flex items-center gap-1 rounded-xl bg-stone-100 p-1 border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveRole('admin')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeRole === 'admin'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Switch perspective to Administrator"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('staff')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              activeRole === 'staff'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Switch perspective to Store Staff"
          >
            <User className="h-3.5 w-3.5" />
            <span>Staff</span>
          </button>
        </div>

        {/* Low Stock Alerts Notification Bell */}
        <button
          onClick={() => onSelectTab('inventory')}
          className="relative rounded-xl p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          title={`${lowStockCount} low stock alerts`}
        >
          <Bell className="h-5 w-5" />
          {lowStockCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {lowStockCount}
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50/80 p-1.5 sm:px-3 sm:py-1.5 hover:bg-stone-100 transition-all text-left"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-800 text-xs font-bold text-white">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-stone-900 line-clamp-1 max-w-[120px]">
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-[10px] text-stone-500 capitalize">
                {activeRole}
              </p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-stone-400 sm:block" />
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-stone-200 bg-white py-2 shadow-xl z-40">
                <div className="border-b border-stone-100 px-4 py-2.5">
                  <p className="text-xs font-bold text-stone-900">{userProfile?.displayName}</p>
                  <p className="text-[11px] text-stone-500 truncate">{userProfile?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-semibold text-stone-600 uppercase">
                      Role: {activeRole}
                    </span>
                  </div>
                </div>

                {/* Mobile perspective switch */}
                <div className="sm:hidden border-b border-stone-100 px-3 py-2">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Role View
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        setActiveRole('admin');
                        setUserDropdownOpen(false);
                      }}
                      className={`text-xs py-1 rounded font-semibold ${
                        activeRole === 'admin' ? 'bg-amber-800 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => {
                        setActiveRole('staff');
                        setUserDropdownOpen(false);
                      }}
                      className={`text-xs py-1 rounded font-semibold ${
                        activeRole === 'staff' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      Staff
                    </button>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSelectTab('settings');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                  >
                    <Sparkles className="h-4 w-4 text-stone-400" />
                    <span>Project & Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
