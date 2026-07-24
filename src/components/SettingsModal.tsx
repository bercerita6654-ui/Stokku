import React, { useState } from 'react';
import { 
  Settings, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Trash2, 
  Info,
  Sparkles,
  Database
} from 'lucide-react';
import { SyncStatus } from '../types';
import { 
  getStoredSheetUrl, 
  saveSheetUrl, 
  DEFAULT_SHEET_URL
} from '../lib/storage';

interface SettingsModalProps {
  syncStatus: SyncStatus;
  onTriggerSync: (customUrl?: string) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  syncStatus,
  onTriggerSync,
  onClearAllData
}) => {
  const [sheetUrl, setSheetUrl] = useState(getStoredSheetUrl());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveUrl = () => {
    saveSheetUrl(sheetUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onTriggerSync(sheetUrl);
  };

  const handleResetToDefaultUrl = () => {
    setSheetUrl(DEFAULT_SHEET_URL);
    saveSheetUrl(DEFAULT_SHEET_URL);
    onTriggerSync(DEFAULT_SHEET_URL);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Direct Google Spreadsheet Integration */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="p-2.5 rounded-xl bg-zinc-900 text-white shadow-2xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-800">Koneksi Langsung Google Spreadsheet</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Langsung Terhubung
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tanpa perlu Google Apps Script. Cukup masukkan link Google Spreadsheet Anda, aplikasi akan langsung membaca &amp; menyinkronkan data katalog produk.
            </p>
          </div>
        </div>

        {/* Spreadsheet URL Input Card */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Tautan Google Spreadsheet (URL Edit / Share)
          </label>

          <div className="space-y-2">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/1MKWMahA8GArLnFQH01wYNqKOoXjfG9qYnFYP-2nurC8/edit?gid=638369466"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                onClick={handleResetToDefaultUrl}
                className="text-xs text-zinc-900 hover:underline font-semibold"
              >
                Gunakan URL Default
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/60 font-medium transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Spreadsheet</span>
                </a>

                <button
                  onClick={handleSaveUrl}
                  disabled={syncStatus.status === 'syncing'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition shadow-xs"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${syncStatus.status === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Simpan &amp; Sinkronkan Data</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pengaturan tautan berhasil disimpan &amp; disinkronkan!</span>
              </p>
            )}
          </div>
        </div>

        {/* Column Mapping Guide */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-zinc-800">
            <Info className="w-4 h-4 text-zinc-900" />
            <span>Format Deteksi Kolom Otomatis:</span>
          </div>

          <p className="text-zinc-600 leading-relaxed">
            Sistem secara cerdas mendeteksi nama header kolom di Google Spreadsheet Anda (Barcode, Link Foto, Nama Produk, Harga, Kategori, Stok).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                1
              </span>
              <div>
                <p className="font-bold text-zinc-800">Barcode PG / Kode 1</p>
                <p className="text-[10px] text-zinc-400">Barcode utama produk</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                2
              </span>
              <div>
                <p className="font-bold text-zinc-800">Barcode Gl / Kode 2</p>
                <p className="text-[10px] text-zinc-400">Barcode pusat / alternatif</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                3
              </span>
              <div>
                <p className="font-bold text-zinc-800">Link Foto</p>
                <p className="text-[10px] text-zinc-400">Google Drive ID / URL Foto</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                4
              </span>
              <div>
                <p className="font-bold text-zinc-800">Nama Produk</p>
                <p className="text-[10px] text-zinc-400">Deskripsi / Judul barang</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                5
              </span>
              <div>
                <p className="font-bold text-zinc-800">Harga PG / Price</p>
                <p className="text-[10px] text-zinc-400">Harga jual barang</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                6
              </span>
              <div>
                <p className="font-bold text-zinc-800">Kategori &amp; Stok</p>
                <p className="text-[10px] text-zinc-400">Deteksi otomatis / manual</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Danger Zone: Reset Data */}
      <div className="bg-white rounded-2xl border border-rose-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Manajemen Data Penyimpanan Lokal</span>
        </div>

        <p className="text-xs text-zinc-600">
          Jika Anda ingin mereset histori transaksi lokal atau menghapus cache data produk yang tersimpan di peramban (browser), gunakan tombol di bawah.
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-rose-100">
          <span className="text-xs text-zinc-500 font-medium">Reset Data Produk &amp; Histori Transaksi Lokal</span>
          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin mereset seluruh data lokal? Data akan diunduh ulang dari Google Spreadsheet.')) {
                onClearAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition border border-rose-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Data Lokal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
