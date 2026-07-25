import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  TrendingUp, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  DollarSign, 
  BarChart3, 
  PieChart as PieIcon, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Search
} from 'lucide-react';
import { OUTLETS, OUTLET_ACCOUNTS } from '../types';
import { getAllOutletsSummary, OutletSummary, formatRupiah } from '../lib/storage';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Cell
} from 'recharts';

interface ServerAnalyticsViewProps {
  onSelectOutlet: (outletName: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'catalog' | 'transaction' | 'history') => void;
}

export const ServerAnalyticsView: React.FC<ServerAnalyticsViewProps> = ({
  onSelectOutlet,
  onNavigateTab
}) => {
  const summaries: OutletSummary[] = getAllOutletsSummary();
  const [searchTerm, setSearchTerm] = useState('');

  // Grand totals across all outlets
  const grandTotalStock = summaries.reduce((acc, s) => acc + s.totalStock, 0);
  const grandTotalValue = summaries.reduce((acc, s) => acc + s.totalValue, 0);
  const grandTotalIncoming = summaries.reduce((acc, s) => acc + s.totalIncoming, 0);
  const grandTotalOutgoing = summaries.reduce((acc, s) => acc + s.totalOutgoing, 0);
  const grandTotalRevenue = summaries.reduce((acc, s) => acc + s.totalRevenue, 0);
  const grandLowStock = summaries.reduce((acc, s) => acc + s.lowStockCount, 0);

  // Chart data preparation
  const chartData = summaries.map(s => ({
    name: s.outletName.replace('Cellular World ', 'CW ').replace('Planet gadget ', 'PG '),
    fullName: s.outletName,
    stok: s.totalStock,
    masuk: s.totalIncoming,
    terjual: s.totalOutgoing,
    pendapatan: s.totalRevenue,
    nilaiAset: s.totalValue
  }));

  const filteredSummaries = summaries.filter(s => 
    s.outletName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Server Master Full Access (6 Toko / Outlet Terpadu)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Analisis Komparasi Penjualan &amp; Stok All Store
            </h1>
            <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl">
              Pantau dan bandingkan performa penjualan (barang terjual), suplai masuk, nilai inventaris, dan status stok kritis di seluruh cabang secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div>
              <p className="text-[11px] text-zinc-400 uppercase font-bold">Total Nilai Aset All Store</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">{formatRupiah(grandTotalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grand Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Stok Gabungan</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{grandTotalStock.toLocaleString('id-ID')}</span>
            <span className="text-xs font-semibold text-zinc-500">Pcs Unit</span>
          </div>
          <p className="text-[11px] text-zinc-400">Dari 6 cabang toko aktif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Penjualan (Keluar)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{grandTotalOutgoing.toLocaleString('id-ID')}</span>
            <span className="text-xs font-semibold text-rose-600">Pcs Terjual</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">Pendapatan: {formatRupiah(grandTotalRevenue)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Suplai Masuk</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{grandTotalIncoming.toLocaleString('id-ID')}</span>
            <span className="text-xs font-semibold text-emerald-600">Pcs Masuk</span>
          </div>
          <p className="text-[11px] text-zinc-400">Akumulasi pengiriman gudang</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stok Menipis / Kritis</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{grandLowStock}</span>
            <span className="text-xs font-semibold text-zinc-500">Item Produk</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">Perlu restock segera</p>
        </div>
      </div>

      {/* Comparative Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Stok & Pendapatan per Outlet */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                Komparasi Stok Unit per Outlet
              </h3>
              <p className="text-xs text-zinc-500">Total volume stok fisik yang tersedia di masing-masing cabang</p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#71717a' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip 
                  formatter={(value: any) => [Number(value).toLocaleString('id-ID') + ' Pcs', 'Total Stok']}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="stok" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Penjualan vs Barang Masuk per Outlet */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Komparasi Suplai Masuk vs Terjual
              </h3>
              <p className="text-xs text-zinc-500">Perbandingan jumlah barang masuk (+) dan barang terjual (-) per outlet</p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#71717a' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    Number(value).toLocaleString('id-ID') + ' Pcs', 
                    name === 'masuk' ? 'Barang Masuk (+)' : 'Barang Terjual (-)'
                  ]}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="masuk" name="Masuk (+)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="terjual" name="Terjual (-)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Outlet Details Comparison Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">
              Rincian Performa &amp; Inventaris Tiap Cabang Toko
            </h3>
            <p className="text-xs text-zinc-500">
              Klik pada tombol &quot;Kelola Toko&quot; untuk langsung mengalihkan sesi aktif ke outlet tersebut.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama outlet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Nama Toko / Outlet</th>
                <th className="py-3.5 px-4 text-center">Jenis Produk</th>
                <th className="py-3.5 px-4 text-center">Total Stok Qty</th>
                <th className="py-3.5 px-4 text-center">Barang Masuk (+)</th>
                <th className="py-3.5 px-4 text-center">Barang Terjual (-)</th>
                <th className="py-3.5 px-4 text-right">Estimasi Pendapatan</th>
                <th className="py-3.5 px-4 text-center">Status Stok</th>
                <th className="py-3.5 px-6 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 text-xs font-medium text-zinc-800">
              {filteredSummaries.map((summary, idx) => {
                const account = OUTLET_ACCOUNTS[summary.outletName];
                return (
                  <tr key={summary.outletName} className="hover:bg-zinc-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{summary.outletName}</p>
                          <p className="text-[11px] text-zinc-400 font-mono">Username: {account?.username || '-'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-lg">
                        {summary.totalProducts} item
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-black text-zinc-900 bg-orange-50 text-orange-800 border border-orange-200/60 px-2.5 py-1 rounded-lg">
                        {summary.totalStock.toLocaleString('id-ID')} Pcs
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        +{summary.totalIncoming.toLocaleString('id-ID')}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">
                        -{summary.totalOutgoing.toLocaleString('id-ID')}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-black text-emerald-600">
                      {formatRupiah(summary.totalRevenue)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {summary.lowStockCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {summary.lowStockCount} Kritis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aman
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onSelectOutlet(summary.outletName)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 active:scale-95"
                      >
                        <span>Kelola Toko</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
