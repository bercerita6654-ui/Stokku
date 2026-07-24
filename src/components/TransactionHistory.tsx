import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  User, 
  FileText,
  Edit,
  Trash2,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { formatDateIndonesian, formatPhotoUrl, deleteTransaction, updateTransaction, clearAllTransactions } from '../lib/storage';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onRefreshData?: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onRefreshData }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'MASUK' | 'TERJUAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const handleDeleteTx = (tx: Transaction) => {
    setDeletingTx(tx);
  };

  const confirmDeleteTx = () => {
    if (!deletingTx) return;
    deleteTransaction(deletingTx.id);
    if (onRefreshData) onRefreshData();
    setDeletingTx(null);
  };

  const handleSaveEditTx = () => {
    if (!editingTx) return;
    updateTransaction(editingTx);
    setEditingTx(null);
    if (onRefreshData) onRefreshData();
  };

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      if (filterType !== 'ALL' && tx.type !== filterType) return false;

      // Search match
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchNote = tx.note.toLowerCase().includes(q);
        const matchOperator = tx.operator.toLowerCase().includes(q);
        const matchItem = tx.items.some(
          (i) =>
            i.productName.toLowerCase().includes(q) ||
            i.barcode1.toLowerCase().includes(q) ||
            i.barcode2.toLowerCase().includes(q)
        );
        if (!matchNote && !matchOperator && !matchItem) return false;
      }

      // Date match
      if (dateFilter !== 'all') {
        const txDate = new Date(tx.createdAt);
        const now = new Date();

        if (dateFilter === 'today') {
          const isToday =
            txDate.getDate() === now.getDate() &&
            txDate.getMonth() === now.getMonth() &&
            txDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (txDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          const isThisMonth =
            txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
          if (!isThisMonth) return false;
        }
      }

      return true;
    });
  }, [transactions, filterType, searchQuery, dateFilter]);

  // Aggregate stats
  const totalMasukCount = filteredTransactions.filter((t) => t.type === 'MASUK').reduce((acc, t) => acc + t.totalQuantity, 0);
  const totalTerjualCount = filteredTransactions.filter((t) => t.type === 'TERJUAL').reduce((acc, t) => acc + t.totalQuantity, 0);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    let csvContent = 'ID Transaksi,Tipe,Tanggal & Waktu,Nama Produk,Barcode 1,Barcode 2,Jumlah Qty,Operator,Catatan\n';

    filteredTransactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const row = [
          `"${tx.id}"`,
          `"${tx.type}"`,
          `"${formatDateIndonesian(tx.createdAt)}"`,
          `"${item.productName.replace(/"/g, '""')}"`,
          `"${item.barcode1}"`,
          `"${item.barcode2}"`,
          item.quantity,
          `"${tx.operator.replace(/"/g, '""')}"`,
          `"${tx.note.replace(/"/g, '""')}"`
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Riwayat_Transaksi_StokKu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-800">Riwayat Transaksi Produk</h2>
            <p className="text-xs text-zinc-500">
              Laporan data pencatatan barang masuk dan barang terjual
            </p>
          </div>

          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin membersihkan seluruh riwayat transaksi?')) {
                    clearAllTransactions();
                    if (onRefreshData) onRefreshData();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition"
                title="Bersihkan Semua Aktivitas Transaksi"
              >
                <Trash2 className="w-4 h-4" />
                <span>Bersihkan Riwayat</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition disabled:opacity-50 shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Laporan CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk, barcode, atau catatan..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          {/* Type Toggle */}
          <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/60 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                filterType === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('MASUK')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                filterType === 'MASUK' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Barang Masuk
            </button>
            <button
              onClick={() => setFilterType('TERJUAL')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                filterType === 'TERJUAL' ? 'bg-rose-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Barang Terjual
            </button>
          </div>

          {/* Date Filter */}
          <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/60 text-xs">
            <button
              onClick={() => setDateFilter('all')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                dateFilter === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                dateFilter === 'today' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Hari Ini
            </button>

            <button
              onClick={() => setDateFilter('month')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                dateFilter === 'month' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Quick Aggregation Summary Chips */}
        <div className="flex items-center gap-4 pt-2 text-xs border-t border-zinc-100">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <span className="font-semibold text-zinc-500">Total Transaksi:</span>
            <span className="font-bold text-zinc-800">{filteredTransactions.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Total Masuk: +{totalMasukCount} qty</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total Terjual: -{totalTerjualCount} qty</span>
          </div>
        </div>
      </div>

      {/* Transaction List Cards */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <History className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-700 text-sm">Tidak Ada Riwayat Ditemukan</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Coba sesuaikan filter pencarian atau tanggal transaksi Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => {
            const isExpanded = expandedTxId === tx.id;
            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden transition"
              >
                {/* Card Header Bar */}
                <div
                  onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50/80 transition"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'MASUK'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {tx.type === 'MASUK' ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            tx.type === 'MASUK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.type === 'MASUK' ? 'PRODUK MASUK' : 'PRODUK TERJUAL'}
                        </span>
                        <span className="text-xs font-medium text-zinc-500">
                          {formatDateIndonesian(tx.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-zinc-800 mt-1">
                        {tx.totalQuantity} total barang ({tx.items.length} jenis)
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-400" />
                          <span>Petugas: {tx.operator}</span>
                        </span>
                        {tx.note && (
                          <span className="flex items-center gap-1 italic truncate max-w-[200px]">
                            <FileText className="w-3 h-3 text-zinc-400" />
                            <span>"{tx.note}"</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100">
                    <span
                      className={`text-base font-extrabold mr-2 ${
                        tx.type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'MASUK' ? '+' : '-'}{tx.totalQuantity} item
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTx({
                            ...tx,
                            items: tx.items.map((i) => ({ ...i }))
                          });
                        }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition"
                        title="Edit Transaksi"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTx(tx);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button className="text-zinc-400 hover:text-zinc-600 p-1 ml-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Item List */}
                {isExpanded && (
                  <div className="bg-zinc-50/80 p-4 border-t border-zinc-100 space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Rincian Barang Transaksi:
                    </h4>
                    <div className="space-y-2">
                      {tx.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-xl border border-zinc-200/60 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.photoUrl ? (
                              <img
                                src={formatPhotoUrl(item.photoUrl)}
                                alt={item.productName}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-800 truncate">
                                {item.productName}
                              </p>
                              <p className="text-[10px] font-mono text-zinc-400">
                                B1: {item.barcode1 || '-'} {item.barcode2 ? `| B2: ${item.barcode2}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-zinc-800 text-xs">
                              {item.quantity} Qty
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-zinc-800 text-base">Edit / Perbaiki Transaksi</h3>
                <p className="text-[11px] text-zinc-400 font-mono">{editingTx.id}</p>
              </div>
              <button
                onClick={() => setEditingTx(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Type Toggle */}
              <div>
                <label className="block text-zinc-600 font-semibold mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx({ ...editingTx, type: 'MASUK' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      editingTx.type === 'MASUK'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>BARANG MASUK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingTx({ ...editingTx, type: 'TERJUAL' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      editingTx.type === 'TERJUAL'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>BARANG TERJUAL</span>
                  </button>
                </div>
              </div>

              {/* Operator & Note */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Petugas / Operator</label>
                  <input
                    type="text"
                    value={editingTx.operator}
                    onChange={(e) => setEditingTx({ ...editingTx, operator: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Catatan</label>
                  <input
                    type="text"
                    value={editingTx.note}
                    onChange={(e) => setEditingTx({ ...editingTx, note: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800"
                  />
                </div>
              </div>

              {/* Items Qty Editor */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <label className="block text-zinc-700 font-bold uppercase tracking-wider text-[11px]">
                  Rincian Qty Barang
                </label>
                {editingTx.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-800 truncate">{item.productName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        B1: {item.barcode1 || '-'} {item.barcode2 ? `| B2: ${item.barcode2}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[11px] font-semibold text-zinc-500">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = Math.max(1, parseInt(e.target.value) || 1);
                          const updatedItems = [...editingTx.items];
                          updatedItems[index] = { ...item, quantity: newQty };
                          setEditingTx({ ...editingTx, items: updatedItems });
                        }}
                        className="w-20 px-2.5 py-1.5 border border-zinc-300 rounded-lg text-center font-bold text-zinc-800 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const txToDel = editingTx;
                  setEditingTx(null);
                  handleDeleteTx(txToDel);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Transaksi</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-semibold hover:bg-zinc-200 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditTx}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!deletingTx}
        title="Hapus Transaksi Ini"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Stok produk terkait akan disesuaikan dan data di file spreadsheet (sheet 'Update Stok' / 'Transaksi') juga otomatis ikut terhapus."
        itemName={deletingTx ? `Transaksi #${deletingTx.id}` : ''}
        itemDetail={deletingTx ? `${deletingTx.type === 'MASUK' ? 'Barang Masuk' : 'Barang Terjual'} • Total Qty: ${deletingTx.totalQuantity}` : ''}
        confirmButtonText="Hapus Transaksi"
        onConfirm={confirmDeleteTx}
        onCancel={() => setDeletingTx(null)}
      />
    </div>
  );
};
