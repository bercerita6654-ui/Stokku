import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Papa from 'papaparse';

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1MKWMahA8GArLnFQH01wYNqKOoXjfG9qYnFYP-2nurC8/edit?gid=410498483#gid=410498483';

interface CSVProductRow {
  id: string;
  barcode1: string;
  barcode2: string;
  photoUrl: string;
  name: string;
  price?: number;
  category?: string;
  stock?: number;
  totalIncoming?: number;
  totalOutgoing?: number;
}

interface CSVTransaction {
  id: string;
  type: 'MASUK' | 'TERJUAL';
  items: Array<{
    productId: string;
    productName: string;
    barcode1: string;
    barcode2: string;
    photoUrl: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }>;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  note: string;
  operator: string;
  createdAt: string;
}

export function normalizeGoogleSheetCsvUrl(url: string): string {
  if (!url) return DEFAULT_SHEET_URL;
  const trimmed = url.trim();

  if (!trimmed.includes('docs.google.com/spreadsheets/d/')) {
    return trimmed;
  }

  // Handle published web sheet
  if (trimmed.includes('/spreadsheets/d/e/')) {
    if (!trimmed.includes('output=csv')) {
      return trimmed.includes('?') ? `${trimmed}&output=csv` : `${trimmed}?output=csv`;
    }
    return trimmed;
  }

  // Handle direct Google Spreadsheet edit / view / share link
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    const spreadsheetId = idMatch[1];
    let gid = '';
    const gidMatch = trimmed.match(/[?&]gid=([0-9]+)/) || trimmed.match(/#gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
  }

  return trimmed;
}

function processGoogleDriveUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  
  // 1. Check for Google Drive view/open/uc/thumbnail link pattern
  // e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // or https://drive.google.com/open?id=FILE_ID
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                         trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
                         trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  // 2. Check if the string itself is a raw Google Drive File ID (without http/https)
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
    if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
      return `https://lh3.googleusercontent.com/d/${trimmed}`;
    }
  }

  return trimmed;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Google Apps Script Proxy Endpoint for Stock Updates / Transactions
  app.post('/api/sync-transaction', async (req, res) => {
    try {
      const { appsScriptUrl, payload } = req.body;
      if (!appsScriptUrl) {
        return res.status(400).json({ error: 'URL Google Apps Script tidak ditentukan' });
      }

      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      const responseText = await response.text();
      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      return res.json({ success: true, result: responseJson });
    } catch (err: any) {
      console.error('Error posting to Apps Script:', err);
      return res.status(500).json({ error: err.message || 'Gagal mengirim data ke Google Apps Script' });
    }
  });

  // Fetch CSV Endpoint
  app.post('/api/sync-csv', async (req, res) => {
    try {
      const rawUrl = req.body?.url || DEFAULT_SHEET_URL;

      const idMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      const spreadsheetId = idMatch ? idMatch[1] : '';

      // Build URLs for both Update Stock tab (gid=410498483) and Master Catalog tab (gid=638369466)
      const updateStockUrl = spreadsheetId 
        ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=410498483`
        : normalizeGoogleSheetCsvUrl(rawUrl);

      const catalogUrl = spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=638369466`
        : normalizeGoogleSheetCsvUrl(rawUrl);

      // Helper to fetch CSV
      const fetchCsv = async (url: string) => {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/csv,text/plain,application/json,*/*'
            }
          });
          if (!response.ok) return '';
          const text = await response.text();
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) return '';
          return text;
        } catch {
          return '';
        }
      };

      let updateStockCsv = await fetchCsv(updateStockUrl);
      let catalogCsv = await fetchCsv(catalogUrl);

      // Fallback if primary URL was custom
      if (!updateStockCsv && !catalogCsv) {
        updateStockCsv = await fetchCsv(normalizeGoogleSheetCsvUrl(rawUrl));
      }

      // Structure to store products and transactions
      const productsMap = new Map<string, CSVProductRow>();
      const transactions: CSVTransaction[] = [];
      const stockSummary = new Map<string, { totalIncoming: number; totalOutgoing: number; name: string; barcode1: string; barcode2: string }>();

      const getProductKey = (b1: string, b2: string, name: string) => {
        if (b1) return `b1_${b1.trim().toLowerCase()}`;
        if (b2) return `b2_${b2.trim().toLowerCase()}`;
        return `name_${(name || '').trim().toLowerCase()}`;
      };

      // 1. Parse Update Stock CSV (gid=410498483) if available
      if (updateStockCsv) {
        const parsedUpdate = Papa.parse<string[]>(updateStockCsv, { skipEmptyLines: true, header: false });
        const rows = parsedUpdate.data || [];

        if (rows.length > 0) {
          // Identify headers
          let idIdx = -1, dateIdx = -1, menuIdx = -1, b1Idx = -1, b2Idx = -1, nameIdx = -1, qtyIdx = -1, opIdx = -1, noteIdx = -1;
          const firstRow = rows[0];

          firstRow.forEach((colStr, idx) => {
            const c = (colStr || '').toLowerCase().trim();
            if (c === 'no' || c.includes('id') || c.includes('trx')) idIdx = idx;
            else if (c.includes('hari') || c.includes('tanggal') || c.includes('waktu') || c.includes('date')) dateIdx = idx;
            else if (c.includes('menu') || c.includes('tipe') || c.includes('jenis') || c.includes('status')) menuIdx = idx;
            else if (c.includes('kode barcode pg') || c.includes('barcode pg') || c.includes('kode 1')) b1Idx = idx;
            else if (c.includes('barcode pusat') || c.includes('barcode gl') || c.includes('kode 2')) b2Idx = idx;
            else if (c.includes('nama') || c.includes('product') || c.includes('item')) nameIdx = idx;
            else if (c.includes('qty') || c.includes('jumlah') || c.includes('stok')) qtyIdx = idx;
            else if (c.includes('operator') || c.includes('petugas')) opIdx = idx;
            else if (c.includes('catatan') || c.includes('note') || c.includes('keterangan')) noteIdx = idx;
          });

          // Default fallback column mapping if first row wasn't headers or missing
          const startI = (menuIdx >= 0 || b1Idx >= 0 || nameIdx >= 0) ? 1 : 0;
          if (idIdx === -1) idIdx = 0;
          if (dateIdx === -1) dateIdx = 1;
          if (menuIdx === -1) menuIdx = 2;
          if (b1Idx === -1) b1Idx = 3;
          if (b2Idx === -1) b2Idx = 4;
          if (nameIdx === -1) nameIdx = 5;
          if (qtyIdx === -1) qtyIdx = 6;
          if (opIdx === -1) opIdx = 7;
          if (noteIdx === -1) noteIdx = 8;

          for (let i = startI; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const rawMenu = (row[menuIdx] || '').trim().toUpperCase();
            const barcode1 = (row[b1Idx] || '').trim();
            const barcode2 = (row[b2Idx] || '').trim();
            const name = (row[nameIdx] || '').trim();
            const qtyStr = (row[qtyIdx] || '').replace(/[^0-9]/g, '');
            const qty = parseInt(qtyStr, 10) || 0;
            const op = (row[opIdx] || 'Sistem Sync').trim();
            const note = (row[noteIdx] || '').trim();
            const rawDate = (row[dateIdx] || '').trim();
            const trxId = (row[idIdx] || '').trim() || `trx_sheet_${i}_${Date.now()}`;

            if (!barcode1 && !barcode2 && !name) continue;

            const isMasuk = rawMenu.includes('MASUK') || rawMenu.includes('RESTOCK') || rawMenu.includes('IN');
            const isTerjual = rawMenu.includes('KELUAR') || rawMenu.includes('PENJUALAN') || rawMenu.includes('TERJUAL') || rawMenu.includes('OUT');
            const type: 'MASUK' | 'TERJUAL' = isMasuk ? 'MASUK' : (isTerjual ? 'TERJUAL' : 'MASUK');

            const key = getProductKey(barcode1, barcode2, name);
            if (!stockSummary.has(key)) {
              stockSummary.set(key, { totalIncoming: 0, totalOutgoing: 0, name, barcode1, barcode2 });
            }
            const summary = stockSummary.get(key)!;

            if (type === 'MASUK') {
              summary.totalIncoming += qty;
            } else {
              summary.totalOutgoing += qty;
            }

            // Construct transaction
            transactions.push({
              id: trxId,
              type,
              items: [{
                productId: `prod_${key}`,
                productName: name || 'Produk',
                barcode1,
                barcode2,
                photoUrl: '',
                quantity: qty,
                pricePerUnit: 0,
                totalPrice: 0
              }],
              totalItems: 1,
              totalQuantity: qty,
              totalAmount: 0,
              note,
              operator: op,
              createdAt: rawDate || new Date().toISOString()
            });
          }
        }
      }

      // 2. Parse Master Catalog CSV (gid=638369466) if available
      if (catalogCsv) {
        const parsedCatalog = Papa.parse<string[]>(catalogCsv, { skipEmptyLines: true, header: false });
        const rows = parsedCatalog.data || [];

        if (rows.length > 0) {
          let b1Idx = -1, b2Idx = -1, photoIdx = -1, nameIdx = -1, priceIdx = -1, catIdx = -1, stockIdx = -1;
          const firstRow = rows[0];

          firstRow.forEach((colStr, idx) => {
            const col = (colStr || '').toLowerCase().trim();
            if (col.includes('barcode pg') || col.includes('barcode 1') || col.includes('kode 1')) b1Idx = idx;
            else if (col.includes('barcode gl') || col.includes('barcode 2') || col.includes('kode 2')) b2Idx = idx;
            else if (col.includes('foto') || col.includes('link') || col.includes('gambar')) photoIdx = idx;
            else if (col.includes('nama') || col.includes('product') || col.includes('item')) nameIdx = idx;
            else if (col.includes('harga pg') || col === 'harga') priceIdx = idx;
            else if (col.includes('kategori') || col.includes('category')) catIdx = idx;
            else if (col.includes('stok') || col.includes('stock')) stockIdx = idx;
          });

          const startI = (b1Idx >= 0 || nameIdx >= 0) ? 1 : 0;
          if (b1Idx === -1) b1Idx = 0;
          if (b2Idx === -1) b2Idx = 1;
          if (photoIdx === -1) photoIdx = 2;
          if (nameIdx === -1) nameIdx = 3;
          if (priceIdx === -1) priceIdx = 4;

          for (let i = startI; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const barcode1 = (row[b1Idx] || '').trim();
            const barcode2 = (row[b2Idx] || '').trim();
            const photoUrlRaw = (row[photoIdx] || '').trim();
            const name = (row[nameIdx] || '').trim();

            if (!barcode1 && !barcode2 && !name) continue;

            const priceStr = priceIdx >= 0 && row[priceIdx] ? (row[priceIdx] || '').replace(/[^0-9]/g, '') : '';
            let parsedPrice = priceStr ? parseInt(priceStr, 10) : 0;
            if (parsedPrice > 0 && parsedPrice < 1000) parsedPrice *= 1000;

            let category = catIdx >= 0 && row[catIdx] ? (row[catIdx] || '').trim() : '';
            if (!category && name) {
              const lowerName = name.toLowerCase();
              if (lowerName.includes('pb') || lowerName.includes('powerbank') || lowerName.includes('power bank') || lowerName.includes('power depot') || lowerName.includes('powertiny') || lowerName.includes('sleekvolt') || lowerName.includes('magipi') || lowerName.includes('powermag') || lowerName.includes('glamvolt') || lowerName.includes('mini pix') || lowerName.includes('sunny power')) {
                category = 'Powerbank';
              } else if (lowerName.includes('cable') || lowerName.includes('kabel') || lowerName.includes('type-c') || lowerName.includes('lightning') || lowerName.includes('braided') || lowerName.includes('magloop') || lowerName.includes('ice link')) {
                category = 'Kabel Data';
              } else if (lowerName.includes('earphone') || lowerName.includes('earbuds') || lowerName.includes('headphone') || lowerName.includes('headset') || lowerName.includes('audio')) {
                category = 'Earphone';
              } else if (lowerName.includes('charger') || lowerName.includes('gan') || lowerName.includes('adapter')) {
                category = 'Charger';
              } else {
                category = 'Aksesori';
              }
            }

            const key = getProductKey(barcode1, barcode2, name);
            const summary = stockSummary.get(key);

            let totalIncoming = summary ? summary.totalIncoming : 0;
            let totalOutgoing = summary ? summary.totalOutgoing : 0;
            
            // Stock is directly totalIncoming - totalOutgoing from "Update Stock" sheet
            let calculatedStock = summary ? (totalIncoming - totalOutgoing) : 0;
            if (!summary && stockIdx >= 0 && row[stockIdx]) {
              const num = parseInt((row[stockIdx] || '').replace(/[^0-9-]/g, ''), 10);
              if (!isNaN(num)) calculatedStock = num;
            }

            productsMap.set(key, {
              id: `prod_${i}_${barcode1 || barcode2 || Math.random().toString(36).substring(2, 6)}`,
              barcode1,
              barcode2,
              photoUrl: processGoogleDriveUrl(photoUrlRaw),
              name,
              price: parsedPrice,
              category,
              stock: Math.max(0, calculatedStock),
              totalIncoming,
              totalOutgoing
            });
          }
        }
      }

      // Add products that appeared in Update Stock log but were missing from Master Catalog
      stockSummary.forEach((summary, key) => {
        if (!productsMap.has(key)) {
          const netStock = summary.totalIncoming - summary.totalOutgoing;
          productsMap.set(key, {
            id: `prod_log_${Math.random().toString(36).substring(2, 8)}`,
            barcode1: summary.barcode1,
            barcode2: summary.barcode2,
            photoUrl: '',
            name: summary.name || 'Produk Log',
            price: 0,
            category: 'Umum',
            stock: Math.max(0, netStock),
            totalIncoming: summary.totalIncoming,
            totalOutgoing: summary.totalOutgoing
          });
        }
      });

      const products = Array.from(productsMap.values());

      return res.json({
        success: true,
        products,
        transactions,
        total: products.length,
        syncedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error syncing CSV:', error);
      return res.status(500).json({
        error: error.message || 'Terjadi kesalahan saat memproses spreadsheet CSV'
      });
    }
  });

  // Proxy Endpoint to push transactions or delete actions to Google Apps Script Web App
  app.post('/api/sync-transaction', async (req, res) => {
    try {
      const { appsScriptUrl, payload } = req.body || {};
      const outletName = payload?.outlet || 'Planet gadget 3';
      console.log(`[Server Sync Validation] Google Sheet Sync Proxy - Outlet: "${outletName}"`, {
        keys: Object.keys(payload || {}),
        action: payload?.action || payload?.type || 'SYNC'
      });

      if (!appsScriptUrl) {
        return res.status(400).json({ success: false, error: 'Apps Script URL required' });
      }

      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload || {})
      });

      const responseText = await response.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {
        // Not JSON or plain string response from Apps Script
      }

      return res.json({
        success: true,
        data: responseJson || responseText
      });
    } catch (err: any) {
      console.error('Error in /api/sync-transaction proxy:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Gagal mengirim data ke Google Apps Script'
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StokKu Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
