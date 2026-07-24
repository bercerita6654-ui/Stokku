import { Product, Transaction, SyncStatus } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'stokku_products_v1',
  TRANSACTIONS: 'stokku_transactions_v1',
  SYNC_STATUS: 'stokku_sync_status_v1',
  SHEET_URL: 'stokku_sheet_url_v1',
  APPS_SCRIPT_URL: 'stokku_apps_script_url_v1',
  OPERATOR: 'stokku_operator_v1'
};

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1MKWMahA8GArLnFQH01wYNqKOoXjfG9qYnFYP-2nurC8/export?format=csv&gid=638369466';
export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxW1SRfxnEQ88ximFcs7kNJhreteT7MzCcxATYgTZ7NM5UGlsGeQFcA-rWjCeC5VTI/exec';

export function normalizeGoogleSheetCsvUrl(url: string): string {
  if (!url) return DEFAULT_SHEET_URL;
  const trimmed = url.trim();

  if (!trimmed.includes('docs.google.com/spreadsheets/d/')) {
    return trimmed;
  }

  // Handle published web sheet
  if (trimmed.includes('/spreadsheets/d/e/')) {
    if (!trimmed.includes('output=csv')) {
      return trimmed.includes('?') ? `${trimmed}&output=csv` : `${trimmed}?output=csv`;
    }
    return trimmed;
  }

  // Handle direct Google Spreadsheet edit / view / share link
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    const spreadsheetId = idMatch[1];
    let gid = '';
    const gidMatch = trimmed.match(/[?&]gid=([0-9]+)/) || trimmed.match(/#gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
  }

  return trimmed;
}

export function getStoredSheetUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_SHEET_URL;
  const stored = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
  if (!stored || stored.includes('/2PACX-1vSXSy8WDlm3ijk4oZqwkOCqtUET6N7BOPWhRHtDocecqSNgcKWZdlY77h6A0IoEe-ykHMPEUy-3KZ3y/')) {
    return DEFAULT_SHEET_URL;
  }
  return normalizeGoogleSheetCsvUrl(stored);
}

export function saveSheetUrl(url: string): void {
  const normalized = normalizeGoogleSheetCsvUrl(url);
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, normalized || DEFAULT_SHEET_URL);
}

export function getStoredAppsScriptUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_APPS_SCRIPT_URL;
  return localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL) || DEFAULT_APPS_SCRIPT_URL;
}

export function saveAppsScriptUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, url.trim() || DEFAULT_APPS_SCRIPT_URL);
}

/**
 * Automatically sends transaction data to Google Apps Script Web App
 */
export async function sendTransactionToGoogleSheet(transaction: Transaction): Promise<{ success: boolean; message?: string }> {
  const appsScriptUrl = getStoredAppsScriptUrl();
  if (!appsScriptUrl) {
    return { success: false, message: 'URL Apps Script belum diisi' };
  }

  try {
    const res = await fetch('/api/sync-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appsScriptUrl,
        payload: transaction
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: 'Berhasil dikirim ke sheet Update Stock' };
    } else {
      return { success: false, message: data.error || 'Gagal mengirim ke Apps Script' };
    }
  } catch (err: any) {
    console.error('Failed to auto sync transaction to Apps Script:', err);
    return { success: false, message: err.message || 'Gagal koneksi ke server' };
  }
}

export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) return [];
    const parsed: Product[] = JSON.parse(data);
    return parsed.map((p) => ({
      ...p,
      photoUrl: formatPhotoUrl(p.photoUrl)
    }));
  } catch (e) {
    console.error('Error reading products from localStorage:', e);
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage:', e);
  }
}

export function getStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading transactions from localStorage:', e);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions to localStorage:', e);
  }
}

export function getStoredSyncStatus(): SyncStatus {
  if (typeof window === 'undefined') {
    return {
      lastSynced: null,
      status: 'idle',
      sheetUrl: DEFAULT_SHEET_URL
    };
  }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading sync status:', e);
  }
  return {
    lastSynced: null,
    status: 'idle',
    sheetUrl: getStoredSheetUrl()
  };
}

export function saveSyncStatus(status: SyncStatus): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
  } catch (e) {
    console.error('Error saving sync status:', e);
  }
}

export function getStoredOperator(): string {
  if (typeof window === 'undefined') return 'Admin Stok';
  return localStorage.getItem(STORAGE_KEYS.OPERATOR) || 'Admin Stok';
}

export function saveStoredOperator(name: string): void {
  localStorage.setItem(STORAGE_KEYS.OPERATOR, name || 'Admin Stok');
}

/**
 * Formats a photo URL or Google Drive file ID into a valid image URL.
 */
export function formatPhotoUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // 1. Google Drive URLs
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                         trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
                         trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  // 2. Direct Google Drive File ID (alphanumeric string without protocols/slashes)
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
    if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
      return `https://lh3.googleusercontent.com/d/${trimmed}`;
    }
  }

  return trimmed;
}

/**
 * Merge raw products fetched from Spreadsheet with existing stored products.
 * Keeps existing stock counts, prices, and categories if available.
 */
export function mergeSpreadsheetProducts(fetchedRows: Array<{
  id: string;
  barcode1: string;
  barcode2: string;
  photoUrl: string;
  name: string;
}>): Product[] {
  const existingProducts = getStoredProducts();
  const existingByBarcodeMap = new Map<string, Product>();

  existingProducts.forEach((p) => {
    if (p.barcode1) existingByBarcodeMap.set(p.barcode1.trim().toLowerCase(), p);
    if (p.barcode2) existingByBarcodeMap.set(p.barcode2.trim().toLowerCase(), p);
    if (p.name) existingByBarcodeMap.set(`name_${p.name.trim().toLowerCase()}`, p);
  });

  const mergedProducts: Product[] = [];
  const processedKeys = new Set<string>();

  fetchedRows.forEach((fetched) => {
    const b1Key = fetched.barcode1 ? fetched.barcode1.trim().toLowerCase() : '';
    const b2Key = fetched.barcode2 ? fetched.barcode2.trim().toLowerCase() : '';
    const nameKey = fetched.name ? `name_${fetched.name.trim().toLowerCase()}` : '';

    let matched: Product | undefined = undefined;
    if (b1Key && existingByBarcodeMap.has(b1Key)) matched = existingByBarcodeMap.get(b1Key);
    else if (b2Key && existingByBarcodeMap.has(b2Key)) matched = existingByBarcodeMap.get(b2Key);
    else if (nameKey && existingByBarcodeMap.has(nameKey)) matched = existingByBarcodeMap.get(nameKey);

    const barcode1 = fetched.barcode1 || (matched ? matched.barcode1 : '');
    const barcode2 = fetched.barcode2 || (matched ? matched.barcode2 : '');
    const keyId = barcode1 || barcode2 || fetched.name || fetched.id;

    if (processedKeys.has(keyId)) return;
    processedKeys.add(keyId);

    const formattedPhoto = formatPhotoUrl(fetched.photoUrl) || formatPhotoUrl(matched ? matched.photoUrl : '');

    if (matched) {
      mergedProducts.push({
        ...matched,
        name: fetched.name || matched.name,
        barcode1: barcode1,
        barcode2: barcode2,
        photoUrl: formattedPhoto,
        updatedAt: new Date().toISOString()
      });
    } else {
      mergedProducts.push({
        id: fetched.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        barcode1: barcode1,
        barcode2: barcode2,
        photoUrl: formattedPhoto,
        name: fetched.name,
        category: 'Umum',
        stock: 0,
        minStock: 5,
        price: 0,
        costPrice: 0,
        unit: 'Pcs',
        updatedAt: new Date().toISOString()
      });
    }
  });

  saveProducts(mergedProducts);
  return mergedProducts;
}

/**
 * Executes a transaction (MASUK or TERJUAL) and updates product stock in storage.
 */
export function recordTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const currentProducts = getStoredProducts();
  const productMap = new Map(currentProducts.map((p) => [p.id, { ...p }]));

  transactionData.items.forEach((item) => {
    const prod = productMap.get(item.productId);
    if (prod) {
      if (transactionData.type === 'MASUK') {
        prod.stock += item.quantity;
      } else if (transactionData.type === 'TERJUAL') {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
      prod.updatedAt = new Date().toISOString();
    }
  });

  const updatedProductsList = Array.from(productMap.values());
  saveProducts(updatedProductsList);

  const newTransaction: Transaction = {
    ...transactionData,
    id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  const currentTransactions = getStoredTransactions();
  const updatedTransactions = [newTransaction, ...currentTransactions];
  saveTransactions(updatedTransactions);

  // Automatically push transaction to Google Apps Script Web App if configured
  sendTransactionToGoogleSheet(newTransaction);

  return newTransaction;
}

/**
 * Deletes a transaction and reverts its impact on product stock.
 */
export function deleteTransaction(transactionId: string): void {
  const currentTransactions = getStoredTransactions();
  const txToDelete = currentTransactions.find((t) => t.id === transactionId);
  if (!txToDelete) return;

  const currentProducts = getStoredProducts();
  const productMap = new Map(currentProducts.map((p) => [p.id, { ...p }]));

  // Revert stock changes
  txToDelete.items.forEach((item) => {
    const prod = productMap.get(item.productId);
    if (prod) {
      if (txToDelete.type === 'MASUK') {
        // Was added, so subtract it back
        prod.stock = Math.max(0, prod.stock - item.quantity);
      } else if (txToDelete.type === 'TERJUAL') {
        // Was sold/deducted, so add it back
        prod.stock += item.quantity;
      }
      prod.updatedAt = new Date().toISOString();
    }
  });

  saveProducts(Array.from(productMap.values()));

  const updatedTransactions = currentTransactions.filter((t) => t.id !== transactionId);
  saveTransactions(updatedTransactions);
}

/**
 * Updates an existing transaction and adjusts product stock accordingly.
 */
export function updateTransaction(updatedTx: Transaction): void {
  const currentTransactions = getStoredTransactions();
  const oldTxIndex = currentTransactions.findIndex((t) => t.id === updatedTx.id);
  if (oldTxIndex === -1) return;

  const oldTx = currentTransactions[oldTxIndex];
  const currentProducts = getStoredProducts();
  const productMap = new Map(currentProducts.map((p) => [p.id, { ...p }]));

  // 1. Revert old transaction stock
  oldTx.items.forEach((item) => {
    const prod = productMap.get(item.productId);
    if (prod) {
      if (oldTx.type === 'MASUK') {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      } else if (oldTx.type === 'TERJUAL') {
        prod.stock += item.quantity;
      }
    }
  });

  // 2. Apply new transaction stock
  updatedTx.items.forEach((item) => {
    const prod = productMap.get(item.productId);
    if (prod) {
      if (updatedTx.type === 'MASUK') {
        prod.stock += item.quantity;
      } else if (updatedTx.type === 'TERJUAL') {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
      prod.updatedAt = new Date().toISOString();
    }
  });

  saveProducts(Array.from(productMap.values()));

  // 3. Save updated transaction list
  currentTransactions[oldTxIndex] = {
    ...updatedTx,
    totalQuantity: updatedTx.items.reduce((acc, i) => acc + i.quantity, 0),
    totalItems: updatedTx.items.length
  };
  saveTransactions(currentTransactions);

  // Send update notice to Apps Script if configured
  sendTransactionToGoogleSheet({
    ...updatedTx,
    note: `[REVISI EDIT] ${updatedTx.note}`
  });
}

/**
 * Clears all transaction history records from local storage.
 */
export function clearAllTransactions(): void {
  saveTransactions([]);
}

/**
 * Deletes a product from local storage.
 */
export function deleteProduct(productId: string): Product[] {
  const currentProducts = getStoredProducts();
  const updated = currentProducts.filter((p) => p.id !== productId);
  saveProducts(updated);
  return updated;
}

/**
 * Finds a product matching a barcode (either barcode1 or barcode2)
 */
export function findProductByBarcode(products: Product[], barcodeQuery: string): Product | undefined {
  if (!barcodeQuery) return undefined;
  const cleanQuery = barcodeQuery.trim().toLowerCase();
  
  return products.find(
    (p) =>
      p.barcode1.trim().toLowerCase() === cleanQuery ||
      p.barcode2.trim().toLowerCase() === cleanQuery
  );
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDateIndonesian(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return dateString;
  }
}
