import React, { useEffect, useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  History,
  Plus,
  Minus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  IndianRupee,
  RefreshCw,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { Book, InventoryMovement, MovementType } from '../types';
import { getBooks } from '../services/bookService';
import {
  adjustStock,
  getInventoryMovements,
  StockAdjustmentInput
} from '../services/inventoryService';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import { useAuth } from '../contexts/AuthContext';

export const InventoryPage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'levels' | 'audit'>('levels');
  const [books, setBooks] = useState<Book[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [adjustType, setAdjustType] = useState<'restock' | 'adjustment'>('restock');
  const [quantityInput, setQuantityInput] = useState<number>(5);
  const [reasonInput, setReasonInput] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedBooks, fetchedMovements] = await Promise.all([
        getBooks(false),
        getInventoryMovements(undefined, 100),
      ]);
      setBooks(fetchedBooks);
      setMovements(fetchedMovements);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary Metrics
  const totalStockUnits = books.reduce((acc, b) => acc + b.stockQuantity, 0);
  const lowStockCount = books.filter(
    b => b.stockQuantity <= b.lowStockThreshold && b.stockQuantity > 0
  ).length;
  const outOfStockCount = books.filter(b => b.stockQuantity === 0).length;

  // Valuation (Admin only)
  const totalSellingValuation = books.reduce(
    (acc, b) => acc + b.stockQuantity * b.sellingPrice,
    0
  );
  const totalCostValuation = books.reduce(
    (acc, b) => acc + b.stockQuantity * (b.costPrice || b.sellingPrice * 0.7),
    0
  );

  // Filtered Stock Levels
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.isbn && book.isbn.toLowerCase().includes(q));

      let matchesLevel = true;
      if (stockLevelFilter === 'low') {
        matchesLevel = book.stockQuantity <= book.lowStockThreshold && book.stockQuantity > 0;
      } else if (stockLevelFilter === 'out') {
        matchesLevel = book.stockQuantity === 0;
      } else if (stockLevelFilter === 'normal') {
        matchesLevel = book.stockQuantity > book.lowStockThreshold;
      }

      return matchesQuery && matchesLevel;
    });
  }, [books, searchQuery, stockLevelFilter]);

  // Filtered Movement History
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.bookTitleSnapshot.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.createdByName.toLowerCase().includes(q);

      const matchesType =
        movementTypeFilter === 'all' || m.movementType === movementTypeFilter;

      return matchesQuery && matchesType;
    });
  }, [movements, searchQuery, movementTypeFilter]);

  const handleOpenAdjust = (book: Book, type: 'restock' | 'adjustment') => {
    setSelectedBook(book);
    setAdjustType(type);
    setQuantityInput(type === 'restock' ? 10 : -1);
    setReasonInput(
      type === 'restock'
        ? 'Supplier delivery stock intake'
        : 'Physical audit count discrepancy'
    );
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    if (!quantityInput || quantityInput === 0) {
      setAdjustError('Quantity change must be non-zero.');
      return;
    }
    if (!reasonInput.trim()) {
      setAdjustError('Please specify an audit reason for inventory adjustments.');
      return;
    }

    const calculatedNewStock = selectedBook.stockQuantity + quantityInput;
    if (calculatedNewStock < 0) {
      setAdjustError(
        `Invalid adjustment. Available stock is ${selectedBook.stockQuantity}. Resulting stock cannot be negative.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const userParam = {
        uid: userProfile?.uid || 'staff',
        displayName: userProfile?.displayName || 'Staff Member',
      };

      await adjustStock(
        {
          bookId: selectedBook.id,
          quantityChange: quantityInput,
          movementType: adjustType,
          reason: reasonInput,
        },
        userParam
      );

      await fetchData();
      setIsAdjustModalOpen(false);
      setSelectedBook(null);
    } catch (err: any) {
      setAdjustError(err.message || 'Stock adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Stock Units"
          value={loading ? '...' : totalStockUnits}
          subtitle="Sum of physical copies across all titles"
          icon={Boxes}
          accentColor="blue"
        />
        <StatCard
          title="Low Stock Titles"
          value={loading ? '...' : lowStockCount}
          subtitle="At or below safety threshold"
          icon={AlertTriangle}
          accentColor={lowStockCount > 0 ? 'amber' : 'stone'}
          onClick={() => {
            setActiveTab('levels');
            setStockLevelFilter('low');
          }}
        />
        <StatCard
          title="Out of Stock"
          value={loading ? '...' : outOfStockCount}
          subtitle="0 copies available"
          icon={AlertTriangle}
          accentColor={outOfStockCount > 0 ? 'rose' : 'stone'}
          onClick={() => {
            setActiveTab('levels');
            setStockLevelFilter('out');
          }}
        />
        {isAdmin ? (
          <StatCard
            title="Inventory Valuation"
            value={loading ? '...' : formatINR(totalSellingValuation, false)}
            subtitle={`Cost basis: ${formatINR(totalCostValuation, false)}`}
            icon={IndianRupee}
            accentColor="emerald"
          />
        ) : (
          <StatCard
            title="Access Level"
            value="Staff Store Access"
            subtitle="Valuation restricted to Administrator"
            icon={ShieldAlert}
            accentColor="stone"
          />
        )}
      </div>

      {/* Tabs Switcher & Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'levels'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>Stock Levels & Restock</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Audit Trail & Movements</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Filter titles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 w-44 rounded-xl border border-stone-200 bg-stone-50/60 pl-8 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-700 focus:outline-hidden sm:w-56"
            />
          </div>

          {activeTab === 'levels' ? (
            <select
              value={stockLevelFilter}
              onChange={e => setStockLevelFilter(e.target.value as any)}
              className="h-9 rounded-xl border border-stone-200 bg-stone-50/60 px-3 text-xs font-medium text-stone-700 focus:border-amber-700 focus:outline-hidden"
            >
              <option value="all">All Levels</option>
              <option value="low">Low Stock (≤ Threshold)</option>
              <option value="out">Out of Stock</option>
              <option value="normal">Normal Levels</option>
            </select>
          ) : (
            <select
              value={movementTypeFilter}
              onChange={e => setMovementTypeFilter(e.target.value)}
              className="h-9 rounded-xl border border-stone-200 bg-stone-50/60 px-3 text-xs font-medium text-stone-700 focus:border-amber-700 focus:outline-hidden"
            >
              <option value="all">All Movements</option>
              <option value="sale">Sales Deductions</option>
              <option value="restock">Deliveries & Restock</option>
              <option value="adjustment">Audits & Corrections</option>
              <option value="initial">Initial Intakes</option>
            </select>
          )}

          <button
            onClick={fetchData}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table: Tab 1 (Stock Levels) */}
      {activeTab === 'levels' && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Book Title & Author</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3 text-center">Safety Threshold</th>
                  <th className="py-3.5 px-3 text-center">Current Stock</th>
                  <th className="py-3.5 px-3 text-right">Selling Price</th>
                  {isAdmin && <th className="py-3.5 px-3 text-right">Stock Valuation</th>}
                  <th className="py-3.5 pl-3 pr-6 text-right">Stock Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBooks.map(book => {
                  const isOut = book.stockQuantity === 0;
                  const isLow = book.stockQuantity <= book.lowStockThreshold && !isOut;

                  return (
                    <tr key={book.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 pl-6 pr-3">
                        <p className="font-bold text-stone-900">{book.title}</p>
                        <p className="text-[11px] text-stone-500">{book.author}</p>
                      </td>
                      <td className="py-3.5 px-3 text-stone-600 font-medium">{book.category}</td>
                      <td className="py-3.5 px-3 text-center text-stone-500 font-mono">
                        {book.lowStockThreshold} units
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {book.stockQuantity} copies
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-stone-900">
                        {formatINR(book.sellingPrice)}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-3 text-right font-semibold text-stone-700">
                          {formatINR(book.stockQuantity * book.sellingPrice)}
                        </td>
                      )}
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(book, 'restock')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Restock</span>
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(book, 'adjustment')}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                          >
                            <span>Adjust</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Table: Tab 2 (Audit Trail & Stock Movements) */}
      {activeTab === 'audit' && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="border-b border-stone-200 bg-stone-50/70 px-6 py-3 text-xs text-stone-600 flex justify-between items-center">
            <span>
              Immutable Stock Movement Ledger ({filteredMovements.length} logged events)
            </span>
            <span className="text-[11px] font-semibold text-stone-500">
              Audit Compliance Active
            </span>
          </div>

          <div className="overflow-x-auto">
            {filteredMovements.length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-400">
                <History className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                No stock movement logs recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50/40 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 pl-6 pr-3">Timestamp</th>
                    <th className="py-3.5 px-3">Book Title</th>
                    <th className="py-3.5 px-3">Movement Type</th>
                    <th className="py-3.5 px-3 text-center">Change</th>
                    <th className="py-3.5 px-3 text-center">Before &rarr; After</th>
                    <th className="py-3.5 px-3">Reason / Reference</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredMovements.map(m => {
                    const isPositive = m.quantityChange > 0;

                    return (
                      <tr key={m.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 pl-6 pr-3 text-stone-500 whitespace-nowrap">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-stone-900 max-w-xs truncate">
                          {m.bookTitleSnapshot}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              m.movementType === 'sale'
                                ? 'bg-sky-100 text-sky-800'
                                : m.movementType === 'restock'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.movementType === 'adjustment'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {m.movementType}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold font-mono">
                          <span
                            className={`inline-flex items-center ${
                              isPositive ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-stone-600 font-mono">
                          {m.previousQuantity} &rarr;{' '}
                          <span className="font-bold text-stone-900">{m.newQuantity}</span>
                        </td>
                        <td className="py-3.5 px-3 text-stone-600 max-w-sm truncate">
                          {m.reason}
                        </td>
                        <td className="py-3.5 pl-3 pr-6 text-right text-stone-600 font-medium">
                          {m.createdByName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedBook && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setSelectedBook(null);
          }}
          title={
            adjustType === 'restock'
              ? `Restock: ${selectedBook.title}`
              : `Stock Adjustment: ${selectedBook.title}`
          }
          subtitle={`Current stock on shelf: ${selectedBook.stockQuantity} units`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteAdjustment} className="space-y-4">
            {adjustError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {adjustError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Operation Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('restock');
                    setQuantityInput(Math.abs(quantityInput) || 10);
                  }}
                  className={`rounded-xl py-2 text-xs font-bold border transition-all ${
                    adjustType === 'restock'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  + Restock Delivery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('adjustment');
                  }}
                  className={`rounded-xl py-2 text-xs font-bold border transition-all ${
                    adjustType === 'adjustment'
                      ? 'border-amber-300 bg-amber-50 text-amber-900 shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  +/- Inventory Correction
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Quantity Change (Units) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="1"
                value={quantityInput}
                onChange={e => setQuantityInput(Number(e.target.value))}
                placeholder={adjustType === 'restock' ? 'e.g. 10' : 'e.g. -2 or 5'}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs font-bold text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                New resulting stock:{' '}
                <span className="font-bold text-stone-900">
                  {selectedBook.stockQuantity + Number(quantityInput || 0)}
                </span>{' '}
                units
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Audit Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reasonInput}
                onChange={e => setReasonInput(e.target.value)}
                placeholder="e.g. Supplier batch intake, Damaged cover replacement, Physical audit..."
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsAdjustModalOpen(false);
                  setSelectedBook(null);
                }}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-amber-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-900 disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : 'Commit Stock Change'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
