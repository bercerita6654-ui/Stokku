import React, { useState } from 'react';
import { 
  Settings, 
  RotateCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Trash2, 
  Download, 
  Save, 
  Info,
  Layers,
  Code2,
  Copy,
  Send,
  Sparkles
} from 'lucide-react';
import { SyncStatus } from '../types';
import { 
  getStoredSheetUrl, 
  saveSheetUrl, 
  DEFAULT_SHEET_URL,
  getStoredAppsScriptUrl,
  saveAppsScriptUrl,
  sendTransactionToGoogleSheet
} from '../lib/storage';

interface SettingsModalProps {
  syncStatus: SyncStatus;
  onTriggerSync: (customUrl?: string) => void;
  onClearAllData: () => void;
}

const APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT - UPDATE STOCK OTOMATIS STOKKU
 *
 * Petunjuk Pemasangan:
 * 1. Buka Google Spreadsheet Anda:
 *    https://docs.google.com/spreadsheets/d/e/2PACX-1vSXSy8WDlm3ijk4oZqwkOCqtUET6N7BOPWhRHtDocecqSNgcKWZdlY77h6A0IoEe-ykHMPEUy-3KZ3y/pub?output=csv
 * 2. Klik menu Extensi -> Apps Script
 * 3. Hapus seluruh kode bawaan, lalu paste (tempel) kode ini.
 * 4. Klik ikon Disket (Simpan).
 * 5. Klik tombol "Terapkan" (Deploy) -> "Terapkan Baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. "Siapa yang memiliki akses" -> pilih "Siapa saja" (Anyone).
 * 8. Klik Terapkan & berikan Otorisasi.
 * 9. Salin "URL Aplikasi Web" (Web App URL) lalu tempelkan di Pengaturan StokKu.
 */

function doPost(e) {
  try {
    var contents;
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      contents = e.parameter;
    } else {
      contents = {};
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Cari atau buat sheet bernama "Update Stock"
    var sheet = ss.getSheetByName("Update Stock");
    if (!sheet) {
      sheet = ss.insertSheet("Update Stock");
      sheet.appendRow([
        "ID Transaksi",
        "Waktu & Tanggal",
        "Tipe Transaksi",
        "Barcode 1 (PG)",
        "Barcode 2 (Gl)",
        "Nama Produk",
        "Jumlah (Qty)",
        "Petugas / Operator",
        "Catatan"
      ]);
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#e2e8f0");
    }

    var timestamp = contents.createdAt ? new Date(contents.createdAt).toLocaleString("id-ID") : new Date().toLocaleString("id-ID");
    var items = contents.items || [];
    var trxType = contents.type || "MASUK";
    var operator = contents.operator || "Admin Stok";
    var note = contents.note || "";
    var trxId = contents.id || "TRX-" + Date.now();

    if (items.length === 0 && contents.productName) {
      items = [{
        productName: contents.productName,
        barcode1: contents.barcode1 || "",
        barcode2: contents.barcode2 || "",
        quantity: contents.quantity || 1
      }];
    }

    // Catat baris transaksi ke sheet "Update Stock"
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      sheet.appendRow([
        trxId,
        timestamp,
        trxType === "MASUK" ? "BARANG MASUK" : "BARANG TERJUAL",
        item.barcode1 || "-",
        item.barcode2 || "-",
        item.productName || item.name || "-",
        item.quantity || 1,
        operator,
        note
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Berhasil tersimpan ke sheet Update Stock",
      itemsCount: items.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Update Stock StokKu Aktif!"
  })).setMimeType(ContentService.MimeType.JSON);
}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  syncStatus,
  onTriggerSync,
  onClearAllData
}) => {
  const [sheetUrl, setSheetUrl] = useState(getStoredSheetUrl());
  const [appsScriptUrl, setAppsScriptUrl] = useState(getStoredAppsScriptUrl());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [appsScriptSaveSuccess, setAppsScriptSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const handleSaveAppsScriptUrl = () => {
    saveAppsScriptUrl(appsScriptUrl);
    setAppsScriptSaveSuccess(true);
    setTimeout(() => setAppsScriptSaveSuccess(false), 2500);
  };

  const handleCopyAppsScriptCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleTestAppsScript = async () => {
    if (!appsScriptUrl.trim()) {
      setTestResult({ success: false, message: 'Harap masukkan URL Web App Apps Script terlebih dahulu' });
      return;
    }
    saveAppsScriptUrl(appsScriptUrl);
    setTestingConnection(true);
    setTestResult(null);

    const dummyTransaction = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      type: 'MASUK' as const,
      items: [
        {
          productId: 'p_test',
          productName: 'Uji Coba Otomatis StokKu',
          barcode1: 'K501PS005-BL',
          barcode2: '6902957323918',
          photoUrl: '',
          quantity: 1,
          pricePerUnit: 0,
          totalPrice: 0
        }
      ],
      totalItems: 1,
      totalQuantity: 1,
      totalAmount: 0,
      note: 'Uji coba koneksi Google Apps Script dari StokKu',
      operator: 'Tes System',
      createdAt: new Date().toISOString()
    };

    const res = await sendTransactionToGoogleSheet(dummyTransaction);
    setTestingConnection(false);
    setTestResult({
      success: res.success,
      message: res.message || (res.success ? 'Koneksi Berhasil! Data tes berhasil dikirim ke sheet Update Stock.' : 'Gagal mengirim ke Apps Script.')
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Google Spreadsheet Reader Configuration */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="p-2.5 rounded-xl bg-zinc-900 text-white shadow-2xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-800">Pengaturan Google Spreadsheet & Data Produk</h2>
            <p className="text-xs text-zinc-500">
              Konfigurasi tautan CSV dipublikasikan dari Google Sheets untuk impor data katalog produk.
            </p>
          </div>
        </div>

        {/* Spreadsheet URL Input Card */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Tautan Publikasi CSV Google Spreadsheet
          </label>

          <div className="space-y-2">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
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
                  <span>Simpan & Sinkronkan</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pengaturan tautan berhasil disimpan & disinkronkan!</span>
              </p>
            )}
          </div>
        </div>

        {/* Column Mapping Guide */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-zinc-800">
            <Info className="w-4 h-4 text-zinc-900" />
            <span>Format Struktur Kolom Google Spreadsheet:</span>
          </div>

          <p className="text-zinc-600">
            Aplikasi ini secara otomatis membaca data CSV dengan susunan kolom sebagai berikut:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[10px]">
                1
              </span>
              <div>
                <p className="font-bold text-zinc-800">Kolom 1: Barcode Utama</p>
                <p className="text-[10px] text-zinc-400">Kode barcode / EAN / ID unik produk</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[10px]">
                2
              </span>
              <div>
                <p className="font-bold text-zinc-800">Kolom 2: Barcode Sekunder</p>
                <p className="text-[10px] text-zinc-400">Kode barcode alternatif / opsional</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[10px]">
                3
              </span>
              <div>
                <p className="font-bold text-zinc-800">Kolom 3: Link Foto / ID Foto</p>
                <p className="text-[10px] text-zinc-400">Link Drive atau ID Foto Google Drive</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-[10px]">
                4
              </span>
              <div>
                <p className="font-bold text-zinc-800">Kolom 4: Nama Produk</p>
                <p className="text-[10px] text-zinc-400">Deskripsi / Judul barang</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Google Apps Script Integration - Update Stock Sheet */}
      <div className="bg-white rounded-2xl border border-emerald-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-2xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-800">Google Apps Script (Update Stock Otomatis)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Otomatis
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Setiap kali transaksi atau update stok dicatat di StokKu, data akan langsung dikirim &amp; tersimpan otomatis ke sheet <strong className="text-zinc-700">"Update Stock"</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cara Mengaktifkan Update Stock Otomatis ke Google Sheet</span>
          </h3>

          <ol className="text-xs text-zinc-600 space-y-2 list-decimal list-inside bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
            <li>Buka Google Spreadsheet Anda.</li>
            <li>Klik menu <strong className="text-zinc-800">Extensi</strong> &rarr; <strong className="text-zinc-800">Apps Script</strong>.</li>
            <li>Hapus seluruh kode default yang ada, lalu salin (copy) kode di bawah dan paste ke Apps Script.</li>
            <li>Klik ikon <strong className="text-zinc-800">Simpan</strong> (disket).</li>
            <li>Klik tombol biru <strong className="text-zinc-800">Terapkan</strong> (Deploy) &rarr; <strong className="text-zinc-800">Terapkan Baru</strong>.</li>
            <li>Pilih Jenis: <strong className="text-zinc-800">Aplikasi Web</strong> (Web app).</li>
            <li>Di bagian <em>"Siapa yang memiliki akses"</em>, wajib pilih: <strong className="text-emerald-700">Siapa saja (Anyone)</strong>.</li>
            <li>Klik <strong className="text-zinc-800">Terapkan</strong>, lalu berikan Otorisasi Izin jika diminta Google.</li>
            <li>Salin <strong className="text-zinc-800">URL Aplikasi Web</strong> yang didapat, lalu tempelkan di kotak di bawah ini!</li>
          </ol>
        </div>

        {/* Apps Script Code Box with Copy Button */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700">Kode Google Apps Script (Code.gs):</label>
            <button
              onClick={handleCopyAppsScriptCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? '✓ Kode Tersalin!' : 'Salin Kode Apps Script'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="p-3.5 bg-zinc-900 text-zinc-100 rounded-xl text-[11px] font-mono max-h-56 overflow-y-auto border border-zinc-800 leading-relaxed scrollbar-thin">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>

        {/* Apps Script Web App URL Input */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-zinc-700">
            URL Web App Apps Script (Hasil Deployment):
          </label>

          <input
            type="text"
            value={appsScriptUrl}
            onChange={(e) => setAppsScriptUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-zinc-500">
              {appsScriptUrl ? '🟢 Sync Otomatis Aktif' : '⚪ Sync Otomatis Belum Aktif (Masukkan URL Web App)'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAppsScriptUrl}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan URL</span>
              </button>

              <button
                onClick={handleTestAppsScript}
                disabled={testingConnection}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-2xs disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${testingConnection ? 'animate-bounce' : ''}`} />
                <span>{testingConnection ? 'Menguji...' : 'Tes Kirim Uji Coba'}</span>
              </button>
            </div>
          </div>

          {appsScriptSaveSuccess && (
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>URL Apps Script berhasil disimpan!</span>
            </p>
          )}

          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 mt-2 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Danger Zone: Reset Data */}
      <div className="bg-white rounded-2xl border border-rose-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Manajemen Data Penyimpanan Lokal</span>
        </div>

        <p className="text-xs text-zinc-600">
          Jika Anda ingin meriset ulang histori transaksi atau menghapus data cache penyimpanan lokal, gunakan tombol di bawah.
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500 font-medium">Reset Semua Produk &amp; Histori Transaksi</span>
          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin mereset seluruh data lokal?')) {
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
