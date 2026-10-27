export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  category: string;
  publisher?: string;
  publicationYear?: number;
  sellingPrice: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  coverImageUrl?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  totalPurchases: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  bookId: string;
  title: string;
  author: string;
  isbn?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  lineTotal: number;
}

export type PaymentMethod = 'cash' | 'upi';
export type SaleStatus = 'completed' | 'cancelled';

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerNameSnapshot?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'completed';
  createdBy: string;
  createdByName: string;
  status: SaleStatus;
  createdAt: string;
}

export type MovementType = 'sale' | 'restock' | 'adjustment' | 'initial';

export interface InventoryMovement {
  id: string;
  bookId: string;
  bookTitleSnapshot: string;
  movementType: MovementType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceSaleId?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  defaultLowStockThreshold: number;
  receiptFooterMessage: string;
  taxPercentage: number;
  supportedPaymentMethods: PaymentMethod[];
  currency: string;
  updatedAt?: string;
}

export type NavTab = 
  | 'dashboard'
  | 'books'
  | 'inventory'
  | 'customers'
  | 'sales'
  | 'billing'
  | 'reports'
  | 'settings';
