import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Papa from 'papaparse';

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1MKWMahA8GArLnFQH01wYNqKOoXjfG9qYnFYP-2nurC8/export?format=csv&gid=638369466';

interface CSVProductRow {
  id: string;
  barcode1: string;
  barcode2: string;
  photoUrl: string;
  name: string;
  price?: number;
  category?: string;
  initialStock?: number;
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
      
      // Build candidate URLs to try in sequence
      const candidates: string[] = [];
      const primaryUrl = normalizeGoogleSheetCsvUrl(rawUrl);
      candidates.push(primaryUrl);

      // Add GViz fallback if it's a Google Spreadsheet URL
      const idMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        const spreadsheetId = idMatch[1];
        let gid = '';
        const gidMatch = rawUrl.match(/[?&]gid=([0-9]+)/) || rawUrl.match(/#gid=([0-9]+)/);
        if (gidMatch && gidMatch[1]) {
          gid = gidMatch[1];
        }
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`;
        if (!candidates.includes(gvizUrl)) {
          candidates.push(gvizUrl);
        }
      }

      if (rawUrl && !candidates.includes(rawUrl)) {
        candidates.push(rawUrl);
      }

      let csvText = '';
      let successfulUrl = '';
      let lastError = '';

      for (const targetCandidate of candidates) {
        try {
          const response = await fetch(targetCandidate, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/csv,text/plain,application/json,*/*'
            }
          });

          if (!response.ok) {
            lastError = `HTTP ${response.status}: ${response.statusText}`;
            continue;
          }

          const text = await response.text();
          // Check if response is HTML (Google Login or Preview page instead of CSV data)
          const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('google-site-verification');
          if (isHtml) {
            lastError = 'Spreadsheet mengembalikan halaman HTML. Akses mungkin memerlukan izin publik.';
            continue;
          }

          csvText = text;
          successfulUrl = targetCandidate;
          break;
        } catch (err: any) {
          lastError = err.message || 'Gagal terhubung ke URL';
        }
      }

      if (!csvText) {
        return res.status(400).json({
          error: `Gagal membaca Google Sheet. ${lastError || ''}. Pastikan akses spreadsheet diatur ke 'Siapa saja yang memiliki link' (Anyone with link).`
        });
      }

      // Parse CSV using PapaParse
      const parsed = Papa.parse<string[]>(csvText, {
        skipEmptyLines: true,
        header: false
      });

      if (parsed.errors && parsed.errors.length > 0) {
        console.warn('CSV Parse Warnings:', parsed.errors);
      }

      const rawRows = parsed.data;
      if (!rawRows || rawRows.length === 0) {
        return res.json({ products: [], total: 0, message: 'Spreadsheet kosong' });
      }

      // Dynamic Column Mapping
      let barcode1Idx = 0;
      let barcode2Idx = 1;
      let photoUrlIdx = 2;
      let nameIdx = 3;
      let priceIdx = 4;
      let categoryIdx = -1;
      let stockIdx = -1;

      let startIdx = 0;
      const firstRow = rawRows[0];
      if (firstRow && firstRow.length > 0) {
        let matchedHeaderCount = 0;
        firstRow.forEach((colStr, idx) => {
          const col = (colStr || '').toLowerCase().trim();
          if (col.includes('barcode pg') || col.includes('barcode 1') || col.includes('kode 1') || col === 'barcode') {
            barcode1Idx = idx;
            matchedHeaderCount++;
          } else if (col.includes('barcode gl') || col.includes('barcode 2') || col.includes('kode 2') || col.includes('ean')) {
            barcode2Idx = idx;
            matchedHeaderCount++;
          } else if (col.includes('foto') || col.includes('link') || col.includes('gambar') || col.includes('image')) {
            photoUrlIdx = idx;
            matchedHeaderCount++;
          } else if (col.includes('nama') || col.includes('product') || col.includes('item') || col.includes('barang')) {
            nameIdx = idx;
            matchedHeaderCount++;
          } else if (col.includes('harga') || col.includes('price')) {
            priceIdx = idx;
            matchedHeaderCount++;
          } else if (col.includes('kategori') || col.includes('category') || col.includes('tipe')) {
            categoryIdx = idx;
            matchedHeaderCount++;
          } else if (col.includes('stok') || col.includes('stock') || col.includes('qty')) {
            stockIdx = idx;
            matchedHeaderCount++;
          }
        });

        if (matchedHeaderCount >= 2) {
          startIdx = 1; // Skip header row
        }
      }

      const products: CSVProductRow[] = [];
      for (let i = startIdx; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const barcode1 = (row[barcode1Idx] || '').trim();
        const barcode2 = (row[barcode2Idx] || '').trim();
        const photoUrlRaw = (row[photoUrlIdx] || '').trim();
        const name = (row[nameIdx] || '').trim();
        
        const priceStr = priceIdx >= 0 && row[priceIdx] ? (row[priceIdx] || '').replace(/[^0-9]/g, '') : '';
        const parsedPrice = priceStr ? parseInt(priceStr, 10) : 0;

        const category = categoryIdx >= 0 && row[categoryIdx] ? (row[categoryIdx] || '').trim() : '';

        // Skip completely empty rows
        if (!barcode1 && !barcode2 && !name) continue;

        const processedPhotoUrl = processGoogleDriveUrl(photoUrlRaw);
        const uniqueId = `prod_${i}_${barcode1 || barcode2 || Math.random().toString(36).substring(2, 8)}`;

        products.push({
          id: uniqueId,
          barcode1: barcode1,
          barcode2: barcode2,
          photoUrl: processedPhotoUrl,
          name: name || `Produk ${i}`,
          price: parsedPrice,
          category: category
        });
      }

      return res.json({
        success: true,
        products,
        total: products.length,
        syncedAt: new Date().toISOString(),
        sourceUrl: successfulUrl
      });
    } catch (error: any) {
      console.error('Error syncing CSV:', error);
      return res.status(500).json({
        error: error.message || 'Terjadi kesalahan saat memproses spreadsheet CSV'
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
