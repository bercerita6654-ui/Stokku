import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Calendar, 
  Filter, 
  Printer,
  Search,
  Package,
  TrendingUp,
  Boxes
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Transaction } from '../types';
import { formatDateIndonesian, formatRupiah, getStoredOperator } from '../lib/storage';
import { Store } from 'lucide-react';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  transactions: Transaction[];
  activeOutlet?: string;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  products,
  transactions,
  activeOutlet = 'Planet gadget 3'
}) => {
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Categories list for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter transactions based on selected date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
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
      } else if (dateFilter === 'custom') {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (txDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (txDate > e) return false;
        }
      }

      return true;
    });
  }, [transactions, dateFilter, startDate, endDate]);

  // Extract unique sales dates sorted chronologically
  const uniqueSalesDates = useMemo(() => {
    const datesMap = new Map<string, string>(); // dateKey (YYYY-MM-DD) -> label (DD/MM/YYYY)
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'TERJUAL') {
        const d = new Date(tx.createdAt);
        if (!isNaN(d.getTime())) {
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          datesMap.set(dateKey, label);
        }
      }
    });

    const sortedKeys = Array.from(datesMap.keys()).sort();
    return sortedKeys.map((key) => ({
      key,
      label: datesMap.get(key)!
    }));
  }, [filteredTransactions]);

  // Compute sales per product broken down by date
  const productSalesMap = useMemo(() => {
    const map = new Map<string, { totalSold: number; byDate: Record<string, number> }>();

    filteredTransactions.forEach((tx) => {
      if (tx.type !== 'TERJUAL') return;
      const d = new Date(tx.createdAt);
      if (isNaN(d.getTime())) return;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      tx.items.forEach((item) => {
        const existing = map.get(item.productId) || { totalSold: 0, byDate: {} };
        existing.totalSold += item.quantity;
        existing.byDate[dateKey] = (existing.byDate[dateKey] || 0) + item.quantity;
        map.set(item.productId, existing);
      });
    });

    return map;
  }, [filteredTransactions]);

  // Calculate Total Masuk for each product
  const calculateTotalIncoming = (product: Product): number => {
    if (typeof product.totalIncoming === 'number' && product.totalIncoming > 0) {
      return product.totalIncoming;
    }
    // Sum of MASUK transactions if present
    const incomingTxQty = transactions
      .filter((tx) => tx.type === 'MASUK')
      .reduce((sum, tx) => {
        const item = tx.items.find((i) => i.productId === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);

    const baseStockPlusOutgoing = product.stock + (product.totalOutgoing || 0);
    return Math.max(baseStockPlusOutgoing, incomingTxQty);
  };

  // Combined report product rows
  const reportProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return p.name.toLowerCase().includes(q) || (p.barcode1 && p.barcode1.includes(q));
        }
        return true;
      })
      .map((product) => {
        const salesData = productSalesMap.get(product.id) || {
          totalSold: product.totalOutgoing || 0,
          byDate: {}
        };
        const totalMasuk = calculateTotalIncoming(product);

        return {
          ...product,
          totalMasuk,
          totalSold: salesData.totalSold,
          salesByDate: salesData.byDate
        };
      });
  }, [products, selectedCategory, searchQuery, productSalesMap, transactions]);

  // Aggregate totals
  const totalMasukAll = reportProducts.reduce((sum, p) => sum + p.totalMasuk, 0);
  const totalSoldAll = reportProducts.reduce((sum, p) => sum + p.totalSold, 0);
  const totalStockAll = reportProducts.reduce((sum, p) => sum + p.stock, 0);

  // Download PDF Handler
  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      // Determine orientation based on number of date columns
      const isLandscape = uniqueSalesDates.length > 3;
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;

      // Format custom pull timestamp header (e.g. Data di tarik pada : Sabtu, 25 Jul 2026 | 08:20)
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const now = new Date();
      const dayName = days[now.getDay()];
      const dateNum = now.getDate();
      const monthName = months[now.getMonth()];
      const yearNum = now.getFullYear();
      const hoursStr = String(now.getHours()).padStart(2, '0');
      const minsStr = String(now.getMinutes()).padStart(2, '0');
      const headerTimestamp = `Data di tarik pada : ${dayName}, ${dateNum} ${monthName} ${yearNum} | ${hoursStr}:${minsStr}`;

      // Header Banner
      doc.setFillColor(234, 88, 12); // Orange 600
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('LAPORAN STOK & PENJUALAN', 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 237, 213); // Orange 100
      doc.text(`${headerTimestamp}  |  Outlet : ${activeOutlet}`, 14, 18);

      // Period Information
      let periodLabel = 'Semua Tanggal';
      if (dateFilter === 'today') periodLabel = 'Hari Ini';
      else if (dateFilter === 'week') periodLabel = '7 Hari Terakhir';
      else if (dateFilter === 'month') periodLabel = 'Bulan Ini';
      else if (dateFilter === 'custom' && (startDate || endDate)) {
        periodLabel = `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`;
      }

      doc.setTextColor(39, 39, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Periode Filter: ${periodLabel}`, 14, 35);

      // Top Summary Badges Box
      doc.setFillColor(244, 244, 245);
      doc.roundedRect(14, 38, pageWidth - 28, 16, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(113, 113, 122);

      const colSpacing = isLandscape ? 65 : 45;
      doc.text('TOTAL PRODUK', 20, 44);
      doc.text('TOTAL STOK MASUK', 20 + colSpacing, 44);
      doc.text('TOTAL STOK TERJUAL', 20 + colSpacing * 2, 44);
      doc.text('STOK SAAT INI', 20 + colSpacing * 3, 44);

      doc.setFontSize(10.5);
      doc.setTextColor(24, 24, 27);
      doc.text(`${reportProducts.length} Item`, 20, 50);
      doc.text(`${totalMasukAll} Pcs`, 20 + colSpacing, 50);
      doc.text(`${totalSoldAll} Pcs`, 20 + colSpacing * 2, 50);
      doc.text(`${totalStockAll} Pcs`, 20 + colSpacing * 3, 50);

      // Build Table Headers dynamically
      // Required columns: [No, Nama Produk, Total Masuk, ...[Terjual per Tanggal]..., Total Terjual, Stock Saat ini]
      const headColumns: string[] = ['No', 'Nama Produk', 'Total Masuk'];

      if (uniqueSalesDates.length > 0) {
        uniqueSalesDates.forEach((d) => {
          headColumns.push(`Terjual (${d.label})`);
        });
        headColumns.push('Total Terjual');
      } else {
        headColumns.push('Total Terjual');
      }

      headColumns.push('Stock Saat ini');

      // Build Table Rows
      const tableRows = reportProducts.map((p, idx) => {
        const row: string[] = [
          (idx + 1).toString(),
          p.name,
          `${p.totalMasuk} ${p.unit || 'Pcs'}`
        ];

        if (uniqueSalesDates.length > 0) {
          uniqueSalesDates.forEach((d) => {
            const soldOnDate = p.salesByDate[d.key] || 0;
            row.push(soldOnDate > 0 ? `${soldOnDate} ${p.unit || 'Pcs'}` : '-');
          });
          row.push(`${p.totalSold} ${p.unit || 'Pcs'}`);
        } else {
          row.push(`${p.totalSold} ${p.unit || 'Pcs'}`);
        }

        row.push(`${p.stock} ${p.unit || 'Pcs'}`);
        return row;
      });

      // Total Summary Row at bottom of table
      const summaryRow: string[] = ['-', 'TOTAL KESELURUHAN', `${totalMasukAll} Pcs`];
      if (uniqueSalesDates.length > 0) {
        uniqueSalesDates.forEach((d) => {
          const dateTotal = reportProducts.reduce((sum, p) => sum + (p.salesByDate[d.key] || 0), 0);
          summaryRow.push(`${dateTotal} Pcs`);
        });
        summaryRow.push(`${totalSoldAll} Pcs`);
      } else {
        summaryRow.push(`${totalSoldAll} Pcs`);
      }
      summaryRow.push(`${totalStockAll} Pcs`);

      tableRows.push(summaryRow);

      // Generate AutoTable
      autoTable(doc, {
        startY: 58,
        head: [headColumns],
        body: tableRows,
        styles: {
          fontSize: isLandscape ? 8 : 7.5,
          cellPadding: 2.5
        },
        headStyles: {
          fillColor: [234, 88, 12], // Orange 600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        didParseCell: (data) => {
          // Highlight final summary row
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [228, 228, 231]; // Zinc 200
            data.cell.styles.textColor = [24, 24, 27];
          }
        }
      });

      // Add Page Numbers
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);
        doc.text(
          `Halaman ${i} dari ${pageCount} - Dokumen Laporan Stok & Penjualan StokKu`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      // Download file
      const filename = `Laporan_Stok_Terjual_StokKu_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Gagal memproses file PDF:', error);
      alert('Terjadi kesalahan saat mengunduh laporan PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Unduh Laporan Stok & Penjualan PDF</h3>
                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Store className="w-3 h-3 text-orange-400" />
                  {activeOutlet}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Format Laporan: Nama Produk | Total Masuk | Total Terjual (Per Tanggal) | Stock Saat ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-6 bg-zinc-50 border-b border-zinc-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Preset */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Filter Periode Tanggal
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 focus:ring-2 focus:ring-zinc-900 focus:outline-hidden"
              >
                <option value="all">Semua Tanggal (All-Time)</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">Bulan Ini</option>
                <option value="custom">Rentang Tanggal Custom</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-zinc-500" /> Filter Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 focus:ring-2 focus:ring-zinc-900 focus:outline-hidden"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Filter */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-zinc-500" /> Cari Produk
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama produk..."
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 focus:ring-2 focus:ring-zinc-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Custom Date Picker Inputs */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t border-zinc-200">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs"
                />
              </div>
              <span className="text-zinc-400 mt-5">s/d</span>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Metric Badges */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-100 p-3.5 rounded-xl border border-zinc-200">
              <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Total Produk</span>
              <span className="text-lg font-bold text-zinc-900">{reportProducts.length} Jenis</span>
            </div>
            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
              <span className="text-[11px] text-blue-600 font-semibold block uppercase">Total Stock Masuk</span>
              <span className="text-lg font-bold text-blue-800">{totalMasukAll} Pcs</span>
            </div>
            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200">
              <span className="text-[11px] text-rose-600 font-semibold block uppercase">Total Terjual</span>
              <span className="text-lg font-bold text-rose-800">{totalSoldAll} Pcs</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-600 font-semibold block uppercase">Stock Saat Ini</span>
              <span className="text-lg font-bold text-emerald-800">{totalStockAll} Pcs</span>
            </div>
          </div>

          {/* Dynamic Table Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <span>Pratinjau Tabel Laporan PDF</span>
                {uniqueSalesDates.length > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {uniqueSalesDates.length} Tanggal Penjual
                  </span>
                )}
              </h4>
              <span className="text-[11px] text-zinc-500">
                Kolom PDF: Nama Produk | Total Masuk | {uniqueSalesDates.length > 0 ? 'Terjual Per Tanggal' : 'Total Terjual'} | Stock Saat Ini
              </span>
            </div>

            <div className="border border-zinc-200 rounded-xl overflow-x-auto max-h-72 scrollbar-thin">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-orange-600 text-white font-bold sticky top-0">
                  <tr>
                    <th className="p-3 text-center w-10">No</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3 text-center bg-orange-700">Total Masuk</th>

                    {/* Per date dynamic headers */}
                    {uniqueSalesDates.length > 0 ? (
                      uniqueSalesDates.map((d) => (
                        <th key={d.key} className="p-3 text-center bg-orange-800">
                          Terjual ({d.label})
                        </th>
                      ))
                    ) : (
                      <th className="p-3 text-center bg-orange-800">Total Terjual</th>
                    )}

                    {uniqueSalesDates.length > 0 && (
                      <th className="p-3 text-center bg-orange-900">Total Terjual</th>
                    )}

                    <th className="p-3 text-center bg-orange-700">Stock Saat Ini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {reportProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5 + uniqueSalesDates.length} className="p-8 text-center text-zinc-500">
                        Tidak ada data produk yang memenuhi filter.
                      </td>
                    </tr>
                  ) : (
                    reportProducts.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-zinc-50">
                        <td className="p-3 text-center text-zinc-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-semibold text-zinc-900">{p.name}</td>
                        <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/50">
                          {p.totalMasuk} {p.unit || 'Pcs'}
                        </td>

                        {/* Per date values */}
                        {uniqueSalesDates.length > 0 ? (
                          uniqueSalesDates.map((d) => {
                            const qtySold = p.salesByDate[d.key] || 0;
                            return (
                              <td
                                key={d.key}
                                className={`p-3 text-center ${
                                  qtySold > 0 ? 'font-bold text-rose-600 bg-rose-50/40' : 'text-zinc-400'
                                }`}
                              >
                                {qtySold > 0 ? `${qtySold} ${p.unit || 'Pcs'}` : '-'}
                              </td>
                            );
                          })
                        ) : (
                          <td className="p-3 text-center font-bold text-rose-600 bg-rose-50/40">
                            {p.totalSold} {p.unit || 'Pcs'}
                          </td>
                        )}

                        {uniqueSalesDates.length > 0 && (
                          <td className="p-3 text-center font-bold text-rose-700 bg-rose-100/40">
                            {p.totalSold} {p.unit || 'Pcs'}
                          </td>
                        )}

                        <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/50">
                          {p.stock} {p.unit || 'Pcs'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {reportProducts.length > 0 && (
                  <tfoot className="bg-zinc-100 font-bold border-t-2 border-zinc-300">
                    <tr>
                      <td className="p-3 text-center text-zinc-500">-</td>
                      <td className="p-3 text-zinc-900">TOTAL KESELURUHAN</td>
                      <td className="p-3 text-center text-blue-800">{totalMasukAll} Pcs</td>

                      {uniqueSalesDates.length > 0 ? (
                        uniqueSalesDates.map((d) => {
                          const dateTotal = reportProducts.reduce((sum, p) => sum + (p.salesByDate[d.key] || 0), 0);
                          return (
                            <td key={d.key} className="p-3 text-center text-rose-800">
                              {dateTotal} Pcs
                            </td>
                          );
                        })
                      ) : (
                        <td className="p-3 text-center text-rose-800">{totalSoldAll} Pcs</td>
                      )}

                      {uniqueSalesDates.length > 0 && (
                        <td className="p-3 text-center text-rose-900">{totalSoldAll} Pcs</td>
                      )}

                      <td className="p-3 text-center text-emerald-800">{totalStockAll} Pcs</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-zinc-100 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            PDF disusun secara rapi dengan kolom: Nama Produk | Total Masuk | Terjual Per Tanggal | Stock Saat Ini.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-200 font-semibold text-xs transition"
            >
              Batal
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating || reportProducts.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Membuat PDF...' : 'Unduh Laporan PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
