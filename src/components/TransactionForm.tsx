import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scan, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Barcode, 
  Package, 
  FileText, 
  User, 
  Sparkles,
  AlertCircle,
  X
} from 'lucide-react';
import { Product, TransactionType, TransactionItem } from '../types';
import { findProductByBarcode, recordTransaction, getStoredOperator, saveStoredOperator, formatPhotoUrl } from '../lib/storage';
import { User as FirebaseUser } from '../lib/firebase';
import { TransactionSuccessModal, SavedTransactionDetails } from './TransactionSuccessModal';

interface TransactionFormProps {
  products: Product[];
  initialType?: TransactionType;
  initialProduct?: Product | null;
  onTransactionSaved: () => void;
  onOpenScanner: () => void;
  scannedBarcode?: string | null;
  onClearScannedBarcode?: () => void;
  currentUser?: FirebaseUser | null;
  onNavigateToHistory?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  products,
  initialType = 'MASUK',
  initialProduct,
  onTransactionSaved,
  onOpenScanner,
  scannedBarcode,
  onClearScannedBarcode,
  currentUser,
  onNavigateToHistory
}) => {
  const [trxType, setTrxType] = useState<TransactionType>(initialType);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cartItems, setCartItems] = useState<TransactionItem[]>([]);
  const [note, setNote] = useState('');
  const [operator, setOperator] = useState(
    currentUser?.displayName || currentUser?.email?.split('@')[0] || getStoredOperator()
  );
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [successModalData, setSuccessModalData] = useState<SavedTransactionDetails | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync operator with logged-in Google User
  useEffect(() => {
    if (currentUser) {
      const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'Operator Google';
      setOperator(name);
      saveStoredOperator(name);
    }
  }, [currentUser]);

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Pre-load product if passed via initialProduct
  useEffect(() => {
    if (initialProduct) {
      addProductToCart(initialProduct);
    }
  }, [initialProduct]);

  // Handle barcode scanned from camera modal
  useEffect(() => {
    if (scannedBarcode) {
      handleBarcodeLookup(scannedBarcode);
      if (onClearScannedBarcode) onClearScannedBarcode();
    }
  }, [scannedBarcode]);

  // Handle operator change
  const handleOperatorChange = (val: string) => {
    setOperator(val);
    saveStoredOperator(val);
  };

  // Add Product to Cart
  const addProductToCart = (product: Product, quantityToAdd = 1) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantityToAdd;
        updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].pricePerUnit;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            barcode1: product.barcode1,
            barcode2: product.barcode2,
            photoUrl: product.photoUrl,
            quantity: quantityToAdd,
            pricePerUnit: product.price || 0,
            totalPrice: (product.price || 0) * quantityToAdd
          }
        ];
      }
    });

    setFeedbackMessage({
      type: 'success',
      text: `Ditambahkan: ${product.name}`
    });
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  // Calculate matching products for live search
  const searchTrim = barcodeInput.trim().toLowerCase();
  const searchResults = searchTrim
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchTrim) ||
        (p.barcode1 && p.barcode1.toLowerCase().includes(searchTrim)) ||
        (p.barcode2 && p.barcode2.toLowerCase().includes(searchTrim)) ||
        (p.category && p.category.toLowerCase().includes(searchTrim))
      )
    : [];

  // Barcode Lookup logic
  const handleBarcodeLookup = (code: string) => {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim();

    const matched = findProductByBarcode(products, cleanCode);
    if (matched) {
      addProductToCart(matched);
      setBarcodeInput('');
      setShowSuggestions(false);
    } else {
      // Try soft matching product name or barcode/SKU
      const softMatched = products.find(p => 
        p.name.toLowerCase().includes(cleanCode.toLowerCase()) ||
        (p.barcode1 && p.barcode1.toLowerCase().includes(cleanCode.toLowerCase())) ||
        (p.barcode2 && p.barcode2.toLowerCase().includes(cleanCode.toLowerCase()))
      );
      if (softMatched) {
        addProductToCart(softMatched);
        setBarcodeInput('');
        setShowSuggestions(false);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: `Produk / Barcode / SKU "${cleanCode}" tidak ditemukan di database.`
        });
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleBarcodeLookup(barcodeInput);
  };

  // Cart Adjustments
  const updateItemQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.pricePerUnit
          };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Totals
  const totalQuantity = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Submit Transaction
  const handleSubmitTransaction = () => {
    if (cartItems.length === 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'Keranjang transaksi masih kosong!'
      });
      return;
    }

    const savedTrxInfo: SavedTransactionDetails = {
      type: trxType,
      items: [...cartItems],
      totalQuantity,
      operator: operator || 'Admin Stok',
      note: note.trim(),
      createdAt: new Date().toISOString()
    };

    recordTransaction({
      type: trxType,
      items: cartItems,
      totalItems: cartItems.length,
      totalQuantity: totalQuantity,
      totalAmount: 0,
      note: note.trim(),
      operator: operator || 'Admin Stok'
    });

    setCartItems([]);
    setNote('');
    setFeedbackMessage({
      type: 'success',
      text: `Berhasil menyimpan transaksi produk ${trxType === 'MASUK' ? 'MASUK' : 'TERJUAL'}!`
    });
    setSuccessModalData(savedTrxInfo);

    onTransactionSaved();
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Type Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-100 border border-zinc-200/60 rounded-2xl">
        <button
          onClick={() => setTrxType('MASUK')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition ${
            trxType === 'MASUK'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span>Produk Masuk (Inbound)</span>
        </button>

        <button
          onClick={() => setTrxType('TERJUAL')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition ${
            trxType === 'TERJUAL'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>Produk Terjual (Outbound)</span>
        </button>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${trxType === 'MASUK' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <h2 className="text-lg font-bold text-zinc-800">
                Catat Transaksi: <span className={trxType === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'}>
                  {trxType === 'MASUK' ? 'Barang Masuk / Restock' : 'Barang Terjual'}
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Scan barcode dengan scanner USB/Kamera atau cari nama produk di bawah.
            </p>
          </div>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-200/60 font-semibold text-xs transition"
          >
            <Scan className="w-4 h-4 text-zinc-700" />
            <span>Kamera Barcode</span>
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Barcode / SKU / Product Search & Fast Scanner Input */}
        <div className="space-y-2 relative" ref={searchContainerRef}>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              1. Pindai Barcode / Ketik Cari Produk (Nama, Kode SKU / Barcode 1 & 2, Kategori)
            </label>
            {searchTrim && (
              <span className="text-[11px] font-semibold text-emerald-600">
                {searchResults.length} produk cocok
              </span>
            )}
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 relative">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Ketik nama produk, kode SKU, Barcode 1/2, atau gunakan scanner..."
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('');
                    setShowSuggestions(false);
                    barcodeInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-zinc-200/60 transition"
                  title="Hapus ketikan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          {/* Real-time Autocomplete Suggestions Overlay */}
          {showSuggestions && searchTrim.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 max-h-80 overflow-y-auto divide-y divide-zinc-100">
              <div className="px-3.5 py-2 bg-zinc-50/90 border-b border-zinc-100 flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                <span>Hasil Pencarian ({searchResults.length})</span>
                <span className="text-[10px] font-normal text-zinc-400">Klik produk untuk menambah ke keranjang</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  <p className="font-semibold text-zinc-700">Tidak ada produk yang cocok</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Kata kunci "{barcodeInput}" tidak ditemukan pada Nama, SKU / Barcode 1, Barcode 2, atau Kategori.
                  </p>
                </div>
              ) : (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      addProductToCart(p);
                      setBarcodeInput('');
                      setShowSuggestions(false);
                      barcodeInputRef.current?.focus();
                    }}
                    className="w-full text-left p-3 hover:bg-emerald-50/50 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {p.photoUrl ? (
                        <img
                          src={formatPhotoUrl(p.photoUrl)}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-bold text-xs text-zinc-900 group-hover:text-emerald-700 transition truncate">
                          {p.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                          {p.barcode1 && (
                            <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-zinc-700 border border-zinc-200/60">
                              SKU/B1: {p.barcode1}
                            </span>
                          )}
                          {p.barcode2 && (
                            <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-zinc-600 border border-zinc-200/60">
                              B2: {p.barcode2}
                            </span>
                          )}
                          {p.category && (
                            <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-medium border border-emerald-100">
                              {p.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                        p.stock <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : p.stock <= p.minStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Stok: {p.stock} {p.unit || 'pcs'}
                      </span>
                      <div className="text-[10px] font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition mt-0.5">
                        + Tambah ke Keranjang
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Quick Select Dropdown for convenience */}
          <div className="pt-2">
            <label className="block text-[11px] text-zinc-500 mb-1">Atau pilih dari daftar katalog:</label>
            <select
              onChange={(e) => {
                const p = products.find(prod => prod.id === e.target.value);
                if (p) {
                  addProductToCart(p);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none cursor-pointer hover:bg-zinc-100/80 transition"
            >
              <option value="" disabled>-- Pilih Produk Manual --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock} {p.unit || ''}) {p.barcode1 ? `- SKU/B1: ${p.barcode1}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              2. Daftar Barang Transaksi ({cartItems.length} jenis, {totalQuantity} total qty)
            </label>
            {cartItems.length > 0 && (
              <button
                onClick={() => setCartItems([])}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Kosongkan
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-10 px-4 bg-zinc-50/60 rounded-2xl border border-dashed border-zinc-200">
              <Package className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-600">Belum Ada Item Ditempatkan di Keranjang</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Pindai barcode atau pilih produk di atas untuk menambah item transaksi.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {cartItems.map((item) => {
                const liveProd = products.find(p => p.id === item.productId);
                return (
                  <div
                    key={item.productId}
                    className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.photoUrl ? (
                        <img
                          src={formatPhotoUrl(item.photoUrl)}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-bold text-xs text-zinc-800 truncate">{item.productName}</p>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span>B1: {item.barcode1 || '-'}</span>
                          {liveProd && (
                            <span className="bg-zinc-200/80 px-1.5 py-0.2 rounded text-[10px] font-medium text-zinc-700">
                              Stok Terkini: {liveProd.stock}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.productId, Number(e.target.value) || 0)}
                          className="w-12 text-center text-xs font-bold text-zinc-800 focus:outline-none"
                        />
                        <button
                          onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded transition"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional Fields: Notes & Operator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Catatan Transaksi (Opsional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Penerimaan Supplier PT Maju / Penjualan Toko A..."
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Nama Operator / Petugas</span>
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => handleOperatorChange(e.target.value)}
              placeholder="Nama Petugas"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleSubmitTransaction}
            disabled={cartItems.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm text-white transition shadow-2xs flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
              trxType === 'MASUK'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            <Check className="w-5 h-5" />
            <span>Simpan Transaksi Produk {trxType === 'MASUK' ? 'Masuk (+)' : 'Terjual (-)'}</span>
          </button>
        </div>
      </div>
      {/* Success Modal Popup */}
      <TransactionSuccessModal
        isOpen={!!successModalData}
        data={successModalData}
        onClose={() => {
          setSuccessModalData(null);
          barcodeInputRef.current?.focus();
        }}
        onNavigateToHistory={onNavigateToHistory}
      />
    </div>
  );
};
