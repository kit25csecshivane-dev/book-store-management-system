import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Boxes,
  Users,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  BookMarked,
  X,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { NavTab, UserRole } from '../../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  storeName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  userRole,
  storeName,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'sales', label: 'Sales (POS)', icon: ShoppingCart },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-stone-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between border-b border-stone-200 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-800 text-white shadow-sm">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-900 tracking-tight leading-tight line-clamp-1">
                {storeName || 'KitabKhana'}
              </h1>
              <p className="text-xs text-stone-500 font-medium">Operations & Inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Pill */}
        <div className="px-6 py-3 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {userRole === 'admin' ? (
              <ShieldCheck className="h-4 w-4 text-amber-700" />
            ) : (
              <UserCheck className="h-4 w-4 text-emerald-700" />
            )}
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              {userRole === 'admin' ? 'Administrator' : 'Store Staff'}
            </span>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              userRole === 'admin'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {userRole === 'admin' ? 'Full Access' : 'POS & Stock'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
            Menu
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isRestricted = item.adminOnly && userRole !== 'admin';

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isRestricted) {
                    onSelectTab(item.id);
                    onClose();
                  }
                }}
                disabled={isRestricted}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-800 text-white shadow-xs font-semibold'
                    : isRestricted
                    ? 'cursor-not-allowed text-stone-300'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive
                        ? 'text-white'
                        : isRestricted
                        ? 'text-stone-300'
                        : 'text-stone-500 group-hover:text-stone-800'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.adminOnly && (
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-amber-900/50 text-amber-100'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Project Tag */}
        <div className="border-t border-stone-200 p-4">
          <div className="rounded-xl bg-amber-50/60 p-3 border border-amber-200/60">
            <p className="text-xs font-semibold text-amber-900">CSE College Project</p>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              Indian Rupees (₹) • DD/MM/YYYY
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>Firestore Connected</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
