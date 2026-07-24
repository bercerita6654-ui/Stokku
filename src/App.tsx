import React, { useState, useEffect, useCallback } from 'react';
import { Product, Transaction, SyncStatus, TransactionType } from './types';
import { 
  getStoredProducts, 
  getStoredTransactions, 
  getStoredSyncStatus, 
  saveSyncStatus, 
  mergeSpreadsheetProducts, 
  getStoredSheetUrl,
  fetchSpreadsheetProductsDirectly,
  saveProducts,
  saveTransactions
} from './lib/storage';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ProductCatalog } from './components/ProductCatalog';
import { TransactionForm } from './components/TransactionForm';
import { TransactionHistory } from './components/TransactionHistory';
import { SettingsModal } from './components/SettingsModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { 
  auth, 
  loginWithGoogle, 
  logoutFirebase, 
  onAuthStateChanged, 
  subscribeToCloudProducts,
  subscribeToCloudTransactions,
  User 
} from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'transaction' | 'history' | 'settings'>('dashboard');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getStoredSyncStatus());

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Fast Transaction state
  const [transactionType, setTransactionType] = useState<TransactionType>('MASUK');
  const [selectedProductForTrx, setSelectedProductForTrx] = useState<Product | null>(null);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginGoogle = async () => {
    setIsAuthenticating(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        alert(`Gagal login dengan Google: ${err.message || 'Terjadi kesalahan'}`);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await logoutFirebase();
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Load local storage data and subscribe to real-time Cloud Sync across devices
  useEffect(() => {
    const loadedProds = getStoredProducts();
    const loadedTrxs = getStoredTransactions();
    setProducts(loadedProds);
    setTransactions(loadedTrxs);

    // Real-time Firestore Cloud listener for Products across all devices
    const unsubCloudProducts = subscribeToCloudProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        try {
          localStorage.setItem('stokku_products_v1', JSON.stringify(cloudProducts));
        } catch (e) {}
      }
    });

    // Real-time Firestore Cloud listener for Transactions across all devices
    const unsubCloudTransactions = subscribeToCloudTransactions((cloudTransactions) => {
      if (cloudTransactions && cloudTransactions.length > 0) {
        setTransactions(cloudTransactions);
        try {
          localStorage.setItem('stokku_transactions_v1', JSON.stringify(cloudTransactions));
        } catch (e) {}
      }
    });

    // Sync with Google Sheets automatically on load
    handleSyncSpreadsheet();

    return () => {
      unsubCloudProducts();
      unsubCloudTransactions();
    };
  }, []);

  // Sync spreadsheet from backend API or directly from browser (for GitHub Pages/static hosting)
  const handleSyncSpreadsheet = useCallback(async (customUrl?: string) => {
    const targetUrl = customUrl || getStoredSheetUrl();

    setSyncStatus((prev) => {
      const next: SyncStatus = {
        ...prev,
        status: 'syncing',
        sheetUrl: targetUrl,
        errorMessage: undefined
      };
      saveSyncStatus(next);
      return next;
    });

    try {
      let fetchedProducts: any[] = [];

      // 1. First try backend proxy /api/sync-csv (if Node server is running)
      try {
        const res = await fetch('/api/sync-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.products)) {
            fetchedProducts = data.products;
          }
          if (data && data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
            setTransactions(data.transactions);
            saveTransactions(data.transactions);
          }
        }
      } catch (e) {
        console.info('Backend /api/sync-csv unreachable, switching to direct client-side Google Sheet fetch...');
      }

      // 2. If backend proxy wasn't used or returned no products (e.g. static site on GitHub Pages / Vercel), fetch directly in browser
      if (!fetchedProducts || fetchedProducts.length === 0) {
        fetchedProducts = await fetchSpreadsheetProductsDirectly(targetUrl);
      }

      // Merge fetched products with local state
      const merged = mergeSpreadsheetProducts(fetchedProducts || []);
      setProducts(merged);

      const successStatus: SyncStatus = {
        lastSynced: new Date().toISOString(),
        status: 'success',
        totalSynced: merged.length,
        sheetUrl: targetUrl
      };
      setSyncStatus(successStatus);
      saveSyncStatus(successStatus);
    } catch (err: any) {
      console.error('Spreadsheet sync error:', err);
      const errorStatus: SyncStatus = {
        lastSynced: getStoredSyncStatus().lastSynced,
        status: 'error',
        errorMessage: err.message || 'Gagal terhubung ke Google Spreadsheet. Pastikan Spreadsheet publik (Siapa saja yang memiliki link).',
        sheetUrl: targetUrl
      };
      setSyncStatus(errorStatus);
      saveSyncStatus(errorStatus);
    }
  }, []);

  // Reload products & transactions when changed
  const refreshData = () => {
    setProducts(getStoredProducts());
    setTransactions(getStoredTransactions());
  };

  // Handle navigation with options
  const handleNavigate = (
    tab: 'dashboard' | 'catalog' | 'transaction' | 'history' | 'settings',
    options?: { type?: TransactionType; product?: Product }
  ) => {
    if (options?.type) setTransactionType(options.type);
    if (options?.product) setSelectedProductForTrx(options.product);
    else setSelectedProductForTrx(null);

    setActiveTab(tab);
  };

  // Fast transaction helper
  const handleFastTransaction = (product: Product, type: TransactionType) => {
    setTransactionType(type);
    setSelectedProductForTrx(product);
    setActiveTab('transaction');
  };

  // Clear all data
  const handleClearAllData = () => {
    localStorage.clear();
    setProducts([]);
    setTransactions([]);
    handleSyncSpreadsheet();
  };

  return (
    <div className="min-h-screen bg-zinc-50/90 text-zinc-900 font-sans antialiased flex flex-col">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncStatus={syncStatus}
        onSyncNow={() => handleSyncSpreadsheet()}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
        isAuthenticating={isAuthenticating}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            products={products}
            transactions={transactions}
            onNavigate={handleNavigate}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSyncNow={() => handleSyncSpreadsheet()}
            isSyncing={syncStatus.status === 'syncing'}
            onClearTransactions={() => {
              saveTransactions([]);
              refreshData();
            }}
          />
        )}

        {activeTab === 'catalog' && (
          <ProductCatalog
            products={products}
            onProductsUpdated={(updated) => setProducts(updated)}
            onFastTransaction={handleFastTransaction}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {activeTab === 'transaction' && (
          <TransactionForm
            products={products}
            initialType={transactionType}
            initialProduct={selectedProductForTrx}
            onTransactionSaved={refreshData}
            onOpenScanner={() => setIsScannerOpen(true)}
            scannedBarcode={scannedBarcode}
            onClearScannedBarcode={() => setScannedBarcode(null)}
            currentUser={currentUser}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistory transactions={transactions} onRefreshData={refreshData} />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            syncStatus={syncStatus}
            onTriggerSync={(url) => handleSyncSpreadsheet(url)}
            onClearAllData={handleClearAllData}
            currentUser={currentUser}
            onLoginGoogle={handleLoginGoogle}
            onLogoutGoogle={handleLogoutGoogle}
            isAuthenticating={isAuthenticating}
          />
        )}
      </main>

      {/* Barcode Camera Scanner Overlay Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setScannedBarcode(code);
          setActiveTab('transaction');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} StokKu - Aplikasi Pendataan Produk Masuk & Terjual</p>
          <p className="text-[11px] text-zinc-400">
            Terhubung Langsung dengan Google Spreadsheet
          </p>
        </div>
      </footer>
    </div>
  );
}
