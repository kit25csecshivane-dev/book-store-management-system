import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Boxes,
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  Users,
  PlusCircle,
  ShoppingCart,
  UserPlus,
  BarChart2,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Book, Customer, Sale, NavTab } from '../types';
import { getBooks } from '../services/bookService';
import { getCustomers } from '../services/customerService';
import { getSales } from '../services/salesService';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { useAuth } from '../contexts/AuthContext';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAddBook: () => void;
  onOpenAddCustomer: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddBook,
  onOpenAddCustomer,
}) => {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedBooks, fetchedCustomers, fetchedSales] = await Promise.all([
        getBooks(true),
        getCustomers(),
        getSales(),
      ]);
      setBooks(fetchedBooks);
      setCustomers(fetchedCustomers);
      setSales(fetchedSales);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute metrics from saved records
  const activeBooks = books.filter(b => b.active);
  const totalStockUnits = activeBooks.reduce((acc, b) => acc + (b.stockQuantity || 0), 0);
  const lowStockBooks = activeBooks.filter(
    b => b.stockQuantity <= (b.lowStockThreshold || 5) && b.stockQuantity > 0
  );
  const outOfStockBooks = activeBooks.filter(b => b.stockQuantity === 0);

  // Today's date boundary
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysSales = sales.filter(s => {
    const saleDate = new Date(s.createdAt);
    return saleDate >= today && s.status === 'completed';
  });

  const todaysSalesAmount = todaysSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const todaysSalesCount = todaysSales.length;

  // 7-day Sales Chart Data
  const chartData: Array<{ date: string; displayDate: string; revenue: number; salesCount: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const daySales = sales.filter(s => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= d && saleDate < nextD && s.status === 'completed';
    });

    const dayRevenue = daySales.reduce((acc, s) => acc + s.totalAmount, 0);

    chartData.push({
      date: d.toISOString(),
      displayDate: formatDate(d).slice(0, 5), // DD/MM
      revenue: Math.round(dayRevenue),
      salesCount: daySales.length,
    });
  }

  // Best selling books leaderboard
  const bookSalesMap: Record<string, { title: string; author: string; qty: number; revenue: number }> = {};
  sales.forEach(sale => {
    if (sale.status === 'completed') {
      sale.items.forEach(item => {
        if (!bookSalesMap[item.bookId]) {
          bookSalesMap[item.bookId] = {
            title: item.title,
            author: item.author,
            qty: 0,
            revenue: 0,
          };
        }
        bookSalesMap[item.bookId].qty += item.quantity;
        bookSalesMap[item.bookId].revenue += item.lineTotal;
      });
    }
  });

  const bestSellingBooks = Object.values(bookSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Action Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-stone-900">
            Welcome to Bookstore Operations
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time catalog, stock levels, and POS billing console
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>New Sale (POS)</span>
          </button>
          <button
            onClick={onOpenAddBook}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <PlusCircle className="h-4 w-4 text-amber-700" />
            <span>Add Book</span>
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <UserPlus className="h-4 w-4 text-stone-600" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={loadDashboardData}
            className="rounded-xl border border-stone-200 p-2.5 text-stone-500 hover:bg-stone-50 transition-colors"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Active Books"
          value={loading ? '...' : activeBooks.length}
          subtitle={`${books.length - activeBooks.length} inactive`}
          icon={BookOpen}
          accentColor="amber"
          onClick={() => onNavigate('books')}
        />
        <StatCard
          title="Total Stock"
          value={loading ? '...' : totalStockUnits}
          subtitle="Physical units in store"
          icon={Boxes}
          accentColor="blue"
          onClick={() => onNavigate('inventory')}
        />
        <StatCard
          title="Low Stock Alerts"
          value={loading ? '...' : lowStockBooks.length + outOfStockBooks.length}
          subtitle={`${outOfStockBooks.length} out of stock`}
          icon={AlertTriangle}
          accentColor={lowStockBooks.length + outOfStockBooks.length > 0 ? 'rose' : 'stone'}
          onClick={() => onNavigate('inventory')}
        />
        <StatCard
          title="Today's Sales"
          value={loading ? '...' : formatINR(todaysSalesAmount, false)}
          subtitle={`${todaysSalesCount} orders completed`}
          icon={IndianRupee}
          accentColor="emerald"
          onClick={() => onNavigate('billing')}
        />
        <StatCard
          title="Today's Orders"
          value={loading ? '...' : todaysSalesCount}
          subtitle="Processed at checkout"
          icon={ShoppingBag}
          accentColor="purple"
          onClick={() => onNavigate('billing')}
        />
        <StatCard
          title="Customers"
          value={loading ? '...' : customers.length}
          subtitle="Registered members"
          icon={Users}
          accentColor="stone"
          onClick={() => onNavigate('customers')}
        />
      </div>

      {/* Main Grid: Chart + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Chart (2 cols) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Weekly Revenue Trend (INR)</h3>
              <p className="text-xs text-stone-500">Sales volume across the last 7 calendar days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Live Firestore Feed</span>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#92400e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#92400e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#78716c" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#78716c"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => `₹${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [formatINR(Number(value)), 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    borderColor: '#e7e5e4',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#92400e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alert Panel (1 col) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Inventory Alerts</h3>
                <p className="text-[11px] text-stone-500">Critical restock recommendations</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {lowStockBooks.length === 0 && outOfStockBooks.length === 0 ? (
              <div className="py-10 text-center text-xs text-stone-400">
                <Boxes className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                All active titles maintain adequate inventory levels.
              </div>
            ) : (
              [...outOfStockBooks, ...lowStockBooks].slice(0, 5).map(b => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/60 p-3 hover:bg-stone-50 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-stone-900 truncate">{b.title}</p>
                    <p className="text-[11px] text-stone-500 truncate">{b.author}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        b.stockQuantity === 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {b.stockQuantity === 0 ? 'Out of stock' : `${b.stockQuantity} left`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secondary Grid: Recent Sales + Best-Sellers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Sales Table (2 cols) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Recent Completed Invoices</h3>
              <p className="text-xs text-stone-500">Live transactions recorded in Firestore</p>
            </div>
            <button
              onClick={() => onNavigate('billing')}
              className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
            >
              <span>All Invoices</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {recentSales.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No transactions recorded yet. Use Point of Sale to complete your first checkout!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-2.5">Invoice #</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5 text-center">Items</th>
                    <th className="pb-2.5">Method</th>
                    <th className="pb-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 font-bold text-stone-900">{sale.invoiceNumber}</td>
                      <td className="py-3 text-stone-500">{formatDate(sale.createdAt)}</td>
                      <td className="py-3 text-stone-700">
                        {sale.customerNameSnapshot || 'Walk-in'}
                      </td>
                      <td className="py-3 text-center text-stone-600 font-medium">
                        {sale.items.reduce((acc, it) => acc + it.quantity, 0)}
                      </td>
                      <td className="py-3">
                        <span className="inline-block uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-stone-900">
                        {formatINR(sale.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Best Selling Books (1 col) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Bestselling Titles</h3>
              <p className="text-[11px] text-stone-500">Highest volume sold to date</p>
            </div>
            <BarChart2 className="h-4 w-4 text-stone-400" />
          </div>

          <div className="mt-4 space-y-3">
            {bestSellingBooks.length === 0 ? (
              <div className="py-10 text-center text-xs text-stone-400">
                Sales rankings will automatically populate as books are checked out.
              </div>
            ) : (
              bestSellingBooks.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/50 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{item.title}</p>
                      <p className="text-[10px] text-stone-500 truncate">{item.author}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-stone-900">{item.qty} sold</p>
                    <p className="text-[10px] text-stone-500">{formatINR(item.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
