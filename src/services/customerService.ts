import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Customer, Sale } from '../types';

const COLLECTION_NAME = 'customers';

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export async function getCustomers(): Promise<Customer[]> {
  const path = COLLECTION_NAME;
  try {
    const collRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(collRef);
    const customers: Customer[] = [];
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      customers.push({
        id: docSnap.id,
        name: data.name || 'Unnamed Customer',
        phone: data.phone || '',
        email: data.email || '',
        notes: data.notes || '',
        totalPurchases: Number(data.totalPurchases || 0),
        totalSpent: Number(data.totalSpent || 0),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });

    return customers.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      totalPurchases: Number(data.totalPurchases || 0),
      totalSpent: Number(data.totalSpent || 0),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createCustomer(input: CreateCustomerInput): Promise<string> {
  const path = COLLECTION_NAME;

  if (!input.name || !input.name.trim()) {
    throw new Error('Customer name is required.');
  }

  if (input.email && input.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      throw new Error('Please provide a valid email address.');
    }
  }

  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: input.name.trim(),
      phone: input.phone?.trim() || '',
      email: input.email?.trim() || '',
      notes: input.notes?.trim() || '',
      totalPurchases: 0,
      totalSpent: 0,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCustomer(id: string, updates: Partial<CreateCustomerInput>): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;

  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error('Customer name cannot be empty.');
  }
  if (updates.email && updates.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updates.email.trim())) {
      throw new Error('Please provide a valid email address.');
    }
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getCustomerSales(customerId: string): Promise<Sale[]> {
  try {
    const salesColl = collection(db, 'sales');
    const snapshot = await getDocs(salesColl);
    const sales: Sale[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.customerId === customerId) {
        sales.push({
          id: docSnap.id,
          invoiceNumber: data.invoiceNumber,
          customerId: data.customerId,
          customerNameSnapshot: data.customerNameSnapshot,
          items: data.items || [],
          subtotal: Number(data.subtotal || 0),
          discount: Number(data.discount || 0),
          tax: Number(data.tax || 0),
          totalAmount: Number(data.totalAmount || 0),
          paymentMethod: data.paymentMethod || 'cash',
          paymentStatus: data.paymentStatus || 'completed',
          createdBy: data.createdBy,
          createdByName: data.createdByName || 'Staff',
          status: data.status || 'completed',
          createdAt: data.createdAt,
        });
      }
    });

    return sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching customer sales:', error);
    return [];
  }
}
