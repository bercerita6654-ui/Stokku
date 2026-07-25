import React, { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, X, Package, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { TransactionItem, TransactionType } from '../types';
import { formatDateIndonesian, formatPhotoUrl } from '../lib/storage';

interface TransactionConfirmModalProps {
  isOpen: boolean;
  trxType: TransactionType;
  activeOutlet: string;
  cartItems: TransactionItem[];
  totalQuantity: number;
  operator: string;
  note: string;
  onClose: () => void;
  onConfirmSend: () => void;
}

export const TransactionConfirmModal: React.FC<TransactionConfirmModalProps> = ({
  isOpen,
  trxType,
  activeOutlet,
  cartItems,
  totalQuantity,
  operator,
  note,
  onClose,
  onConfirmSend,
}) => {
  if (!isOpen) return null;

  const isMasuk = trxType === 'MASUK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-200/90 space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner Accent */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${
          isMasuk ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-pink-600'
        }`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Warning Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-1">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
            Periksa Kembali Data Sebelum Dikirim
          </h2>
          <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200/60 py-1.5 px-3 rounded-xl max-w-md mx-auto">
            ⚠️ Perhatian: Data <span className="underline font-bold">tidak dapat diedit atau diubah</span> setelah berhasil dikirim dan disimpan ke sistem!
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2.5 text-xs">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Cabang Toko / Outlet</span>
            <span className="bg-orange-100 text-orange-900 font-extrabold px-2.5 py-0.5 rounded-full border border-orange-200">
              {activeOutlet}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Tipe Transaksi</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
              isMasuk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isMasuk ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {isMasuk ? 'BARANG MASUK (+)' : 'BARANG TERJUAL (-)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Operator / Petugas</span>
            <span className="font-bold text-zinc-800">{operator || 'Admin'}</span>
          </div>

          {note && (
            <div className="flex items-start gap-2 text-xs text-zinc-600 italic pt-1 border-t border-zinc-200/50">
              <span className="font-semibold not-italic text-zinc-500">Catatan:</span>
              <span>&quot;{note}&quot;</span>
            </div>
          )}

          {/* Items Preview Table */}
          <div className="pt-2 border-t border-zinc-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
              <span>Daftar Barang ({cartItems.length} jenis)</span>
              <span className="bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded text-[11px]">
                Total {totalQuantity} Qty
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-zinc-200/70 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.photoUrl ? (
                      <img 
                        src={formatPhotoUrl(item.photoUrl)} 
                        alt={item.productName} 
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover bg-zinc-100 border shrink-0" 
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-800 truncate">{item.productName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">B1: {item.barcode1 || '-'}</p>
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
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 font-bold text-xs transition border border-zinc-200 text-center"
          >
            Periksa Kembali
          </button>
          <button
            type="button"
            onClick={onConfirmSend}
            className={`py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98 ${
              isMasuk ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Kirim &amp; Simpan Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
