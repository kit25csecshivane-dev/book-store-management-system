import React from 'react';
import { Printer, Download, CheckCircle2, BookOpen } from 'lucide-react';
import { Sale } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { formatINR, formatDateTime } from '../../utils/formatters';
import { Modal } from './Modal';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  onNewSale,
}) => {
  const { settings } = useSettings();

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tax Invoice & Receipt"
      subtitle={`Invoice #${sale.invoiceNumber}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Printable Area with dedicated ID and class */}
        <div
          id="printable-receipt"
          className="receipt-print-area rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 font-sans shadow-xs"
        >
          {/* Bookstore Header */}
          <div className="text-center pb-5 border-b border-dashed border-stone-300">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-800 text-white mb-2 print:hidden">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-stone-900 uppercase">
              {settings.storeName}
            </h2>
            <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto leading-relaxed">
              {settings.address}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 text-xs text-stone-500">
              <span>Tel: {settings.phone}</span>
              <span>•</span>
              <span>{settings.email}</span>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="py-4 grid grid-cols-2 gap-4 text-xs border-b border-dashed border-stone-300">
            <div>
              <p className="text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                Invoice Details
              </p>
              <p className="font-bold text-stone-900 mt-0.5">{sale.invoiceNumber}</p>
              <p className="text-stone-500 mt-0.5">{formatDateTime(sale.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                Billed To
              </p>
              <p className="font-bold text-stone-900 mt-0.5">
                {sale.customerNameSnapshot || 'Walk-in Customer'}
              </p>
              <p className="text-stone-500 mt-0.5">
                Cashier: {sale.createdByName || 'Bookstore Staff'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4 border-b border-dashed border-stone-300">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="pb-2">Item Description</th>
                  <th className="pb-2 text-center w-12">Qty</th>
                  <th className="pb-2 text-right w-20">Rate</th>
                  <th className="pb-2 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 pr-2">
                      <p className="font-semibold text-stone-900">{item.title}</p>
                      <p className="text-[10px] text-stone-400">
                        {item.author} {item.isbn ? `• ISBN: ${item.isbn}` : ''}
                      </p>
                    </td>
                    <td className="py-2.5 text-center font-medium text-stone-700">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right text-stone-600">
                      {formatINR(item.unitPrice)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-stone-900">
                      {formatINR(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown */}
          <div className="py-4 space-y-1.5 text-xs border-b border-dashed border-stone-300">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal ({sale.items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
              <span>{formatINR(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Promotional Discount</span>
                <span>-{formatINR(sale.discount)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Applicable GST / Tax</span>
                <span>+{formatINR(sale.tax)}</span>
              </div>
            )}
            <div className="pt-2 flex justify-between text-sm font-black text-stone-900 border-t border-stone-200">
              <span>Net Total Payable</span>
              <span className="text-base text-amber-900 font-extrabold">
                {formatINR(sale.totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="py-3 flex items-center justify-between text-xs text-stone-600">
            <div>
              <span className="font-semibold text-stone-800 uppercase text-[10px] tracking-wider block">
                Payment Method
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-stone-900 mt-0.5 uppercase">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {sale.paymentMethod === 'upi' ? 'UPI Transfer' : 'Cash on Counter'}
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-stone-800 uppercase text-[10px] tracking-wider block">
                Payment Status
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] uppercase">
                Paid in Full
              </span>
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div className="pt-4 text-center border-t border-dashed border-stone-300">
            <p className="text-xs italic text-stone-600 font-medium">
              "{settings.receiptFooterMessage || 'Thank you for your purchase!'}"
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              Computer Generated Receipt • System Auth ID: {sale.id.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
          {onNewSale && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewSale();
              }}
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Start New Sale
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-amber-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
