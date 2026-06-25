import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  Timestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Debt, Invoice } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test Firestore Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network.");
    }
  }
}
testConnection();

// Error Handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: localStorage.getItem(STORE_ACCOUNT_KEY),
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Store Account ID Persistence Helpers
const STORE_ACCOUNT_KEY = 'princess_store_account_id_v2';

export function getPersistedStoreAccountId(): string | null {
  return localStorage.getItem(STORE_ACCOUNT_KEY);
}

export function persistStoreAccountId(storeId: string) {
  // Normalize storeId to be safe for document IDs
  const cleanId = storeId.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
  localStorage.setItem(STORE_ACCOUNT_KEY, cleanId);
}

export function clearPersistedStoreAccountId() {
  localStorage.removeItem(STORE_ACCOUNT_KEY);
}

// REALTIME DEBTS SYNC
export function subscribeToDebts(
  storeId: string, 
  onUpdate: (debts: Debt[]) => void, 
  onError: (error: Error) => void
) {
  const debtsPath = `stores/${storeId}/debts`;
  const debtsCollection = collection(db, debtsPath);
  
  return onSnapshot(debtsCollection, (snapshot) => {
    const list: Debt[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Parse dates (either Firestore Timestamps or ISO strings)
      let createdAtStr = new Date().toISOString();
      let updatedAtStr = new Date().toISOString();
      
      if (data.createdAt) {
        if (data.createdAt instanceof Timestamp) {
          createdAtStr = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtStr = data.createdAt;
        } else if (data.createdAt.seconds) {
          createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString();
        }
      }
      if (data.updatedAt) {
        if (data.updatedAt instanceof Timestamp) {
          updatedAtStr = data.updatedAt.toDate().toISOString();
        } else if (typeof data.updatedAt === 'string') {
          updatedAtStr = data.updatedAt;
        } else if (data.updatedAt.seconds) {
          updatedAtStr = new Date(data.updatedAt.seconds * 1000).toISOString();
        }
      }

      list.push({
        id: docSnap.id,
        customerName: data.customerName || '',
        amount: Number(data.amount) || 0,
        notes: data.notes || '',
        createdAt: createdAtStr,
        updatedAt: updatedAtStr,
      });
    });
    
    // Sort debts by updated date descending
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, debtsPath);
    onError(error);
  });
}

// ADD/UPDATE DEBT
export async function saveDebt(storeId: string, debt: Omit<Debt, 'createdAt' | 'updatedAt'> & { createdAt?: string }) {
  const debtsPath = `stores/${storeId}/debts`;
  const docRef = doc(db, debtsPath, debt.id);
  
  const payload: any = {
    id: debt.id,
    customerName: debt.customerName,
    amount: debt.amount,
    notes: debt.notes || '',
    updatedAt: Timestamp.now(),
  };

  if (debt.createdAt) {
    payload.createdAt = Timestamp.fromDate(new Date(debt.createdAt));
  } else {
    payload.createdAt = Timestamp.now();
  }

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${debtsPath}/${debt.id}`);
  }
}

// DELETE DEBT
export async function deleteDebt(storeId: string, debtId: string) {
  const debtsPath = `stores/${storeId}/debts`;
  const docRef = doc(db, debtsPath, debtId);
  
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${debtsPath}/${debtId}`);
  }
}

// REALTIME INVOICES SYNC
export function subscribeToInvoices(
  storeId: string,
  onUpdate: (invoices: Invoice[]) => void,
  onError: (error: Error) => void
) {
  const invoicesPath = `stores/${storeId}/invoices`;
  const invoicesCollection = collection(db, invoicesPath);

  return onSnapshot(invoicesCollection, (snapshot) => {
    const list: Invoice[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      let createdAtStr = new Date().toISOString();
      let updatedAtStr = new Date().toISOString();

      if (data.createdAt) {
        if (data.createdAt instanceof Timestamp) {
          createdAtStr = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtStr = data.createdAt;
        } else if (data.createdAt.seconds) {
          createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString();
        }
      }
      if (data.updatedAt) {
        if (data.updatedAt instanceof Timestamp) {
          updatedAtStr = data.updatedAt.toDate().toISOString();
        } else if (typeof data.updatedAt === 'string') {
          updatedAtStr = data.updatedAt;
        } else if (data.updatedAt.seconds) {
          updatedAtStr = new Date(data.updatedAt.seconds * 1000).toISOString();
        }
      }

      list.push({
        id: docSnap.id,
        customerName: data.customerName || '',
        items: data.items || [],
        totalCost: Number(data.totalCost) || 0,
        totalSelling: Number(data.totalSelling) || 0,
        totalProfit: Number(data.totalProfit) || 0,
        amountPaid: Number(data.amountPaid) || 0,
        paymentStatus: data.paymentStatus || 'fully_paid',
        notes: data.notes || '',
        shopName: data.shopName || '',
        shopPhone: data.shopPhone || '',
        createdAt: createdAtStr,
        updatedAt: updatedAtStr,
      });
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, invoicesPath);
    onError(error);
  });
}

// ADD/UPDATE INVOICE
export async function saveInvoice(storeId: string, invoice: Omit<Invoice, 'createdAt' | 'updatedAt'> & { createdAt?: string }) {
  const invoicesPath = `stores/${storeId}/invoices`;
  const docRef = doc(db, invoicesPath, invoice.id);

  const payload: any = {
    id: invoice.id,
    customerName: invoice.customerName,
    items: invoice.items,
    totalCost: invoice.totalCost,
    totalSelling: invoice.totalSelling,
    totalProfit: invoice.totalProfit,
    amountPaid: invoice.amountPaid,
    paymentStatus: invoice.paymentStatus,
    notes: invoice.notes || '',
    shopName: invoice.shopName || '',
    shopPhone: invoice.shopPhone || '',
    updatedAt: Timestamp.now(),
  };

  if (invoice.createdAt) {
    payload.createdAt = Timestamp.fromDate(new Date(invoice.createdAt));
  } else {
    payload.createdAt = Timestamp.now();
  }

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${invoicesPath}/${invoice.id}`);
  }
}

// DELETE INVOICE
export async function deleteInvoice(storeId: string, invoiceId: string) {
  const invoicesPath = `stores/${storeId}/invoices`;
  const docRef = doc(db, invoicesPath, invoiceId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${invoicesPath}/${invoiceId}`);
  }
}

