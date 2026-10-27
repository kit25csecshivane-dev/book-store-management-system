import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { StoreSettings } from '../types';

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'KitabKhana Book Haven & Readers Lounge',
  address: 'Shop 14, College Road, Heritage Square, Pune, Maharashtra 411005',
  phone: '+91 98765 43210',
  email: 'info@kitabkhanabookstore.in',
  defaultLowStockThreshold: 5,
  receiptFooterMessage: 'Thank you for shopping at KitabKhana! Books feed the mind. Keep reading!',
  taxPercentage: 0,
  supportedPaymentMethods: ['cash', 'upi'],
  currency: '₹',
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const path = 'storeSettings/config';
  try {
    const docRef = doc(db, 'storeSettings', 'config');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { ...DEFAULT_SETTINGS, ...snapshot.data() } as StoreSettings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.warn('Could not read store settings from Firestore, returning defaults:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  const path = 'storeSettings/config';
  try {
    const docRef = doc(db, 'storeSettings', 'config');
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
