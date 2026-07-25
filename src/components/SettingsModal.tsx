import React, { useState } from 'react';
import { 
  Settings, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Trash2, 
  Copy,
  FileCode,
  Info,
  Sparkles,
  Database,
  User as UserIcon,
  LogOut,
  LogIn
} from 'lucide-react';
import { SyncStatus } from '../types';
import { 
  getStoredSheetUrl, 
  saveSheetUrl, 
  getStoredAppsScriptUrl,
  saveAppsScriptUrl,
  DEFAULT_SHEET_URL
} from '../lib/storage';
import { User } from '../lib/firebase';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface SettingsModalProps {
  syncStatus: SyncStatus;
  onTriggerSync: (customUrl?: string) => void;
  onClearAllData: () => void;
  currentUser: User | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  isAuthenticating?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  syncStatus,
  onTriggerSync,
  onClearAllData,
  currentUser,
  onLoginGoogle,
  onLogoutGoogle,
  isAuthenticating = false
}) => {
  const [sheetUrl, setSheetUrl] = useState(getStoredSheetUrl());
  const [appsScriptUrl, setAppsScriptUrl] = useState(getStoredAppsScriptUrl());
  const [copiedCode, setCopiedCode] = useState(false);
  const [appsScriptSuccess, setAppsScriptSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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
      {/* 0. Google Authentication Account Section */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-800">Akun Google Operator</h2>
              <p className="text-xs text-zinc-500">
                Otentikasi Google untuk mencatat identitas operator transaksi secara otomatis
              </p>
            </div>
          </div>

          {currentUser ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Terhubung
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
              Tamu (Belum Login)
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-11 h-11 rounded-full border border-zinc-300 object-cover shadow-2xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-zinc-900 text-white font-bold text-sm flex items-center justify-center">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-zinc-800">
                  {currentUser.displayName || 'Pengguna Google'}
                </p>
                <p className="text-xs text-zinc-500 font-mono">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={onLogoutGoogle}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition border border-rose-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-zinc-600 max-w-md leading-relaxed">
              Silakan login menggunakan akun Google Anda agar transaksi yang dicatatkan tersimpan dengan nama operator akun Anda.
            </p>
            <button
              onClick={onLoginGoogle}
              disabled={isAuthenticating}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs shadow-xs border border-zinc-300 transition shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthenticating ? 'Proses Login...' : 'Login dengan Google'}</span>
            </button>
          </div>
        )}
      </div>

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

            {/* 2. Google Apps Script Web App Integration (Auto Write Transaksi ke Sheet) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-2xs">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-800">Pencatatan Otomatis Input Transaksi ke Google Sheet</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Input Real-time
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tiap kali transaksi (Barang Masuk / Terjual) diinput, data otomatis dikirim &amp; ditambahkan sebagai baris baru di Google Spreadsheet Anda.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
            URL Google Apps Script Web App
          </label>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition"
            />
            <button
              onClick={() => {
                saveAppsScriptUrl(appsScriptUrl);
                setAppsScriptSuccess(true);
                setTimeout(() => setAppsScriptSuccess(false), 2500);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition shrink-0"
            >
              Simpan URL Web App
            </button>
          </div>

          {appsScriptSuccess && (
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>URL Google Apps Script Web App berhasil disimpan!</span>
            </p>
          )}
        </div>

        {/* Script Code Helper */}
        <div className="p-4 rounded-xl bg-zinc-900 text-zinc-100 space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-200 text-xs">Kode Google Apps Script (1-Kali Pasang)</span>
            </div>
            <button
              onClick={() => {
                const code = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'ADD_TRANSACTION';
    
    // 1. Hapus Produk Otomatis dari Sheet jika action === 'DELETE_PRODUCT'
    if (action === 'DELETE_PRODUCT') {
      var prodSheet = ss.getSheetByName('Produk') || ss.getSheets()[0];
      if (prodSheet) {
        var lastRow = prodSheet.getLastRow();
        var b1 = (data.barcode1 || '').toString().trim().toLowerCase();
        var b2 = (data.barcode2 || '').toString().trim().toLowerCase();
        var nameTarget = (data.name || '').toString().trim().toLowerCase();
        
        for (var r = lastRow; r >= 1; r--) {
          var rowVals = prodSheet.getRange(r, 1, 1, prodSheet.getLastColumn()).getValues()[0].map(function(v){ return v.toString().trim().toLowerCase(); });
          if ((b1 && rowVals.indexOf(b1) !== -1) || (b2 && rowVals.indexOf(b2) !== -1) || (nameTarget && rowVals.indexOf(nameTarget) !== -1)) {
            prodSheet.deleteRow(r);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'DELETE_PRODUCT' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Hapus Transaksi Otomatis jika action === 'DELETE_TRANSACTION'
    if (action === 'DELETE_TRANSACTION') {
      var targetSheetNames = ['Update Stok', 'update stok', 'UPDATE STOK', 'Transaksi', 'transaksi', 'Log Stok', 'Riwayat Stok', 'History Stok'];
      var sheetsToSearch = [];
      
      for (var s = 0; s < targetSheetNames.length; s++) {
        var sh = ss.getSheetByName(targetSheetNames[s]);
        if (sh && sheetsToSearch.indexOf(sh) === -1) {
          sheetsToSearch.push(sh);
        }
      }
      
      if (sheetsToSearch.length === 0) {
        sheetsToSearch = ss.getSheets();
      }

      var deletedRowsCount = 0;
      for (var i = 0; i < sheetsToSearch.length; i++) {
        var sheet = sheetsToSearch[i];
        if (!sheet) continue;
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        if (lastRow < 2 || lastCol < 1) continue;
        
        for (var r = lastRow; r >= 2; r--) {
          var rowVals = sheet.getRange(r, 1, 1, lastCol).getValues()[0].map(function(v){ return v.toString().trim(); });
          var rowStr = rowVals.join(' ');
          if (data.id && rowStr.indexOf(data.id.toString().trim()) !== -1) {
            sheet.deleteRow(r);
            deletedRowsCount++;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'DELETE_TRANSACTION', deletedRows: deletedRowsCount })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Tambah atau Update Transaksi (ADD_TRANSACTION / UPDATE_TRANSACTION)
    var sheet = ss.getSheetByName('Update Stok') || ss.getSheetByName('update stok') || ss.getSheetByName('UPDATE STOK') || ss.getSheetByName('Transaksi') || ss.insertSheet('Update Stok');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Waktu', 'ID Transaksi', 'Outlet', 'Tipe', 'Nama Produk', 'Barcode', 'Jumlah (Qty)', 'Harga Satuan', 'Subtotal', 'Operator', 'Catatan']);
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    var timestamp = new Date();
    if (data.createdAt) {
      var parsedDate = new Date(data.createdAt);
      if (!isNaN(parsedDate.getTime())) {
        timestamp = parsedDate;
      }
    }
    var type = data.type || 'MASUK';
    var outlet = data.outlet || 'Planet gadget 3';
    var operator = data.operator || 'Admin';
    var note = data.note || '';
    var transactionId = data.id || '';

    // Jika ada ID Transaksi, hapus baris lama terlebih dahulu agar edit/update tidak membuat baris duplikat atau bergeser
    if (transactionId) {
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      if (lastRow >= 2 && lastCol >= 1) {
        for (var r = lastRow; r >= 2; r--) {
          var rowVals = sheet.getRange(r, 1, 1, lastCol).getValues()[0].map(function(v){ return v.toString().trim(); });
          var rowStr = rowVals.join(' ');
          if (rowStr.indexOf(transactionId.toString().trim()) !== -1) {
            sheet.deleteRow(r);
          }
        }
      }
    }
    
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(function(item) {
        sheet.appendRow([
          timestamp,
          transactionId,
          outlet,
          type,
          item.productName || '',
          item.barcode || item.barcode1 || '',
          item.quantity || 1,
          item.unitPrice || item.price || 0,
          item.subtotal || 0,
          operator,
          note
        ]);
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                navigator.clipboard.writeText(code);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition font-sans font-semibold border border-zinc-700"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Tersalin!' : 'Salin Kode Script'}</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Petunjuk Singkat:
            <br />1. Buka Spreadsheet Anda &rarr; Klik menu <span className="text-zinc-200 font-semibold">Ekstensi</span> &rarr; <span className="text-zinc-200 font-semibold">Apps Script</span>.
            <br />2. Hapus isi editor lalu Tempel (Paste) kode yang disalin di atas.
            <br />3. Klik <span className="text-zinc-200 font-semibold">Terapkan (Deploy)</span> &rarr; <span className="text-zinc-200 font-semibold">Terapkan sebagai Aplikasi Web (Web App)</span>.
            <br />4. Atur <span className="text-emerald-400 font-semibold">Akses</span> ke <span className="text-emerald-400 font-semibold">Siapa saja (Anyone)</span> &rarr; Klik Terapkan &rarr; Salin URL Web App ke kolom di atas.
          </p>
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
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition border border-rose-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Data Lokal</span>
          </button>
        </div>
      </div>
      {/* Reset Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={showResetConfirm}
        title="Reset Seluruh Data Lokal"
        message="Apakah Anda yakin ingin mereset seluruh data lokal di peramban ini? Data katalog produk dan transaksi akan dikosongkan dan dapat diunduh ulang dari Google Spreadsheet."
        itemName="Penyimpanan Lokal Browser (Local Cache)"
        confirmButtonText="Reset Seluruh Data"
        onConfirm={() => {
          setShowResetConfirm(false);
          onClearAllData();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
