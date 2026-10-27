import React, { useState } from 'react';
import {
  BookMarked,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  Boxes,
  Receipt,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, demoSignIn, error, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-In was cancelled or failed.');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-stone-50 font-sans lg:flex-row">
      {/* Left Branding Hero Panel */}
      <div className="flex flex-col justify-between border-b border-stone-200 bg-stone-900 p-8 text-white lg:w-1/2 lg:border-b-0 lg:border-r lg:p-14">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-700 text-white shadow-lg">
              <BookMarked className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                KitabKhana
              </h1>
              <p className="text-xs font-semibold text-amber-300">
                Book Store Management System
              </p>
            </div>
          </div>

          <div className="mt-14 max-w-md space-y-4">
            <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
              Computer Science & Engineering College Project
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
              Smart Bookstore Operations & Inventory Control
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Complete web-based management suite designed for physical bookstores and educational campus libraries. Manage book inventories, sales checkout, customer registries, tax invoices, and real-time business reports with Indian Rupees (₹) formatting.
            </p>
          </div>
        </div>

        {/* System Highlights */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-stone-800 pt-8 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-amber-400">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-stone-200">Atomic Inventory</p>
              <p className="text-stone-400 text-[11px]">Real-time stock deduction transactions</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-amber-400">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-stone-200">Printable Bills</p>
              <p className="text-stone-400 text-[11px]">Itemized invoices in INR currency</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-stone-200">Role-Based Security</p>
              <p className="text-stone-400 text-[11px]">Admin and Staff permissions</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-amber-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-stone-200">Live Analytics</p>
              <p className="text-stone-400 text-[11px]">Revenue, profits & bestsellers</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-[11px] text-stone-500">
          Engineered for 2nd Year CSE Project Examination & Live Demonstration
        </div>
      </div>

      {/* Right Sign-In Panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-black text-stone-900 tracking-tight">
              Portal Authentication
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Sign in with your authorized Google account or use the Evaluator quick access
            </p>
          </div>

          {(error || authError) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 leading-relaxed">
              {error || authError}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 text-xs font-bold text-stone-700 shadow-xs hover:border-amber-700 hover:bg-stone-50 transition-all disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <span className="relative bg-stone-50 px-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Or Fast Evaluator Demo Access
            </span>
          </div>

          {/* Academic Demo Fast Login Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => demoSignIn('admin')}
              className="group flex w-full items-center justify-between rounded-2xl border border-amber-300 bg-amber-50/60 p-3.5 text-left transition-all hover:bg-amber-100 hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-800 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 group-hover:text-amber-950">
                    Administrator Mode
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Full privileges: Manage catalog, users, valuation & reports
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-amber-900 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => demoSignIn('staff')}
              className="group flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-3.5 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 group-hover:text-emerald-950">
                    Store Staff Mode
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Operational privileges: Book lookup, stock intake, sales POS
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-emerald-900 transition-colors" />
            </button>
          </div>

          <div className="rounded-xl bg-stone-100 p-3 text-[11px] text-stone-500 text-center">
            Role privileges are validated in Firestore Security Rules. You can toggle between Administrator and Staff views inside the header bar at any time during presentation.
          </div>
        </div>
      </div>
    </div>
  );
};
