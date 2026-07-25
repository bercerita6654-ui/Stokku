import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { Product, Transaction } from '../types';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(
  app,
  config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? config.firestoreDatabaseId
    : undefined
);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const logoutFirebase = async () => {
  return await signOut(auth);
};

export { onAuthStateChanged };
export type { User };

// Firestore collection names
const PRODUCTS_COLLECTION = 'products';
const TRANSACTIONS_COLLECTION = 'transactions';

/**
 * Save products batch to Firestore cloud database
 */
export async function syncProductsToCloud(products: Product[]): Promise<void> {
  if (!products || products.length === 0) return;
  try {
    // Firestore batch limit is 500 writes
    const CHUNK_SIZE = 450;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((product) => {
        if (!product.id) return;
        const ref = doc(db, PRODUCTS_COLLECTION, product.id);
        batch.set(ref, product, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore syncProductsToCloud error:', err);
  }
}

/**
 * Delete single product from Firestore cloud database
 */
export async function deleteProductFromCloud(productId: string): Promise<void> {
  try {
    const ref = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Firestore deleteProductFromCloud error:', err);
  }
}

/**
 * Save transactions batch to Firestore cloud database
 */
export async function syncTransactionsToCloud(transactions: Transaction[]): Promise<void> {
  if (!transactions || transactions.length === 0) return;
  try {
    const CHUNK_SIZE = 450;
    for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
      const chunk = transactions.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((tx) => {
        if (!tx.id) return;
        const ref = doc(db, TRANSACTIONS_COLLECTION, tx.id);
        batch.set(ref, tx, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore syncTransactionsToCloud error:', err);
  }
}

/**
 * Save single transaction to Firestore cloud database
 */
export async function saveSingleTransactionToCloud(tx: Transaction): Promise<void> {
  try {
    const ref = doc(db, TRANSACTIONS_COLLECTION, tx.id);
    await setDoc(ref, tx, { merge: true });
  } catch (err) {
    console.warn('Firestore saveSingleTransactionToCloud error:', err);
  }
}

/**
 * Delete single transaction from Firestore cloud database
 */
export async function deleteTransactionFromCloud(txId: string): Promise<void> {
  try {
    const ref = doc(db, TRANSACTIONS_COLLECTION, txId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Firestore deleteTransactionFromCloud error:', err);
  }
}

/**
 * Subscribe to real-time Cloud Products updates across devices
 */
export function subscribeToCloudProducts(onUpdate: (products: Product[]) => void) {
  const q = query(collection(db, PRODUCTS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Product);
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (error) => {
      console.warn('Cloud Products subscription listener error:', error);
    }
  );
}

/**
 * Subscribe to real-time Cloud Transactions updates across devices
 */
export function subscribeToCloudTransactions(onUpdate: (transactions: Transaction[]) => void) {
  const q = query(collection(db, TRANSACTIONS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Transaction);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (error) => {
      console.warn('Cloud Transactions subscription listener error:', error);
    }
  );
}
