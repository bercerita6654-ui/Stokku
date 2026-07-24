import React from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scan, 
  RotateCw,
  Clock,
  ChevronRight,
  Sparkles,
  Barcode,
  Trash2
} from 'lucide-react';
import { Product, Transaction } from '../types';
import { formatDateIndonesian, formatRupiah } from '../lib/storage';
import { DashboardCharts } from './DashboardCharts';

interface DashboardOverviewProps {
  products: Product[];
  transactions: Transaction[];
  onNavigate: (tab: 'dashboard' | 'catalog' | 'transaction' | 'history' | 'settings', options?: { type?: 'MASUK' | 'TERJUAL' }) => void;
  onOpenScanner: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  onClearTransactions?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  products,
  transactions,
  onNavigate,
  onOpenScanner,
  onSyncNow,
  isSyncing,
  onClearTransactions
}) => {
  // Compute metrics
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  // Total Inbound & Outbound items sourced from Update Stock sheet
  let totalMasukQty = products.reduce((acc, p) => acc + (p.totalIncoming ?? 0), 0);
  let totalTerjualQty = products.reduce((acc, p) => acc + (p.totalOutgoing ?? 0), 0);
  const totalStockQty = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  // Fallback to local transactions if product incoming/outgoing sums are 0
  if (totalMasukQty === 0 && totalTerjualQty === 0 && transactions.length > 0) {
    transactions.forEach((t) => {
      if (t.type === 'MASUK') {
        totalMasukQty += t.totalQuantity;
      } else if (t.type === 'TERJUAL') {
        totalTerjualQty += t.totalQuantity;
      }
    });
  }

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Quick Actions */}
      <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-xs border border-zinc-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700">
                Sistem Pendataan Terpadu
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Pencatatan Produk Masuk & Terjual
            </h2>
            <p className="text-zinc-300 text-sm mt-1 max-w-xl">
              Sinkronisasi data katalog produk dari Google Spreadsheet, catat transaksi masuk/keluar dengan pemindai barcode, dan pantau ketersediaan stok real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('transaction', { type: 'MASUK' })}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Produk Masuk</span>
            </button>

            <button
              onClick={() => onNavigate('transaction', { type: 'TERJUAL' })}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs transition active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Produk Terjual</span>
            </button>

            <button
              onClick={onOpenScanner}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs transition active:scale-95"
            >
              <Scan className="w-4 h-4 text-zinc-300" />
              <span>Scan Kamera</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Jenis Produk</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 group-hover:bg-zinc-900 group-hover:text-white transition">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-zinc-900">{totalProducts}</span>
              <span className="text-xs text-zinc-500 font-semibold ml-1.5">({totalStockQty} Pcs)</span>
            </div>
            <span className="text-xs text-zinc-500 group-hover:text-zinc-900 font-medium flex items-center gap-1">
              Lihat Katalog <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Diambil dari sheet Update Stock</p>
        </div>

        {/* Total Masuk */}
        <div 
          onClick={() => onNavigate('history')}
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Item Masuk</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600">+{totalMasukQty}</span>
            <span className="text-xs text-zinc-500 group-hover:text-emerald-600 font-medium flex items-center gap-1">
              Riwayat <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Item restock/penerimaan barang</p>
        </div>

        {/* Total Terjual */}
        <div 
          onClick={() => onNavigate('history')}
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Item Terjual</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-600">-{totalTerjualQty}</span>
            <span className="text-xs text-zinc-500 group-hover:text-rose-600 font-medium flex items-center gap-1">
              Riwayat <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Item penjualan/pengeluaran barang</p>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => onNavigate('catalog')}
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stok Menipis / Habis</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              lowStockProducts.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-zinc-900'}`}>
              {lowStockProducts.length}
            </span>
            <span className="text-xs text-zinc-500 group-hover:text-amber-600 font-medium flex items-center gap-1">
              Cek Produk <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {outOfStockProducts.length} produk stok 0
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts Section (Recharts) */}
      <DashboardCharts products={products} transactions={transactions} />

      {/* Main Content Grid: Low Stock Alert + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Table Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-800 text-sm">Peringatan Stok Low</h3>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full font-medium">
                {lowStockProducts.length} item
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10 px-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                <Package className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
                <p className="text-xs font-semibold text-zinc-700">Semua Stok Aman!</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Tidak ada produk dengan stok di bawah ambang batas.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {lowStockProducts.slice(0, 8).map((prod) => (
                  <div 
                    key={prod.id}
                    className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between hover:bg-zinc-100/70 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.photoUrl ? (
                        <img 
                          src={prod.photoUrl} 
                          alt={prod.name}
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
                        <p className="font-medium text-xs text-zinc-800 truncate">{prod.name}</p>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                          <Barcode className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{prod.barcode1 || prod.barcode2 || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                        prod.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Stok: {prod.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 mt-4">
            <button
              onClick={() => onNavigate('catalog')}
              className="w-full py-2 text-center text-xs font-semibold text-zinc-900 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl transition"
            >
              Lihat Semua Stok Produk
            </button>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-800">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-800 text-sm">Aktivitas Transaksi Terbaru</h3>
              </div>
              <div className="flex items-center gap-2">
                {transactions.length > 0 && onClearTransactions && (
                  <button
                    onClick={() => {
                      if (window.confirm('Apakah Anda yakin ingin membersihkan seluruh Aktivitas Transaksi Terbaru? (Riwayat transaksi akan dikosongkan)')) {
                        onClearTransactions();
                      }
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition flex items-center gap-1"
                    title="Clear / Bersihkan Aktivitas Transaksi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Aktivitas</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('history')}
                  className="text-xs font-semibold text-zinc-900 hover:underline flex items-center gap-1"
                >
                  Lihat Semua <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 px-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                <Clock className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-zinc-700">Belum Ada Transaksi Recorded</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Mulai mencatat barang masuk atau barang terjual untuk melihat aktivitas di sini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((trx) => (
                  <div
                    key={trx.id}
                    className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        trx.type === 'MASUK' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {trx.type === 'MASUK' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            trx.type === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {trx.type === 'MASUK' ? 'Barang Masuk' : 'Barang Terjual'}
                          </span>
                          <span className="text-[11px] text-zinc-400">{formatDateIndonesian(trx.createdAt)}</span>
                        </div>

                        <p className="text-xs font-semibold text-zinc-800 mt-1">
                          {trx.items.length} jenis item ({trx.totalQuantity} total qty)
                        </p>
                        <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                          {trx.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:self-center shrink-0 border-t sm:border-0 border-zinc-200/60 pt-2 sm:pt-0">
                      <span className={`text-sm font-extrabold ${trx.type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {trx.type === 'MASUK' ? '+' : '-'}{trx.totalQuantity} item
                      </span>
                      {trx.note && (
                        <p className="text-[11px] text-zinc-400 italic mt-0.5 truncate max-w-[150px]">
                          "{trx.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between text-xs text-zinc-500">
            <span>Operator Default: Admin Stok</span>
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="text-zinc-900 hover:underline font-medium flex items-center gap-1"
            >
              <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkronkan Ulang Spreadsheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
