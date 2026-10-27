import React, { useEffect, useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  Printer,
  Download,
  IndianRupee,
  ShoppingBag,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { Sale } from '../types';
import { getSales } from '../services/salesService';
import { formatINR, formatDate, formatDateTime, exportToCSV } from '../utils/formatters';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { StatCard } from '../components/common/StatCard';

export const BillingPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await getSales();
      setSales(data);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        sale.invoiceNumber.toLowerCase().includes(q) ||
        (sale.customerNameSnapshot &&
          sale.customerNameSnapshot.toLowerCase().includes(q)) ||
        sale.createdByName.toLowerCase().includes(q);

      const matchesPayment =
        paymentFilter === 'all' || sale.paymentMethod === paymentFilter;

      return matchesQuery && matchesPayment;
    });
  }, [sales, searchQuery, paymentFilter]);

  const handleOpenReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  const handleExportCSV = () => {
    const rows = filteredSales.map(s => ({
      'Invoice Number': s.invoiceNumber,
      'Date Time': formatDateTime(s.createdAt),
      'Customer': s.customerNameSnapshot || 'Walk-in Customer',
      'Items Count': s.items.reduce((acc, i) => acc + i.quantity, 0),
      'Subtotal (INR)': s.subtotal,
      'Discount (INR)': s.discount,
      'Tax (INR)': s.tax,
      'Net Total (INR)': s.totalAmount,
      'Payment Method': s.paymentMethod.toUpperCase(),
      'Cashier': s.createdByName,
      'Status': s.status.toUpperCase(),
    }));
    exportToCSV(`bookstore_invoices_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const totalInvoices = sales.length;
  const totalGrossRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const averageTicket = totalInvoices > 0 ? totalGrossRevenue / totalInvoices : 0;

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Invoices"
          value={loading ? '...' : totalInvoices}
          subtitle="All recorded transactions"
          icon={Receipt}
          accentColor="amber"
        />
        <StatCard
          title="Gross Billed Revenue"
          value={loading ? '...' : formatINR(totalGrossRevenue, false)}
          subtitle="Cumulative sales total"
          icon={IndianRupee}
          accentColor="emerald"
        />
        <StatCard
          title="Average Order Value"
          value={loading ? '...' : formatINR(averageTicket)}
          subtitle="Revenue per transaction"
          icon={ShoppingBag}
          accentColor="blue"
        />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-700 focus:outline-hidden"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="h-10 rounded-xl border border-stone-200 bg-stone-50/60 px-3 text-xs font-medium text-stone-700 focus:border-amber-700 focus:outline-hidden"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash Only</option>
            <option value="upi">UPI Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredSales.length === 0}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>Export Invoices CSV</span>
          </button>
          <button
            onClick={fetchSales}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
            Loading invoices from Firestore...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-20 text-center">
            <Receipt className="mx-auto h-12 w-12 text-stone-300" />
            <h4 className="mt-3 text-sm font-bold text-stone-900">No invoices found</h4>
            <p className="mt-1 text-xs text-stone-500">
              {sales.length === 0
                ? 'No checkout transactions recorded yet. Go to Sales (POS) to create a bill.'
                : 'No invoices match your search filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Invoice Number</th>
                  <th className="py-3.5 px-3">Date & Time</th>
                  <th className="py-3.5 px-3">Billed Customer</th>
                  <th className="py-3.5 px-3 text-center">Items Qty</th>
                  <th className="py-3.5 px-3 text-right">Subtotal</th>
                  <th className="py-3.5 px-3 text-right">Net Amount</th>
                  <th className="py-3.5 px-3">Payment</th>
                  <th className="py-3.5 px-3">Cashier</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 pl-6 pr-3 font-bold text-stone-900 font-mono">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-3 text-stone-500 whitespace-nowrap">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-stone-800">
                      {sale.customerNameSnapshot || 'Walk-in Customer'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-stone-700">
                      {sale.items.reduce((acc, i) => acc + i.quantity, 0)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-stone-500">
                      {formatINR(sale.subtotal)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-stone-900 text-sm">
                      {formatINR(sale.totalAmount)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          sale.paymentMethod === 'upi'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-stone-600 font-medium">
                      {sale.createdByName || 'Staff'}
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-right">
                      <button
                        onClick={() => handleOpenReceipt(sale)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                        title="View and reprint receipt"
                      >
                        <Eye className="h-3.5 w-3.5 text-stone-500" />
                        <span>View Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Reopening Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={selectedSale}
      />
    </div>
  );
};
