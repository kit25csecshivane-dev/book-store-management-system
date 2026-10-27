import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Receipt
} from 'lucide-react';
import { Book, Customer, Sale, PaymentMethod } from '../types';
import { getBooks } from '../services/bookService';
import { getCustomers } from '../services/customerService';
import { processSale } from '../services/salesService';
import { formatINR } from '../utils/formatters';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface CartItem {
  book: Book;
  quantity: number;
}

export const SalesPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { settings } = useSettings();

  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Search & Catalog Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Checkout submission & completed receipt state
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [fetchedBooks, fetchedCustomers] = await Promise.all([
        getBooks(false), // only active
        getCustomers(),
      ]);
      setBooks(fetchedBooks);
      setCustomers(fetchedCustomers);
    } catch (err: any) {
      console.error('Failed to load books or customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set).sort();
  }, [books]);

  // Filtered available books for POS selection
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || b.category === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  // Cart Calculations
  const subtotal = cart.reduce(
    (acc, item) => acc + item.book.sellingPrice * item.quantity,
    0
  );
  const discountAmount = (subtotal * Math.max(0, Math.min(100, discountPercent))) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxPercent = settings.taxPercentage || 0;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  // Cart Handlers
  const handleAddToCart = (book: Book) => {
    setCheckoutError(null);
    if (book.stockQuantity <= 0) {
      setCheckoutError(`"${book.title}" is out of stock.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.book.id === book.id);
      if (existing) {
        if (existing.quantity >= book.stockQuantity) {
          setCheckoutError(
            `Cannot add more. Available stock for "${book.title}" is ${book.stockQuantity}.`
          );
          return prev;
        }
        return prev.map(item =>
          item.book.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { book, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (bookId: string, newQty: number) => {
    setCheckoutError(null);
    const item = cart.find(i => i.book.id === bookId);
    if (!item) return;

    if (newQty <= 0) {
      handleRemoveItem(bookId);
      return;
    }

    if (newQty > item.book.stockQuantity) {
      setCheckoutError(
        `Cannot set quantity to ${newQty}. Available stock is ${item.book.stockQuantity}.`
      );
      return;
    }

    setCart(prev =>
      prev.map(i => (i.book.id === bookId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleRemoveItem = (bookId: string) => {
    setCart(prev => prev.filter(i => i.book.id !== bookId));
  };

  const handleClearCart = () => {
    setCart([]);
    setCheckoutError(null);
  };

  // Process Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutError(null);

    try {
      setIsProcessing(true);
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

      const sale = await processSale(
        {
          items: cart.map(i => ({
            bookId: i.book.id,
            quantity: i.quantity,
          })),
          customerId: selectedCustomerId || null,
          customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
          discountPercentage: discountPercent,
          taxPercentage: taxPercent,
          paymentMethod,
        },
        {
          uid: userProfile?.uid || 'staff',
          displayName: userProfile?.displayName || 'Cashier',
        }
      );

      // Successfully processed: reset cart, refresh catalog stock, show receipt
      setCompletedSale(sale);
      setIsReceiptModalOpen(true);
      setCart([]);
      setDiscountPercent(0);
      setSelectedCustomerId('');
      await fetchCatalog();
    } catch (err: any) {
      setCheckoutError(err.message || 'Transaction could not be completed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Checkout Screen Layout (Split into Catalog Browser + Live Cart/Checkout) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Book Catalog Picker (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search books by title, author, or scan ISBN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-700 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Titles
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Book Catalog Grid */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Select titles to add to cart ({filteredBooks.length} available)</span>
              <span>Prices in INR (₹)</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-stone-500">
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
                Loading inventory...
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-400">
                <BookOpen className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                No matching books found in inventory.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredBooks.map(book => {
                  const inCartItem = cart.find(i => i.book.id === book.id);
                  const isOutOfStock = book.stockQuantity === 0;
                  const isLow = book.stockQuantity <= book.lowStockThreshold;

                  return (
                    <div
                      key={book.id}
                      className={`flex flex-col justify-between rounded-xl border p-3 transition-all ${
                        isOutOfStock
                          ? 'border-stone-200 bg-stone-50/50 opacity-60'
                          : inCartItem
                          ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/70'
                      }`}
                    >
                      <div className="flex gap-2.5">
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded border border-stone-200 bg-stone-100">
                          {book.coverImageUrl ? (
                            <img
                              src={book.coverImageUrl}
                              alt={book.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-300">
                              <BookOpen className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-stone-900 line-clamp-1">{book.title}</p>
                          <p className="text-[10px] text-stone-500 line-clamp-1">{book.author}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOutOfStock ? '0 in stock' : `${book.stockQuantity} in stock`}
                            </span>
                            {book.isbn && (
                              <span className="text-[9px] font-mono text-stone-400">
                                {book.isbn.slice(-6)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-xs">
                        <span className="font-black text-stone-900 text-sm">
                          {formatINR(book.sellingPrice)}
                        </span>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(book)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            isOutOfStock
                              ? 'cursor-not-allowed bg-stone-200 text-stone-400'
                              : inCartItem
                              ? 'bg-amber-800 text-white shadow-xs'
                              : 'bg-stone-900 text-white hover:bg-stone-800'
                          }`}
                        >
                          <Plus className="h-3 w-3" />
                          <span>{inCartItem ? `Added (${inCartItem.quantity})` : 'Add to Cart'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Cart & Checkout (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-800 text-white">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Current Sale Cart</h3>
                  <p className="text-[10px] text-stone-500">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)} items selected
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {checkoutError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{checkoutError}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                  <ShoppingCart className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                  Your cart is empty. Add titles from the catalog.
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.book.id}
                    className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/50 p-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-stone-900 truncate">{item.book.title}</p>
                      <p className="text-[10px] text-stone-500">
                        {formatINR(item.book.sellingPrice)} each • Stock: {item.book.stockQuantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center rounded-lg border border-stone-200 bg-white">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.book.id, item.quantity - 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 font-bold text-stone-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.book.id, item.quantity + 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-black text-stone-900 w-16 text-right">
                        {formatINR(item.book.sellingPrice * item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.book.id)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Association */}
            <div className="mt-4 border-t border-stone-100 pt-3">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Associate Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              >
                <option value="">Walk-in Customer (Unregistered)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Discount & Tax Options */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="h-9 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  GST / Tax (%)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${taxPercent}%`}
                  className="h-9 w-full rounded-xl border border-stone-200 bg-stone-100 px-3 text-xs text-stone-600 font-mono"
                  title="Configurable in Settings"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-3 border-t border-stone-100 pt-3">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold border transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-amber-300 bg-amber-50 text-amber-900 shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  <IndianRupee className="h-3.5 w-3.5" />
                  <span>Cash Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold border transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>UPI Payment (INR)</span>
                </button>
              </div>
            </div>

            {/* Bill Summary Breakdown */}
            <div className="mt-4 space-y-1.5 border-t border-dashed border-stone-200 pt-3 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Tax ({taxPercent}%)</span>
                  <span>+{formatINR(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm font-black text-stone-900 border-t border-stone-200">
                <span>Total Amount</span>
                <span className="text-lg text-amber-900">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-800 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing Transaction & Updating Stock...</span>
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  <span>Complete Sale & Generate Bill</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={completedSale}
        onNewSale={() => {
          setIsReceiptModalOpen(false);
          setCompletedSale(null);
        }}
      />
    </div>
  );
};
