import React from 'react';
import { 
  Package, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  LayoutDashboard, 
  PackageSearch, 
  ArrowLeftRight, 
  History, 
  Settings,
  Sparkles
} from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'catalog' | 'transaction' | 'history' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'catalog' | 'transaction' | 'history' | 'settings') => void;
  syncStatus: SyncStatus;
  onSyncNow: () => void;
  operatorName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  syncStatus,
  onSyncNow,
  operatorName
}) => {
  return (
    <header className="bg-white border-b border-zinc-200/80 text-zinc-900 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-zinc-900">
                  StokKu
                </h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                  Spreadsheet Sync
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Data Produk Masuk & Terjual
              </p>
            </div>
          </div>

          {/* Sync Status & Action */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-700 gap-2">
              {syncStatus.status === 'syncing' ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 text-zinc-900 animate-spin" />
                  <span>Menyinkronkan...</span>
                </>
              ) : syncStatus.status === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-700 font-medium">Sync Gagal</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Terhubung {syncStatus.totalSynced ? `(${syncStatus.totalSynced} item)` : ''}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={onSyncNow}
              disabled={syncStatus.status === 'syncing'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
              title="Sinkronkan data produk dari Google Sheets"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncStatus.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sync Sheets</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-200/60 transition"
              title="Pengaturan URL Spreadsheet"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-zinc-100 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'dashboard'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'catalog'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`}
          >
            <PackageSearch className="w-4 h-4" />
            <span>Katalog Produk</span>
          </button>

          <button
            onClick={() => setActiveTab('transaction')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'transaction'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Catat Masuk / Terjual</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'history'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Transaksi</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition md:hidden ${
              activeTab === 'settings'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
