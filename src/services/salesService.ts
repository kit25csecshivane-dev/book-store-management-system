import {
  collection,
  doc,
  getDocs,
  getDoc,
  runTransaction,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Sale, SaleItem, PaymentMethod } from '../types';
import { generateInvoiceNumber } from '../utils/formatters';

const SALES_COLL = 'sales';
const BOOKS_COLL = 'books';
const MOVEMENTS_COLL = 'inventoryMovements';
const CUSTOMERS_COLL = 'customers';

export interface ProcessSaleInput {
  items: Array<{
    bookId: string;
    quantity: number;
  }>;
  customerId?: string | null;
  customerName?: string;
  discountPercentage?: number;
  taxPercentage?: number;
  paymentMethod: PaymentMethod;
}

export async function processSale(
  input: ProcessSaleInput,
  currentUser: { uid: string; displayName?: string }
): Promise<Sale> {
  if (!input.items || input.items.length === 0) {
    throw new Error('Cart is empty. Please add at least one book to complete a sale.');
  }

  // Pre-validate quantities
  for (const item of input.items) {
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Invalid quantity (${item.quantity}). Must be a positive integer.`);
    }
  }

  // Count existing sales for sequential invoice number
  let existingSalesCount = 0;
  try {
    const countSnap = await getDocs(collection(db, SALES_COLL));
    existingSalesCount = countSnap.size;
  } catch (err) {
    console.warn('Could not count sales, using timestamp sequence');
  }
  const invoiceNumber = generateInvoiceNumber(existingSalesCount);

  const saleDocRef = doc(collection(db, SALES_COLL));
  const now = new Date().toISOString();

  try {
    const completedSale = await runTransaction(db, async transaction => {
      // 1. Fetch fresh book records inside the transaction
      const bookSnapshots = await Promise.all(
        input.items.map(item => transaction.get(doc(db, BOOKS_COLL, item.bookId)))
      );

      const verifiedSaleItems: SaleItem[] = [];
      let subtotal = 0;

      for (let i = 0; i < input.items.length; i++) {
        const itemInput = input.items[i];
        const snap = bookSnapshots[i];

        if (!snap.exists()) {
          throw new Error(`Book with ID "${itemInput.bookId}" was not found.`);
        }

        const bookData = snap.data();

        if (bookData.active === false) {
          throw new Error(`"${bookData.title}" is inactive and cannot be sold.`);
        }

        const currentStock = Number(bookData.stockQuantity || 0);
        if (currentStock < itemInput.quantity) {
          throw new Error(
            `Insufficient stock for "${bookData.title}". Requested: ${itemInput.quantity}, Available: ${currentStock}.`
          );
        }

        const trustedUnitPrice = Number(bookData.sellingPrice || 0);
        const costPrice = bookData.costPrice !== undefined ? Number(bookData.costPrice) : undefined;
        const lineTotal = trustedUnitPrice * itemInput.quantity;
        subtotal += lineTotal;

        verifiedSaleItems.push({
          bookId: itemInput.bookId,
          title: bookData.title || 'Untitled',
          author: bookData.author || 'Unknown',
          isbn: bookData.isbn || '',
          quantity: itemInput.quantity,
          unitPrice: trustedUnitPrice,
          costPrice,
          lineTotal,
        });

        // Deduct inventory
        const newStock = currentStock - itemInput.quantity;
        transaction.update(snap.ref, {
          stockQuantity: newStock,
          updatedAt: now,
        });

        // Record stock movement for audit
        const movementDocRef = doc(collection(db, MOVEMENTS_COLL));
        transaction.set(movementDocRef, {
          bookId: itemInput.bookId,
          bookTitleSnapshot: bookData.title || 'Untitled',
          movementType: 'sale',
          quantityChange: -itemInput.quantity,
          previousQuantity: currentStock,
          newQuantity: newStock,
          reason: `Sale completed (Invoice #${invoiceNumber})`,
          referenceSaleId: saleDocRef.id,
          createdBy: currentUser.uid,
          createdByName: currentUser.displayName || 'Staff',
          createdAt: now,
        });
      }

      // Calculate discount and tax
      const discountPct = Math.max(0, Math.min(100, Number(input.discountPercentage || 0)));
      const discount = (subtotal * discountPct) / 100;

      const taxPct = Math.max(0, Math.min(100, Number(input.taxPercentage || 0)));
      const taxableAmount = subtotal - discount;
      const tax = (taxableAmount * taxPct) / 100;

      const totalAmount = Math.max(0, taxableAmount + tax);

      // Customer info & customer update if specified
      let customerName = input.customerName?.trim() || 'Walk-in Customer';
      if (input.customerId) {
        const customerRef = doc(db, CUSTOMERS_COLL, input.customerId);
        const customerSnap = await transaction.get(customerRef);
        if (customerSnap.exists()) {
          const custData = customerSnap.data();
          customerName = custData.name || customerName;
          transaction.update(customerRef, {
            totalPurchases: Number(custData.totalPurchases || 0) + 1,
            totalSpent: Number(custData.totalSpent || 0) + totalAmount,
            updatedAt: now,
          });
        }
      }

      const saleRecord: Sale = {
        id: saleDocRef.id,
        invoiceNumber,
        customerId: input.customerId || null,
        customerNameSnapshot: customerName,
        items: verifiedSaleItems,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'completed',
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || 'Staff',
        status: 'completed',
        createdAt: now,
      };

      // Create Sale document
      transaction.set(saleDocRef, saleRecord);

      return saleRecord;
    });

    return completedSale;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SALES_COLL);
  }
}

export async function getSales(): Promise<Sale[]> {
  const path = SALES_COLL;
  try {
    const collRef = collection(db, SALES_COLL);
    const snapshot = await getDocs(collRef);
    const sales: Sale[] = [];
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      sales.push({
        id: docSnap.id,
        invoiceNumber: data.invoiceNumber || 'INV-UNKNOWN',
        customerId: data.customerId || null,
        customerNameSnapshot: data.customerNameSnapshot || 'Walk-in Customer',
        items: data.items || [],
        subtotal: Number(data.subtotal || 0),
        discount: Number(data.discount || 0),
        tax: Number(data.tax || 0),
        totalAmount: Number(data.totalAmount || 0),
        paymentMethod: data.paymentMethod || 'cash',
        paymentStatus: data.paymentStatus || 'completed',
        createdBy: data.createdBy || '',
        createdByName: data.createdByName || 'Staff',
        status: data.status || 'completed',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });

    return sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getSaleById(saleId: string): Promise<Sale | null> {
  const path = `${SALES_COLL}/${saleId}`;
  try {
    const docRef = doc(db, SALES_COLL, saleId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      invoiceNumber: data.invoiceNumber,
      customerId: data.customerId,
      customerNameSnapshot: data.customerNameSnapshot,
      items: data.items || [],
      subtotal: Number(data.subtotal || 0),
      discount: Number(data.discount || 0),
      tax: Number(data.tax || 0),
      totalAmount: Number(data.totalAmount || 0),
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      status: data.status,
      createdAt: data.createdAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
