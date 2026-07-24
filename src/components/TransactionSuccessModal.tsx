import React from 'react';
import { 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Package, 
  User, 
  FileText, 
  X, 
  Clock, 
  Sparkles,
  History,
  PlusCircle
} from 'lucide-react';
import { TransactionType, TransactionItem } from '../types';
import { formatDateIndonesian, formatPhotoUrl } from '../lib/storage';

export interface SavedTransactionDetails {
  type: TransactionType;
  items: TransactionItem[];
  totalQuantity: number;
  operator: string;
  note?: string;
  createdAt: string;
}

interface TransactionSuccessModalProps {
  isOpen: boolean;
  data: SavedTransactionDetails | null;
  onClose: () => void;
  onNavigateToHistory?: () => void;
}

export const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({
  isOpen,
  data,
  onClose,
  onNavigateToHistory
}) => {
  if (!isOpen || !data) return null;

  const isMasuk = data.type === 'MASUK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200/90 space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Banner Accent */}
        <div 
          className={`absolute top-0 left-0 right-0 h-2 ${
            isMasuk ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600' : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600'
          }`} 
        />

        {/* Close X Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Success Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative inline-flex items-center justify-center">
            {/* Glowing Ring */}
            <div className={`absolute inset-0 rounded-full blur-md opacity-40 ${
              isMasuk ? 'bg-emerald-400' : 'bg-rose-400'
            }`} />
            <div className={`relative p-4 rounded-full text-white shadow-lg ${
              isMasuk ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              <CheckCircle2 className="w-10 h-10 animate-in zoom-in duration-300" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Tanda Berhasil</span>
            </div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
              Transaksi Berhasil Disimpan!
            </h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Data transaksi telah terinput dan stok produk telah otomatis disesuaikan.
            </p>
          </div>
        </div>

        {/* Transaction Summary Badge Card */}
        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-3">
          {/* Badge & Type */}
          <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Tipe Transaksi
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isMasuk 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {isMasuk ? (
                <>
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <span>BARANG MASUK (+ RESTOCK)</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  <span>BARANG TERJUAL (- OUTBOUND)</span>
                </>
              )}
            </span>
          </div>

          {/* Details Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-600">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{formatDateIndonesian(data.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 justify-end">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-800 truncate">{data.operator}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 pt-2 border-t border-zinc-200/60">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
              <span>Item Disimpan ({data.items.length} jenis)</span>
              <span className="text-zinc-900 bg-zinc-200/80 px-2 py-0.5 rounded-md text-[11px]">
                Total {data.totalQuantity} Qty
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {data.items.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-white p-2.5 rounded-xl border border-zinc-200/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.photoUrl ? (
                      <img 
                        src={formatPhotoUrl(item.photoUrl)} 
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-800 truncate">{item.productName}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        B1: {item.barcode1 || '-'}
                      </p>
                    </div>
                  </div>

                  <span className={`font-black text-xs px-2.5 py-1 rounded-lg shrink-0 ${
                    isMasuk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {isMasuk ? `+${item.quantity}` : `-${item.quantity}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Note if available */}
          {data.note && (
            <div className="pt-2 border-t border-zinc-200/60 flex items-start gap-1.5 text-xs text-zinc-600 italic">
              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>&quot;{data.note}&quot;</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 active:scale-98 ${
              isMasuk 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Transaksi Baru</span>
          </button>

          {onNavigateToHistory && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToHistory();
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 font-bold text-xs transition border border-zinc-200/70 flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4 text-zinc-500" />
              <span>Lihat Riwayat Transaksi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
