import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  FileText,
  ShoppingBag,
  IndianRupee,
  Edit2,
  Eye,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Customer, Sale, NavTab } from '../types';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  getCustomerSales,
  CreateCustomerInput
} from '../services/customerService';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';

interface CustomersPageProps {
  initialOpenAdd?: boolean;
  onResetInitialOpenAdd?: () => void;
  onViewInvoice?: (invoiceNumber: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  initialOpenAdd,
  onResetInitialOpenAdd,
  onViewInvoice,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd || false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (initialOpenAdd) {
      setIsAddModalOpen(true);
      if (onResetInitialOpenAdd) onResetInitialOpenAdd();
    }
  }, [initialOpenAdd]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setActiveCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = async (customer: Customer) => {
    setActiveCustomer(customer);
    setIsDetailsModalOpen(true);
    setLoadingSales(true);
    try {
      const sales = await getCustomerSales(customer.id);
      setCustomerSales(sales);
    } catch (err) {
      console.error('Failed to load customer purchases:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditModalOpen && activeCustomer) {
        await updateCustomer(activeCustomer.id, formData);
      } else {
        await createCustomer(formData);
      }

      await fetchCustomers();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Customer operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRegistered = customers.length;
  const totalLifetimeSpend = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const activeShoppers = customers.filter(c => c.totalPurchases > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Registered Customers"
          value={loading ? '...' : totalRegistered}
          subtitle="Profiles in database"
          icon={Users}
          accentColor="stone"
        />
        <StatCard
          title="Active Buyers"
          value={loading ? '...' : activeShoppers}
          subtitle="Completed 1 or more purchases"
          icon={ShoppingBag}
          accentColor="amber"
        />
        <StatCard
          title="Total Customer Spend"
          value={loading ? '...' : formatINR(totalLifetimeSpend, false)}
          subtitle="Cumulative lifetime spend"
          icon={IndianRupee}
          accentColor="emerald"
        />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-700 focus:bg-white focus:outline-hidden"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Customer Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-500">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
            Loading customer directory...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-stone-300" />
            <h4 className="mt-3 text-sm font-bold text-stone-900">No customers found</h4>
            <p className="mt-1 text-xs text-stone-500">
              {customers.length === 0
                ? 'Your customer directory is empty. Add a customer profile or proceed as Walk-in at POS.'
                : 'No customers match your search.'}
            </p>
            {customers.length === 0 && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-900"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add First Customer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Customer Name</th>
                  <th className="py-3.5 px-3">Contact Details</th>
                  <th className="py-3.5 px-3">Notes / Membership</th>
                  <th className="py-3.5 px-3 text-center">Orders</th>
                  <th className="py-3.5 px-3 text-right">Total Spent</th>
                  <th className="py-3.5 px-3">Joined Date</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 pl-6 pr-3">
                      <p className="font-bold text-stone-900">{customer.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">ID: {customer.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <Phone className="h-3 w-3 text-stone-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-stone-500">
                            <Mail className="h-3 w-3 text-stone-400" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {!customer.phone && !customer.email && (
                          <span className="text-stone-400 italic">No contact provided</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs truncate text-stone-600">
                      {customer.notes || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-stone-900">
                      {customer.totalPurchases || 0}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-stone-900">
                      {formatINR(customer.totalSpent || 0)}
                    </td>
                    <td className="py-3.5 px-3 text-stone-500 whitespace-nowrap">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetails(customer)}
                          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                          title="Purchase History"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(customer)}
                          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                          title="Edit Customer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}
        title={isEditModalOpen ? 'Edit Customer' : 'Register New Customer'}
        subtitle="Walk-in sales can also proceed without registration"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Aarav Sharma"
              className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98200 12345"
              className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. customer@example.com"
              className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Customer Notes / Reading Interests
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Prefers science fiction, College CSE department, Student discount..."
              className="w-full rounded-xl border border-stone-200 p-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
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
              {isSubmitting ? 'Saving...' : isEditModalOpen ? 'Save Updates' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Purchase History Modal */}
      {activeCustomer && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Customer: ${activeCustomer.name}`}
          subtitle={`Member since ${formatDate(activeCustomer.createdAt)}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Summary Banner */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-xs">
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px]">Phone</span>
                <p className="font-semibold text-stone-800 mt-0.5">{activeCustomer.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px]">Email</span>
                <p className="font-semibold text-stone-800 mt-0.5 truncate">{activeCustomer.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px]">Total Orders</span>
                <p className="font-black text-stone-900 text-sm mt-0.5">{activeCustomer.totalPurchases || 0}</p>
              </div>
              <div>
                <span className="text-stone-400 font-bold uppercase text-[10px]">Lifetime Spend</span>
                <p className="font-black text-amber-900 text-sm mt-0.5">{formatINR(activeCustomer.totalSpent || 0)}</p>
              </div>
            </div>

            {/* Invoices List */}
            <div>
              <h5 className="text-xs font-bold text-stone-900 mb-2">Purchase History & Invoices</h5>
              {loadingSales ? (
                <div className="py-8 text-center text-xs text-stone-400">Loading purchase records...</div>
              ) : customerSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                  No completed sales recorded for this customer yet.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white overflow-hidden max-h-72 overflow-y-auto">
                  {customerSales.map(sale => (
                    <div key={sale.id} className="p-3 hover:bg-stone-50 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{sale.invoiceNumber}</span>
                          <span className="text-[10px] text-stone-400">• {formatDateTime(sale.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {sale.items.map(i => `${i.title} (${i.quantity})`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right shrink-0 pl-3">
                        <span className="font-black text-stone-900 block">{formatINR(sale.totalAmount)}</span>
                        <span className="text-[10px] font-semibold text-stone-500 uppercase">{sale.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
