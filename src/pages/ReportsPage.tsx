import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  FileSpreadsheet,
  Boxes,
  PieChart as PieChartIcon,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Book, Sale } from '../types';
import { getBooks } from '../services/bookService';
import { getSales } from '../services/salesService';
import { formatINR, formatDate, exportToCSV } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { useAuth } from '../contexts/AuthContext';

type DateFilterRange = 'today' | '7days' | 'month' | 'year' | 'all';

export const ReportsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateFilterRange>('month');

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const [fetchedSales, fetchedBooks] = await Promise.all([
          getSales(),
          getBooks(true),
        ]);
        setSales(fetchedSales);
        setBooks(fetchedBooks);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  // Filter sales by selected date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const start = new Date();

    if (dateRange === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === '7days') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    } else {
      // all time
      return sales.filter(s => s.status === 'completed');
    }

    return sales.filter(s => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= start && saleDate <= now && s.status === 'completed';
    });
  }, [sales, dateRange]);

  // Aggregate metrics
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalOrders = filteredSales.length;
  const totalBooksSold = filteredSales.reduce(
    (acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.quantity, 0),
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Profit calculation (only for authorized admin based on recorded costPrice)
  const totalCostOfGoods = filteredSales.reduce((acc, s) => {
    return (
      acc +
      s.items.reduce((iAcc, item) => {
        const itemCost = item.costPrice !== undefined ? item.costPrice : item.unitPrice * 0.7;
        return iAcc + itemCost * item.quantity;
      }, 0)
    );
  }, 0);
  const grossProfit = totalRevenue - totalCostOfGoods;
  const profitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Bestsellers Map
  const bestsellers = useMemo(() => {
    const map: Record<string, { title: string; author: string; qty: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(i => {
        if (!map[i.bookId]) {
          map[i.bookId] = { title: i.title, author: i.author, qty: 0, revenue: 0 };
        }
        map[i.bookId].qty += i.quantity;
        map[i.bookId].revenue += i.lineTotal;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [filteredSales]);

  // Category Revenue Breakdown for Donut Chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        const bookObj = books.find(b => b.id === item.bookId);
        const cat = bookObj?.category || 'General';
        map[cat] = (map[cat] || 0) + item.lineTotal;
      });
    });

    const colors = ['#92400e', '#d97706', '#0284c7', '#059669', '#7c3aed', '#db2777', '#ca8a04'];
    return Object.keys(map).map((category, idx) => ({
      name: category,
      value: Math.round(map[category]),
      color: colors[idx % colors.length],
    }));
  }, [filteredSales, books]);

  // Inventory Valuation (Admin)
  const activeBooks = books.filter(b => b.active);
  const inventoryTotalValuation = activeBooks.reduce(
    (acc, b) => acc + b.stockQuantity * b.sellingPrice,
    0
  );
  const inventoryCostValuation = activeBooks.reduce(
    (acc, b) => acc + b.stockQuantity * (b.costPrice || b.sellingPrice * 0.7),
    0
  );

  const handleExportSalesCSV = () => {
    const rows = filteredSales.map(s => ({
      'Invoice': s.invoiceNumber,
      'Date': s.createdAt,
      'Customer': s.customerNameSnapshot || 'Walk-in',
      'Items': s.items.length,
      'Total (INR)': s.totalAmount,
      'Payment': s.paymentMethod,
    }));
    exportToCSV(`sales_report_${dateRange}`, rows);
  };

  const handleExportInventoryCSV = () => {
    const rows = books.map(b => ({
      'Title': b.title,
      'Author': b.author,
      'Category': b.category,
      'ISBN': b.isbn || '',
      'Selling Price': b.sellingPrice,
      'Cost Price': b.costPrice || '',
      'Stock Quantity': b.stockQuantity,
      'Low Stock Threshold': b.lowStockThreshold,
      'Status': b.active ? 'Active' : 'Archived',
    }));
    exportToCSV(`inventory_valuation_report`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900">Bookstore Business Analytics</h3>
          <p className="text-xs text-stone-500">
            Performance metrics derived exclusively from live Firestore records
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setDateRange('today')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                dateRange === 'today' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('7days')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                dateRange === '7days' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                dateRange === 'month' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                dateRange === 'year' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                dateRange === 'all' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Time
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportSalesCSV}
              disabled={filteredSales.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
              title="Download filtered sales"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              <span>Export Sales CSV</span>
            </button>

            <button
              onClick={handleExportInventoryCSV}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              title="Download catalog inventory"
            >
              <Boxes className="h-4 w-4 text-sky-700" />
              <span>Export Inventory CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Period Sales Revenue"
          value={loading ? '...' : formatINR(totalRevenue, false)}
          subtitle={`${totalOrders} transactions`}
          icon={IndianRupee}
          accentColor="emerald"
        />
        <StatCard
          title="Books Sold"
          value={loading ? '...' : totalBooksSold}
          subtitle="Physical units checked out"
          icon={ShoppingBag}
          accentColor="blue"
        />
        <StatCard
          title="Average Order Value"
          value={loading ? '...' : formatINR(averageOrderValue)}
          subtitle="Revenue per transaction"
          icon={TrendingUp}
          accentColor="amber"
        />
        {isAdmin ? (
          <StatCard
            title="Gross Profit"
            value={loading ? '...' : formatINR(grossProfit, false)}
            subtitle={`${profitMarginPercent.toFixed(1)}% margin over cost`}
            icon={BarChart3}
            accentColor="purple"
          />
        ) : (
          <StatCard
            title="Profit Analysis"
            value="Confidential"
            subtitle="Requires Administrator role"
            icon={ShieldAlert}
            accentColor="stone"
          />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bestseller Leaderboard (2 cols) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Bestselling Titles in Period</h3>
              <p className="text-xs text-stone-500">Sorted by units sold and cumulative revenue</p>
            </div>
            <span className="text-xs font-semibold text-stone-400">Top Performers</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            {bestsellers.length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-400">
                No book sales recorded in selected time period.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-2.5 w-12 text-center">Rank</th>
                    <th className="pb-2.5">Title & Author</th>
                    <th className="pb-2.5 text-center">Units Sold</th>
                    <th className="pb-2.5 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bestsellers.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-900">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-stone-900">{item.title}</p>
                        <p className="text-[11px] text-stone-500">{item.author}</p>
                      </td>
                      <td className="py-3 text-center font-bold text-stone-800">
                        {item.qty} copies
                      </td>
                      <td className="py-3 text-right font-black text-stone-900">
                        {formatINR(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Category Share Donut / Legend (1 col) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Category Share</h3>
              <p className="text-[11px] text-stone-500">Revenue split across genres</p>
            </div>
            <PieChartIcon className="h-4 w-4 text-stone-400" />
          </div>

          <div className="mt-4">
            {categoryData.length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-400">
                No category data for selected period.
              </div>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatINR(Number(val)), 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          borderColor: '#e7e5e4',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {categoryData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-50"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-stone-700">{item.name}</span>
                      </div>
                      <span className="font-black text-stone-900">{formatINR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin Inventory Valuation Card */}
      {isAdmin && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Current Inventory Balance & Asset Valuation (Admin Only)
              </h3>
              <p className="text-xs text-stone-500">
                Evaluation based on current on-hand units and cost versus retail price
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Audited Balance Sheet
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200/60">
              <span className="text-stone-500 text-xs font-semibold">Total Stock Units</span>
              <p className="text-2xl font-black text-stone-900 mt-1">
                {activeBooks.reduce((acc, b) => acc + b.stockQuantity, 0)} units
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">Across {activeBooks.length} titles</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200/60">
              <span className="text-stone-500 text-xs font-semibold">Asset Cost Basis (Inventory Cost)</span>
              <p className="text-2xl font-black text-stone-800 mt-1">
                {formatINR(inventoryCostValuation, false)}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">Capital invested in physical books</p>
            </div>

            <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-200/60">
              <span className="text-amber-900 text-xs font-semibold">Retail Stock Value (Selling Potential)</span>
              <p className="text-2xl font-black text-amber-950 mt-1">
                {formatINR(inventoryTotalValuation, false)}
              </p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Potential Gross Margin: {formatINR(inventoryTotalValuation - inventoryCostValuation, false)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
