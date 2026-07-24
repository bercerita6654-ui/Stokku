import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Package, Barcode } from 'lucide-react';
import { formatPhotoUrl } from '../lib/storage';

interface ImagePreviewModalProps {
  isOpen: boolean;
  photoUrl: string | null;
  productName?: string;
  category?: string;
  barcode1?: string;
  barcode2?: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  photoUrl,
  productName,
  category,
  barcode1,
  barcode2,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Reset zoom on open/close or photoUrl change
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
    }
  }, [isOpen, photoUrl]);

  if (!isOpen || !photoUrl) return null;

  const resolvedUrl = formatPhotoUrl(photoUrl);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-zinc-900/90 border-b border-zinc-800/80 z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <Package className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {productName || 'Pratinjau Gambar Produk'}
              </h3>
              {category && (
                <span className="text-[11px] text-zinc-400 font-medium">
                  Kategori: {category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-zinc-800 rounded-xl p-1 border border-zinc-700/60">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition"
                title="Perkecil (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-zinc-300 px-2 min-w-[3.5rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3.5}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition"
                title="Perbesar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoomLevel !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition border-l border-zinc-700/60 ml-0.5"
                  title="Reset Ukuran"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Buka di Tab Baru / Download */}
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition border border-zinc-700/60"
              title="Buka Gambar Asli di Tab Baru"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white transition border border-rose-500/30"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Container */}
        <div className="relative flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center min-h-[350px] max-h-[75vh] bg-zinc-950/90 select-none scrollbar-thin">
          <div className="transition-transform duration-200 ease-out flex items-center justify-center">
            <img
              src={resolvedUrl}
              alt={productName || 'Gambar Produk'}
              referrerPolicy="no-referrer"
              className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-2xl border border-zinc-800/80 cursor-grab active:cursor-grabbing"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback && photoUrl) {
                  target.dataset.triedFallback = 'true';
                  const idMatch = photoUrl.match(/([a-zA-Z0-9_-]{15,})/);
                  if (idMatch) {
                    target.src = `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200`;
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Bottom Details Footer */}
        {(barcode1 || barcode2) && (
          <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4">
              {barcode1 && (
                <div className="flex items-center gap-1.5 font-mono bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                  <Barcode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>B1: <strong className="text-zinc-200">{barcode1}</strong></span>
                </div>
              )}
              {barcode2 && (
                <div className="flex items-center gap-1.5 font-mono bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                  <Barcode className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>B2: <strong className="text-zinc-200">{barcode2}</strong></span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-zinc-500">
              Gunakan kontrol Zoom di kanan atas atau buka di tab baru.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
