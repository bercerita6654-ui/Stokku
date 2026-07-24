import { Product, Transaction, SyncStatus } from '../types';
import Papa from 'papaparse';

const STORAGE_KEYS = {
  PRODUCTS: 'stokku_products_v1',
  TRANSACTIONS: 'stokku_transactions_v1',
  SYNC_STATUS: 'stokku_sync_status_v1',
  SHEET_URL: 'stokku_sheet_url_v1',
  APPS_SCRIPT_URL: 'stokku_apps_script_url_v1',
  OPERATOR: 'stokku_operator_v1'
};

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1MKWMahA8GArLnFQH01wYNqKOoXjfG9qYnFYP-2nurC8/edit?gid=638369466#gid=638369466';
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
  if (!stored || stored.includes('/2PACX-1vSXSy8WDlm3ijk4oZqwkOCqtUET6N7BOPWhRHtDocecqSNgcKWZdlY77h6A0IoEe-ykHMPEUy-3KZ3y/') || stored.includes('410498483')) {
    return DEFAULT_SHEET_URL;
  }
  return normalizeGoogleSheetCsvUrl(stored);
}

export function saveSheetUrl(url: string): void {
  const normalized = normalizeGoogleSheetCsvUrl(url);
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, normalized || DEFAULT_SHEET_URL);
}

/**
 * Direct browser client-side fetch & parse of Google Spreadsheet CSV.
 * Allows syncing even when deployed as a static site on GitHub Pages / Vercel without a backend.
 */
export async function fetchSpreadsheetProductsDirectly(rawUrl: string): Promise<Array<{
  id: string;
  barcode1: string;
  barcode2: string;
  photoUrl: string;
  name: string;
  price?: number;
  category?: string;
}>> {
  const candidates: string[] = [];
  const primaryUrl = normalizeGoogleSheetCsvUrl(rawUrl);
  candidates.push(primaryUrl);

  const idMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    const spreadsheetId = idMatch[1];
    let gid = '';
    const gidMatch = rawUrl.match(/[?&]gid=([0-9]+)/) || rawUrl.match(/#gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`;
    if (!candidates.includes(gvizUrl)) {
      candidates.push(gvizUrl);
    }
  }

  let csvText = '';
  let lastError = '';

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      if (!res.ok) {
        lastError = `HTTP ${res.status}: ${res.statusText}`;
        continue;
      }
      const text = await res.text();
      const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('google-site-verification');
      if (isHtml) {
        lastError = "Spreadsheet mengembalikan halaman HTML. Pastikan akses Google Sheet diatur ke 'Siapa saja yang memiliki link' (Anyone with link).";
        continue;
      }
      csvText = text;
      break;
    } catch (e: any) {
      lastError = e.message || 'Gagal koneksi langsung ke Google Sheet';
    }
  }

  if (!csvText) {
    throw new Error(lastError || "Gagal mengakses Google Spreadsheet. Pastikan Spreadsheet publik ('Siapa saja yang memiliki link').");
  }

  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
    header: false
  });

  const rawRows = parsed.data;
  if (!rawRows || rawRows.length === 0) {
    return [];
  }

  // Dynamic Column Header Detection
  let barcode1Idx = -1;
  let barcode2Idx = -1;
  let photoUrlIdx = -1;
  let nameIdx = -1;
  let priceIdx = -1;
  let categoryIdx = -1;
  let stockIdx = -1;

  let startIdx = 0;
  const firstRow = rawRows[0];
  if (firstRow && firstRow.length > 0) {
    let matchedHeaderCount = 0;
    firstRow.forEach((colStr, idx) => {
      const col = (colStr || '').toLowerCase().trim();
      if (col.includes('barcode pg') || col.includes('barcode 1') || col.includes('kode 1') || (col === 'barcode' && barcode1Idx === -1)) {
        barcode1Idx = idx;
        matchedHeaderCount++;
      } else if (col.includes('barcode gl') || col.includes('barcode 2') || col.includes('kode 2') || col.includes('ean')) {
        barcode2Idx = idx;
        matchedHeaderCount++;
      } else if (col.includes('foto') || col.includes('link') || col.includes('gambar') || col.includes('image')) {
        if (photoUrlIdx === -1) photoUrlIdx = idx;
        matchedHeaderCount++;
      } else if (col.includes('nama') || col.includes('product') || col.includes('item') || col.includes('barang')) {
        if (nameIdx === -1) nameIdx = idx;
        matchedHeaderCount++;
      } else if (col.includes('harga pg') || col === 'harga' || (col.includes('harga') && priceIdx === -1)) {
        priceIdx = idx;
        matchedHeaderCount++;
      } else if (col.includes('kategori') || col.includes('category') || col.includes('tipe')) {
        categoryIdx = idx;
        matchedHeaderCount++;
      } else if (col.includes('stok') || col.includes('stock') || col.includes('qty')) {
        stockIdx = idx;
        matchedHeaderCount++;
      }
    });

    if (matchedHeaderCount >= 2) {
      startIdx = 1;
    }
  }

  if (barcode1Idx === -1) barcode1Idx = 0;
  if (barcode2Idx === -1) barcode2Idx = 1;
  if (photoUrlIdx === -1) photoUrlIdx = 2;
  if (nameIdx === -1) nameIdx = 3;
  if (priceIdx === -1) priceIdx = 4;

  const products: Array<{
    id: string;
    barcode1: string;
    barcode2: string;
    photoUrl: string;
    name: string;
    price?: number;
    category?: string;
  }> = [];

  for (let i = startIdx; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const barcode1 = (row[barcode1Idx] || '').trim();
    const barcode2 = (row[barcode2Idx] || '').trim();
    const photoUrlRaw = (row[photoUrlIdx] || '').trim();
    const name = (row[nameIdx] || '').trim();

    const priceStr = priceIdx >= 0 && row[priceIdx] ? (row[priceIdx] || '').replace(/[^0-9]/g, '') : '';
    let parsedPrice = priceStr ? parseInt(priceStr, 10) : 0;
    if (parsedPrice > 0 && parsedPrice < 1000) {
      parsedPrice = parsedPrice * 1000;
    }

    let category = categoryIdx >= 0 && row[categoryIdx] ? (row[categoryIdx] || '').trim() : '';
    if (!category && name) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('pb') || lowerName.includes('powerbank') || lowerName.includes('power bank') || lowerName.includes('power depot') || lowerName.includes('powertiny') || lowerName.includes('sleekvolt') || lowerName.includes('magipi') || lowerName.includes('powermag') || lowerName.includes('glamvolt') || lowerName.includes('mini pix') || lowerName.includes('sunny power') || lowerName.includes('bolt') || lowerName.includes('mah')) {
        category = 'Powerbank';
      } else if (lowerName.includes('cable') || lowerName.includes('kabel') || lowerName.includes('type-c') || lowerName.includes('lightning') || lowerName.includes('braided') || lowerName.includes('magloop') || lowerName.includes('ice link')) {
        category = 'Kabel Data';
      } else if (lowerName.includes('earphone') || lowerName.includes('earbuds') || lowerName.includes('headphone') || lowerName.includes('headset') || lowerName.includes('audio') || lowerName.includes('stereo')) {
        category = 'Earphone';
      } else if (lowerName.includes('charger') || lowerName.includes('gan') || lowerName.includes('adapter') || lowerName.includes('wall charger')) {
        category = 'Charger';
      } else {
        category = 'Aksesori';
      }
    }

    if (!barcode1 && !barcode2 && !name) continue;

    products.push({
      id: `prod_${i}_${barcode1 || barcode2 || Math.random().toString(36).substring(2, 6)}`,
      barcode1,
      barcode2,
      photoUrl: formatPhotoUrl(photoUrlRaw),
      name,
      price: parsedPrice,
      category
    });
  }

  return products;
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
    return { success: false, message: 'URL Web App Apps Script belum diatur' };
  }

  // 1. Coba lewat backend proxy server (jika tersedia)
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

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return { success: true, message: 'Berhasil dikirim ke Google Sheet' };
      }
    }
  } catch (err) {
    console.info('Backend proxy /api/sync-transaction tidak tersedia, menggunakan fetch browser langsung...');
  }

  // 2. Fallback kirim langsung dari browser peramban (cocok untuk GitHub Pages / Static hosting)
  try {
    await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(transaction)
    });
    return { success: true, message: 'Transaksi berhasil dikirim langsung ke Google Sheet' };
  } catch (directErr: any) {
    console.error('Gagal mengirim transaksi ke Google Sheet:', directErr);
    return { success: false, message: directErr.message || 'Gagal koneksi ke Google Apps Script' };
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
  price?: number;
  category?: string;
  stock?: number;
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
        price: (fetched.price !== undefined && fetched.price > 0) ? fetched.price : matched.price,
        category: (fetched.category && fetched.category.trim()) ? fetched.category : matched.category,
        stock: (fetched.stock !== undefined && fetched.stock >= 0) ? fetched.stock : matched.stock,
        updatedAt: new Date().toISOString()
      });
    } else {
      mergedProducts.push({
        id: fetched.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        barcode1: barcode1,
        barcode2: barcode2,
        photoUrl: formattedPhoto,
        name: fetched.name,
        category: (fetched.category && fetched.category.trim()) ? fetched.category : 'Umum',
        stock: (fetched.stock !== undefined && fetched.stock >= 0) ? fetched.stock : 0,
        minStock: 5,
        price: fetched.price || 0,
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
