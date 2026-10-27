import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Book } from '../types';

const COLLECTION_NAME = 'books';

export interface CreateBookInput {
  title: string;
  author: string;
  category: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  sellingPrice: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  coverImageUrl?: string;
  description?: string;
}

export async function checkIsbnExists(isbn: string, excludeBookId?: string): Promise<boolean> {
  if (!isbn || !isbn.trim()) return false;
  const path = COLLECTION_NAME;
  try {
    const q = query(collection(db, COLLECTION_NAME), where('isbn', '==', isbn.trim()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    if (!excludeBookId) return true;
    return snapshot.docs.some(d => d.id !== excludeBookId);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getBooks(includeInactive = false): Promise<Book[]> {
  const path = COLLECTION_NAME;
  try {
    const collRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(collRef);
    const books: Book[] = [];
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (includeInactive || data.active !== false) {
        books.push({
          id: docSnap.id,
          title: data.title || 'Untitled',
          author: data.author || 'Unknown',
          category: data.category || 'General',
          isbn: data.isbn || '',
          publisher: data.publisher || '',
          publicationYear: data.publicationYear ? Number(data.publicationYear) : undefined,
          sellingPrice: Number(data.sellingPrice || 0),
          costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
          stockQuantity: Number(data.stockQuantity || 0),
          lowStockThreshold: Number(data.lowStockThreshold || 5),
          coverImageUrl: data.coverImageUrl || '',
          description: data.description || '',
          active: data.active !== false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      }
    });

    // Sort by title
    return books.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      author: data.author,
      category: data.category,
      isbn: data.isbn,
      publisher: data.publisher,
      publicationYear: data.publicationYear,
      sellingPrice: Number(data.sellingPrice || 0),
      costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
      stockQuantity: Number(data.stockQuantity || 0),
      lowStockThreshold: Number(data.lowStockThreshold || 5),
      coverImageUrl: data.coverImageUrl,
      description: data.description,
      active: data.active !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createBook(
  input: CreateBookInput,
  currentUser: { uid: string; displayName?: string }
): Promise<string> {
  const path = COLLECTION_NAME;
  
  // Validation
  if (!input.title || !input.title.trim()) {
    throw new Error('Book title is required.');
  }
  if (!input.author || !input.author.trim()) {
    throw new Error('Author name is required.');
  }
  if (input.sellingPrice < 0) {
    throw new Error('Selling price cannot be negative.');
  }
  if (input.costPrice !== undefined && input.costPrice < 0) {
    throw new Error('Cost price cannot be negative.');
  }
  if (input.stockQuantity < 0) {
    throw new Error('Initial stock quantity cannot be negative.');
  }

  // ISBN duplicate validation
  if (input.isbn && input.isbn.trim()) {
    const exists = await checkIsbnExists(input.isbn.trim());
    if (exists) {
      throw new Error(`A book with ISBN "${input.isbn.trim()}" already exists in the system.`);
    }
  }

  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      title: input.title.trim(),
      author: input.author.trim(),
      category: input.category?.trim() || 'General',
      isbn: input.isbn?.trim() || '',
      publisher: input.publisher?.trim() || '',
      publicationYear: input.publicationYear || null,
      sellingPrice: Number(input.sellingPrice),
      costPrice: input.costPrice !== undefined ? Number(input.costPrice) : Number(input.sellingPrice * 0.7),
      stockQuantity: Number(input.stockQuantity),
      lowStockThreshold: Number(input.lowStockThreshold || 5),
      coverImageUrl: input.coverImageUrl?.trim() || '',
      description: input.description?.trim() || '',
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Record initial stock movement if quantity > 0
    if (input.stockQuantity > 0) {
      await addDoc(collection(db, 'inventoryMovements'), {
        bookId: docRef.id,
        bookTitleSnapshot: input.title.trim(),
        movementType: 'initial',
        quantityChange: Number(input.stockQuantity),
        previousQuantity: 0,
        newQuantity: Number(input.stockQuantity),
        reason: 'Initial stock intake upon catalog registration',
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || 'Staff',
        createdAt: now,
      });
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBook(
  id: string,
  updates: Partial<CreateBookInput>,
  currentUser: { uid: string; displayName?: string }
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;

  if (updates.sellingPrice !== undefined && updates.sellingPrice < 0) {
    throw new Error('Selling price cannot be negative.');
  }
  if (updates.costPrice !== undefined && updates.costPrice < 0) {
    throw new Error('Cost price cannot be negative.');
  }
  if (updates.stockQuantity !== undefined && updates.stockQuantity < 0) {
    throw new Error('Stock quantity cannot be negative.');
  }

  if (updates.isbn && updates.isbn.trim()) {
    const exists = await checkIsbnExists(updates.isbn.trim(), id);
    if (exists) {
      throw new Error(`A book with ISBN "${updates.isbn.trim()}" already exists in the system.`);
    }
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.title) updateData.title = updates.title.trim();
    if (updates.author) updateData.author = updates.author.trim();
    if (updates.isbn !== undefined) updateData.isbn = updates.isbn.trim();

    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleBookStatus(id: string, active: boolean): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      active,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
