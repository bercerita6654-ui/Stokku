import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  itemDetail?: string;
  confirmButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = 'Konfirmasi Hapus Data',
  message = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
  itemName,
  itemDetail,
  confirmButtonText = 'Ya, Hapus',
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 space-y-5 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Item detail badge if available */}
        {(itemName || itemDetail) && (
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            {itemName && (
              <p className="text-xs font-bold text-zinc-800 truncate">
                {itemName}
              </p>
            )}
            {itemDetail && (
              <p className="text-[11px] text-zinc-500 font-mono">
                {itemDetail}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 font-semibold text-xs transition border border-zinc-200/60 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Menghapus...' : confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
