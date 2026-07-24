import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { Product, Transaction } from '../types';
import { BarChart3, TrendingUp, Award, Calendar, Layers } from 'lucide-react';

interface DashboardChartsProps {
  products: Product[];
  transactions: Transaction[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ products, transactions }) => {
  const [chartView, setChartView] = useState<'terjual' | 'masuk'>('terjual');

  // --- 1. Compute Top Products (Terjual / Masuk) ---
  const productQuantityMap: { [productName: string]: { qty: number; stock: number; category: string } } = {};

  transactions.forEach((tx) => {
    if (tx.type === (chartView === 'terjual' ? 'TERJUAL' : 'MASUK')) {
      tx.items.forEach((item) => {
        const pName = item.productName || 'Produk';
        if (!productQuantityMap[pName]) {
          // find stock from current products list if possible
          const matchedProd = products.find(p => p.name.toLowerCase() === pName.toLowerCase() || p.id === item.productId);
          productQuantityMap[pName] = {
            qty: 0,
            stock: matchedProd ? matchedProd.stock : 0,
            category: matchedProd ? matchedProd.category : 'Umum'
          };
        }
        productQuantityMap[pName].qty += item.quantity;
      });
    }
  });

  const topProductsData = Object.keys(productQuantityMap)
    .map((name) => ({
      name: name.length > 18 ? name.substring(0, 16) + '...' : name,
      fullName: name,
      qty: productQuantityMap[name].qty,
      stock: productQuantityMap[name].stock,
      category: productQuantityMap[name].category
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 7);

  // --- 2. Compute Monthly Transaction Trends ---
  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  
  // Build last 6 months bucket
  const monthlyMap: { [key: string]: { monthKey: string; monthName: string; masuk: number; terjual: number } } = {};
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = `${monthsIndo[d.getMonth()]} ${d.getFullYear()}`;
    monthlyMap[key] = { monthKey: key, monthName, masuk: 0, terjual: 0 };
  }

  // Populate from transactions
  transactions.forEach((tx) => {
    if (!tx.createdAt) return;
    const txDate = new Date(tx.createdAt);
    if (isNaN(txDate.getTime())) return;

    const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap[key]) {
      if (tx.type === 'MASUK') {
        monthlyMap[key].masuk += tx.totalQuantity;
      } else if (tx.type === 'TERJUAL') {
        monthlyMap[key].terjual += tx.totalQuantity;
      }
    } else {
      // If outside last 6 months, create entry dynamically
      const monthName = `${monthsIndo[txDate.getMonth()]} ${txDate.getFullYear()}`;
      monthlyMap[key] = {
        monthKey: key,
        monthName,
        masuk: tx.type === 'MASUK' ? tx.totalQuantity : 0,
        terjual: tx.type === 'TERJUAL' ? tx.totalQuantity : 0
      };
    }
  });

  const monthlyTrendData = Object.values(monthlyMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Colors for Bar chart bars
  const barColors = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6', '#fff1f2'];
  const barColorsMasuk = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#c6f6d5', '#e6fffa'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Bar Chart: Produk Paling Sering Terjual / Masuk */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">
                  {chartView === 'terjual' ? 'Produk Paling Sering Terjual' : 'Produk Paling Banyak Masuk'}
                </h3>
                <p className="text-[11px] text-zinc-400">Peringkat berdasarkan total kuantitas transaksi</p>
              </div>
            </div>

            {/* Toggle View */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartView('terjual')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  chartView === 'terjual' ? 'bg-white text-rose-600 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Terjual
              </button>
              <button
                type="button"
                onClick={() => setChartView('masuk')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  chartView === 'masuk' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Restock
              </button>
            </div>
          </div>

          {topProductsData.length === 0 ? (
            <div className="text-center py-12 px-4 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200 my-4">
              <BarChart3 className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-zinc-700">Belum Ada Data Transaksi</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Data grafik akan terisi setelah transaksi barang dicatat.</p>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#71717a' }} 
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#71717a' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-zinc-800">
                            <p className="font-bold text-zinc-100">{data.fullName}</p>
                            <p className="text-[11px] text-zinc-400">Kategori: {data.category}</p>
                            <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-800">
                              <span className={chartView === 'terjual' ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                                Total {chartView === 'terjual' ? 'Terjual' : 'Masuk'}:
                              </span>
                              <span className="font-black text-white">{data.qty} Qty</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-zinc-400">
                              <span>Sisa Stok Saat Ini:</span>
                              <span className="font-bold text-zinc-200">{data.stock}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="qty" radius={[8, 8, 0, 0]}>
                    {topProductsData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={chartView === 'terjual' ? (barColors[index % barColors.length]) : (barColorsMasuk[index % barColorsMasuk.length])} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-100">
          <span>Menampilkan hingga 7 produk teratas</span>
          <span className="font-medium text-zinc-600">Terupdate Real-Time</span>
        </div>
      </div>

      {/* 2. Area Chart: Tren Transaksi Bulanan */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">Tren Transaksi Bulanan</h3>
                <p className="text-[11px] text-zinc-400">Perbandingan kuantitas Barang Masuk vs Barang Terjual</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-zinc-600">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-zinc-600">Terjual</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTerjual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="monthName" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-zinc-800">
                          <p className="font-bold text-zinc-200 border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Periode {label}</span>
                          </p>
                          {payload.map((entry, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-6">
                              <span className="flex items-center gap-1.5 text-zinc-300">
                                <span className={`w-2 h-2 rounded-full ${entry.dataKey === 'masuk' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {entry.dataKey === 'masuk' ? 'Barang Masuk:' : 'Barang Terjual:'}
                              </span>
                              <span className="font-bold text-white">{entry.value} Qty</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="masuk"
                  name="Barang Masuk"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMasuk)"
                />
                <Area
                  type="monotone"
                  dataKey="terjual"
                  name="Barang Terjual"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTerjual)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-100">
          <span>Rentang waktu: 6 bulan terakhir</span>
          <span className="font-medium text-zinc-600 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" /> Auto Aggregated
          </span>
        </div>
      </div>
    </div>
  );
};
