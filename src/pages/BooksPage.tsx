import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Eye,
  Power,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Book } from '../types';
import {
  getBooks,
  createBook,
  updateBook,
  toggleBookStatus,
  CreateBookInput
} from '../services/bookService';
import { formatINR, formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';

interface BooksPageProps {
  initialOpenAdd?: boolean;
  onResetInitialOpenAdd?: () => void;
  initialSearchQuery?: string;
}

export const BooksPage: React.FC<BooksPageProps> = ({
  initialOpenAdd,
  onResetInitialOpenAdd,
  initialSearchQuery = '',
}) => {
  const { userProfile, isAdmin } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'price' | 'stock'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd || false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeBook, setActiveBook] = useState<Book | null>(null);

  // Deactivation confirmation
  const [isConfirmToggleOpen, setIsConfirmToggleOpen] = useState(false);
  const [bookToToggle, setBookToToggle] = useState<Book | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateBookInput>({
    title: '',
    author: '',
    category: 'Computer Science',
    isbn: '',
    publisher: '',
    publicationYear: new Date().getFullYear(),
    sellingPrice: 499,
    costPrice: 320,
    stockQuantity: 10,
    lowStockThreshold: 5,
    coverImageUrl: '',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await getBooks(true);
      setBooks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (initialOpenAdd) {
      setIsAddModalOpen(true);
      if (onResetInitialOpenAdd) onResetInitialOpenAdd();
    }
  }, [initialOpenAdd]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set).sort();
  }, [books]);

  // Filtered and Sorted list
  const filteredBooks = useMemo(() => {
    return books
      .filter(book => {
        // Search text matching title, author, or ISBN
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          (book.isbn && book.isbn.toLowerCase().includes(q));

        // Category filter
        const matchesCategory =
          selectedCategory === 'all' || book.category === selectedCategory;

        // Stock status filter
        let matchesStock = true;
        if (stockFilter === 'in_stock') {
          matchesStock = book.stockQuantity > book.lowStockThreshold && book.active;
        } else if (stockFilter === 'low_stock') {
          matchesStock =
            book.stockQuantity <= book.lowStockThreshold &&
            book.stockQuantity > 0 &&
            book.active;
        } else if (stockFilter === 'out_of_stock') {
          matchesStock = book.stockQuantity === 0 && book.active;
        } else if (stockFilter === 'inactive') {
          matchesStock = !book.active;
        }

        return matchesQuery && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'title') {
          cmp = a.title.localeCompare(b.title);
        } else if (sortBy === 'price') {
          cmp = a.sellingPrice - b.sellingPrice;
        } else if (sortBy === 'stock') {
          cmp = a.stockQuantity - b.stockQuantity;
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [books, searchQuery, selectedCategory, stockFilter, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      category: 'Computer Science',
      isbn: '',
      publisher: '',
      publicationYear: new Date().getFullYear(),
      sellingPrice: 499,
      costPrice: 320,
      stockQuantity: 10,
      lowStockThreshold: 5,
      coverImageUrl: '',
      description: '',
    });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setActiveBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || new Date().getFullYear(),
      sellingPrice: book.sellingPrice,
      costPrice: book.costPrice !== undefined ? book.costPrice : Math.round(book.sellingPrice * 0.7),
      stockQuantity: book.stockQuantity,
      lowStockThreshold: book.lowStockThreshold,
      coverImageUrl: book.coverImageUrl || '',
      description: book.description || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = (book: Book) => {
    setActiveBook(book);
    setIsViewModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validations
    if (!formData.title.trim()) {
      setFormError('Book title is required.');
      return;
    }
    if (!formData.author.trim()) {
      setFormError('Author name is required.');
      return;
    }
    if (formData.sellingPrice < 0) {
      setFormError('Selling price cannot be negative.');
      return;
    }
    if (formData.costPrice !== undefined && formData.costPrice < 0) {
      setFormError('Cost price cannot be negative.');
      return;
    }
    if (formData.stockQuantity < 0) {
      setFormError('Stock quantity cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      const userParam = {
        uid: userProfile?.uid || 'staff',
        displayName: userProfile?.displayName || 'Staff',
      };

      if (isEditModalOpen && activeBook) {
        await updateBook(activeBook.id, formData, userParam);
      } else {
        await createBook(formData, userParam);
      }

      await fetchBooks();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!bookToToggle) return;
    try {
      setIsSubmitting(true);
      await toggleBookStatus(bookToToggle.id, !bookToToggle.active);
      await fetchBooks();
      setIsConfirmToggleOpen(false);
      setBookToToggle(null);
    } catch (err: any) {
      alert(`Could not change status: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900">Book Catalog Management</h3>
          <p className="text-xs text-stone-500">
            Total {books.length} titles registered in inventory
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-700 focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={e => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 rounded-xl border border-stone-200 bg-stone-50/60 px-3 text-xs font-medium text-stone-700 focus:border-amber-700 focus:outline-hidden"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Stock Status Filter */}
        <select
          value={stockFilter}
          onChange={e => {
            setStockFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 rounded-xl border border-stone-200 bg-stone-50/60 px-3 text-xs font-medium text-stone-700 focus:border-amber-700 focus:outline-hidden"
        >
          <option value="all">All Statuses</option>
          <option value="in_stock">In Stock (&gt; Low)</option>
          <option value="low_stock">Low Stock (≤ Threshold)</option>
          <option value="out_of_stock">Out of Stock (0 Units)</option>
          <option value="inactive">Inactive Titles</option>
        </select>

        {/* Sort Controls */}
        <div className="flex items-center gap-1">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-10 rounded-xl border border-stone-200 bg-stone-50/60 px-3 text-xs font-medium text-stone-700 focus:border-amber-700 focus:outline-hidden"
          >
            <option value="title">Sort: Title</option>
            <option value="price">Sort: Price</option>
            <option value="stock">Sort: Stock</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50/60 text-stone-600 hover:bg-stone-100"
            title={`Order: ${sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Books Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
            Loading catalog from Firestore...
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-stone-300" />
            <h4 className="mt-3 text-sm font-bold text-stone-900">No books found</h4>
            <p className="mt-1 text-xs text-stone-500">
              {books.length === 0
                ? 'Your book catalog is currently empty. Click "Add New Book" or seed demo data in Settings.'
                : 'No books match the current search filters.'}
            </p>
            {books.length === 0 && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-900"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Book</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Book Info</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">ISBN</th>
                  <th className="py-3.5 px-3 text-right">Selling Price</th>
                  {isAdmin && <th className="py-3.5 px-3 text-right">Cost Price</th>}
                  <th className="py-3.5 px-3 text-center">Stock</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedBooks.map(book => {
                  const isLow = book.stockQuantity <= book.lowStockThreshold && book.stockQuantity > 0;
                  const isOut = book.stockQuantity === 0;

                  return (
                    <tr
                      key={book.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        !book.active ? 'opacity-60 bg-stone-50/30' : ''
                      }`}
                    >
                      {/* Book info with thumbnail */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-9 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                            {book.coverImageUrl ? (
                              <img
                                src={book.coverImageUrl}
                                alt={book.title}
                                className="h-full w-full object-cover"
                                onError={e => {
                                  // Fallback placeholder on broken image URL
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=60';
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-400">
                                <BookOpen className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 line-clamp-1">{book.title}</p>
                            <p className="text-[11px] text-stone-500 line-clamp-1">{book.author}</p>
                            {book.publisher && (
                              <p className="text-[10px] text-stone-400 line-clamp-1">
                                {book.publisher} {book.publicationYear ? `(${book.publicationYear})` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-700">
                          {book.category}
                        </span>
                      </td>

                      {/* ISBN */}
                      <td className="py-3.5 px-3 font-mono text-stone-600">
                        {book.isbn || '—'}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-3 text-right font-black text-stone-900">
                        {formatINR(book.sellingPrice)}
                      </td>

                      {/* Cost Price (Admin only) */}
                      {isAdmin && (
                        <td className="py-3.5 px-3 text-right font-medium text-stone-500">
                          {book.costPrice !== undefined ? formatINR(book.costPrice) : '—'}
                        </td>
                      )}

                      {/* Stock Quantity & Badge */}
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
                          {isOut ? 'Out of stock' : `${book.stockQuantity} in stock`}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            book.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {book.active ? 'Active' : 'Archived'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenView(book)}
                            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(book)}
                            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                            title="Edit book"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setBookToToggle(book);
                              setIsConfirmToggleOpen(true);
                            }}
                            className={`rounded-lg p-1.5 transition-colors ${
                              book.active
                                ? 'text-stone-400 hover:bg-rose-50 hover:text-rose-600'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={book.active ? 'Deactivate / Archive' : 'Reactivate book'}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredBooks.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-200 px-6 py-3.5 text-xs text-stone-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-stone-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-stone-800">
                {Math.min(currentPage * itemsPerPage, filteredBooks.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-stone-800">{filteredBooks.length}</span>{' '}
              results
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Book Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}
        title={isEditModalOpen ? 'Edit Book Details' : 'Add New Book to Catalog'}
        subtitle="Ensure title, pricing, and initial stock quantity are accurate"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveBook} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Book Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Introduction to Algorithms"
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Author Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g. Thomas H. Cormen"
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Genre / Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Computer Science, Programming, Fiction"
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* ISBN */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ISBN (Unique)
              </label>
              <input
                type="text"
                value={formData.isbn || ''}
                onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="e.g. 978-0262046305"
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden font-mono"
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Publisher
              </label>
              <input
                type="text"
                value={formData.publisher || ''}
                onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                placeholder="e.g. MIT Press, Pearson, O'Reilly"
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Publication Year */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Publication Year
              </label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear() + 1}
                value={formData.publicationYear || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    publicationYear: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g. 2022"
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Selling Price (INR ₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.sellingPrice}
                onChange={e =>
                  setFormData({ ...formData, sellingPrice: Math.max(0, Number(e.target.value)) })
                }
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs font-bold text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Cost Price (INR ₹) {isAdmin ? '' : '(Admin viewable)'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.costPrice || 0}
                onChange={e =>
                  setFormData({ ...formData, costPrice: Math.max(0, Number(e.target.value)) })
                }
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isEditModalOpen ? 'Current Stock Units' : 'Initial Stock Units'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.stockQuantity}
                onChange={e =>
                  setFormData({ ...formData, stockQuantity: Math.max(0, Number(e.target.value)) })
                }
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs font-bold text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Low Stock Alert Threshold */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Low Stock Threshold Alert
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.lowStockThreshold || 5}
                onChange={e =>
                  setFormData({
                    ...formData,
                    lowStockThreshold: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Cover Image URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                value={formData.coverImageUrl || ''}
                onChange={e => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Synopsis & Description
              </label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary or subject matter overview..."
                className="w-full rounded-xl border border-stone-200 p-3 text-xs text-stone-900 focus:border-amber-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-amber-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Book Details Modal */}
      {activeBook && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={activeBook.title}
          subtitle={`By ${activeBook.author} • ${activeBook.category}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="h-44 w-32 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 mx-auto sm:mx-0">
                {activeBook.coverImageUrl ? (
                  <img
                    src={activeBook.coverImageUrl}
                    alt={activeBook.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400">
                    <BookOpen className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div>
                  <span className="text-stone-400 uppercase text-[10px] font-bold tracking-wider">
                    ISBN
                  </span>
                  <p className="font-mono text-stone-900 font-semibold">{activeBook.isbn || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-stone-400 uppercase text-[10px] font-bold tracking-wider">
                    Publisher & Year
                  </span>
                  <p className="text-stone-800">
                    {activeBook.publisher || 'Not specified'}{' '}
                    {activeBook.publicationYear ? `(${activeBook.publicationYear})` : ''}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-stone-400 uppercase text-[10px] font-bold tracking-wider">
                      Selling Price
                    </span>
                    <p className="text-base font-black text-stone-900">
                      {formatINR(activeBook.sellingPrice)}
                    </p>
                  </div>
                  {isAdmin && (
                    <div>
                      <span className="text-stone-400 uppercase text-[10px] font-bold tracking-wider">
                        Cost Price (Admin)
                      </span>
                      <p className="text-sm font-semibold text-stone-600">
                        {activeBook.costPrice !== undefined ? formatINR(activeBook.costPrice) : '—'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="pt-1">
                  <span className="text-stone-400 uppercase text-[10px] font-bold tracking-wider">
                    Current Stock
                  </span>
                  <p className="text-sm font-bold text-stone-900">
                    {activeBook.stockQuantity} copies available
                  </p>
                </div>
              </div>
            </div>

            {activeBook.description && (
              <div className="border-t border-stone-150 pt-3">
                <h5 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Description / Synopsis
                </h5>
                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl">
                  {activeBook.description}
                </p>
              </div>
            )}

            <div className="border-t border-stone-150 pt-3 flex justify-between items-center text-[10px] text-stone-400">
              <span>Cataloged: {formatDate(activeBook.createdAt)}</span>
              <span>Updated: {formatDate(activeBook.updatedAt)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Status Toggle */}
      <ConfirmDialog
        isOpen={isConfirmToggleOpen}
        onClose={() => {
          setIsConfirmToggleOpen(false);
          setBookToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title={bookToToggle?.active ? 'Archive Book' : 'Reactivate Book'}
        message={
          bookToToggle?.active
            ? `Are you sure you want to archive "${bookToToggle?.title}"? Historical sales and inventory records will remain completely intact, but the title will be hidden from checkout point of sale.`
            : `Reactivate "${bookToToggle?.title}" to make it available for point of sale checkout?`
        }
        confirmLabel={bookToToggle?.active ? 'Archive Book' : 'Reactivate'}
        variant={bookToToggle?.active ? 'warning' : 'info'}
        isLoading={isSubmitting}
      />
    </div>
  );
};
