import {
  collection,
  doc,
  getDocs,
  runTransaction,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { InventoryMovement, MovementType, Book } from '../types';

const MOVEMENTS_COLL = 'inventoryMovements';
const BOOKS_COLL = 'books';

export interface StockAdjustmentInput {
  bookId: string;
  quantityChange: number; // positive for addition, negative for reduction
  movementType: MovementType;
  reason: string;
}

export async function adjustStock(
  input: StockAdjustmentInput,
  currentUser: { uid: string; displayName?: string }
): Promise<{ previousQuantity: number; newQuantity: number }> {
  if (!input.quantityChange || input.quantityChange === 0) {
    throw new Error('Quantity change must be a non-zero number.');
  }
  if (!input.reason || !input.reason.trim()) {
    throw new Error('A reason for stock change must be provided for audit compliance.');
  }

  const bookDocRef = doc(db, BOOKS_COLL, input.bookId);
  const movementDocRef = doc(collection(db, MOVEMENTS_COLL));

  try {
    return await runTransaction(db, async transaction => {
      const bookSnap = await transaction.get(bookDocRef);
      if (!bookSnap.exists()) {
        throw new Error('Book record not found.');
      }

      const bookData = bookSnap.data();
      const currentStock = Number(bookData.stockQuantity || 0);
      const newStock = currentStock + Number(input.quantityChange);

      if (newStock < 0) {
        throw new Error(
          `Insufficient stock. Available: ${currentStock}, adjustment: ${input.quantityChange}. Stock cannot be negative.`
        );
      }

      const now = new Date().toISOString();

      // Update book stock
      transaction.update(bookDocRef, {
        stockQuantity: newStock,
        updatedAt: now,
      });

      // Insert audit movement record
      transaction.set(movementDocRef, {
        bookId: input.bookId,
        bookTitleSnapshot: bookData.title || 'Untitled',
        movementType: input.movementType,
        quantityChange: Number(input.quantityChange),
        previousQuantity: currentStock,
        newQuantity: newStock,
        reason: input.reason.trim(),
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || 'Staff',
        createdAt: now,
      });

      return {
        previousQuantity: currentStock,
        newQuantity: newStock,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, MOVEMENTS_COLL);
  }
}

export async function getInventoryMovements(bookId?: string, limitCount = 50): Promise<InventoryMovement[]> {
  const path = MOVEMENTS_COLL;
  try {
    const collRef = collection(db, MOVEMENTS_COLL);
    let q = query(collRef, orderBy('createdAt', 'desc'), limit(limitCount));
    
    if (bookId) {
      q = query(collRef, where('bookId', '==', bookId), orderBy('createdAt', 'desc'), limit(limitCount));
    }

    const snapshot = await getDocs(q);
    const movements: InventoryMovement[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      movements.push({
        id: docSnap.id,
        bookId: data.bookId,
        bookTitleSnapshot: data.bookTitleSnapshot || 'Untitled',
        movementType: data.movementType,
        quantityChange: Number(data.quantityChange || 0),
        previousQuantity: Number(data.previousQuantity || 0),
        newQuantity: Number(data.newQuantity || 0),
        reason: data.reason || '',
        referenceSaleId: data.referenceSaleId,
        createdBy: data.createdBy,
        createdByName: data.createdByName || 'Staff',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });

    return movements;
  } catch (error) {
    // If composite index is building or not available, fallback to basic read
    console.warn('Falling back to basic movement list query:', error);
    try {
      const snapshot = await getDocs(collection(db, MOVEMENTS_COLL));
      const movements: InventoryMovement[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!bookId || data.bookId === bookId) {
          movements.push({
            id: docSnap.id,
            bookId: data.bookId,
            bookTitleSnapshot: data.bookTitleSnapshot || 'Untitled',
            movementType: data.movementType,
            quantityChange: Number(data.quantityChange || 0),
            previousQuantity: Number(data.previousQuantity || 0),
            newQuantity: Number(data.newQuantity || 0),
            reason: data.reason || '',
            referenceSaleId: data.referenceSaleId,
            createdBy: data.createdBy,
            createdByName: data.createdByName || 'Staff',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        }
      });
      return movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, path);
    }
  }
}
