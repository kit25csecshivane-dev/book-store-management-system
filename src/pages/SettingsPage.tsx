import React, { useState } from 'react';
import {
  Settings,
  Store,
  Database,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Save,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { seedDemoData, clearDemoData } from '../services/seedService';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { userProfile, isAdmin } = useAuth();

  const [formState, setFormState] = useState({
    storeName: settings.storeName || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    defaultLowStockThreshold: settings.defaultLowStockThreshold || 5,
    receiptFooterMessage: settings.receiptFooterMessage || '',
    taxPercentage: settings.taxPercentage || 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Demo data state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await updateSettings(formState);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (!isAdmin) return;
    try {
      setIsSeeding(true);
      setSeedResult(null);
      const res = await seedDemoData({
        uid: userProfile?.uid || 'admin',
        displayName: userProfile?.displayName || 'Administrator',
      });
      setSeedResult(
        `Successfully seeded ${res.booksCount} books across 5 categories, ${res.customersCount} customers, and ${res.salesCount} historical transactions!`
      );
    } catch (err: any) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleConfirmClearDemo = async () => {
    try {
      setIsClearing(true);
      const clearedCount = await clearDemoData();
      setIsClearConfirmOpen(false);
      setSeedResult(`Safely removed ${clearedCount} demo records. Real user records were preserved.`);
    } catch (err: any) {
      alert(`Clear failed: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* College Project Academic Information Card */}
      <div className="rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50/70 via-stone-50 to-amber-50/40 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-800 text-white shadow-xs">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-stone-900">
                Book Store Management System
              </h3>
              <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                CSE 2nd Year Project
              </span>
            </div>
            <p className="text-xs font-semibold text-amber-900/80 mt-0.5">
              Smart Bookstore Operations and Inventory Control
            </p>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Engineered with full-stack technology: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, and Google Cloud Firestore. Features atomic inventory deduction transactions, audit movement logging, role-based access control, customizable receipt printing, and live business analytics.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 font-medium">
              <span>Currency: Indian Rupees (₹)</span>
              <span>•</span>
              <span>Locale: English (India)</span>
              <span>•</span>
              <span>Format: DD/MM/YYYY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Settings Form */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">Store Profile & Receipt Configurations</h4>
              <p className="text-xs text-stone-500">Configures official address and invoice receipt metadata</p>
            </div>
          </div>
          {!isAdmin && (
            <span className="text-[11px] font-bold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg">
              Read-Only for Staff
            </span>
          )}
        </div>

        <form onSubmit={handleSaveStoreConfig} className="mt-5 space-y-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Store preferences updated and persisted to Firestore successfully.</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Bookstore Name
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formState.storeName}
                onChange={e => setFormState({ ...formState, storeName: e.target.value })}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden disabled:bg-stone-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formState.phone}
                onChange={e => setFormState({ ...formState, phone: e.target.value })}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden disabled:bg-stone-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Store Physical Address (Printed on Receipts)
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formState.address}
                onChange={e => setFormState({ ...formState, address: e.target.value })}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden disabled:bg-stone-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                disabled={!isAdmin}
                value={formState.email}
                onChange={e => setFormState({ ...formState, email: e.target.value })}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden disabled:bg-stone-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Default Low-Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                disabled={!isAdmin}
                value={formState.defaultLowStockThreshold}
                onChange={e =>
                  setFormState({
                    ...formState,
                    defaultLowStockThreshold: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden disabled:bg-stone-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Applicable GST / Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                disabled={!isAdmin}
                value={formState.taxPercentage}
                onChange={e =>
                  setFormState({
                    ...formState,
                    taxPercentage: Math.max(0, Math.min(30, Number(e.target.value))),
                  })
                }
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden disabled:bg-stone-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Receipt Footer Closing Message
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formState.receiptFooterMessage}
                onChange={e =>
                  setFormState({ ...formState, receiptFooterMessage: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden disabled:bg-stone-50"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-amber-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Store Preferences'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Demo Data Management Card (Admin Only) */}
      {isAdmin && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Demo Data Management (College Project Evaluation)</h4>
                <p className="text-xs text-stone-500">
                  Explicitly populate or purge fictional demo records for evaluation and viva demo
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200/60 text-xs text-stone-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Info className="h-4 w-4 text-amber-700" />
                <span>Academic Evaluation Safety Guarantee</span>
              </div>
              <p>
                All seeded demo items are tagged with <code className="bg-stone-200 px-1 py-0.5 rounded text-[11px] font-mono">isDemo: true</code> in Firestore. Clicking <strong>Clear Demo Records</strong> safely purges only generated sample data, guaranteeing actual user data is never compromised.
              </p>
            </div>

            {seedResult && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900">
                {seedResult}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSeedDemoData}
                disabled={isSeeding}
                className="flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSeeding ? 'Seeding Firestore...' : 'Seed 14 Demo Books & Sales'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(true)}
                disabled={isClearing}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Demo Records</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Clearing Demo Data */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClearDemo}
        title="Reset Demo Records"
        message="Are you sure you want to remove all fictional demo books, customers, and transactions? Any genuine records created manually will remain untouched."
        confirmLabel="Yes, Clear Demo Data"
        variant="danger"
        isLoading={isClearing}
      />
    </div>
  );
};
