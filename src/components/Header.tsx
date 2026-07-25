import React, { useState } from 'react';
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
  LogOut,
  User as UserIcon,
  Sparkles,
  Store,
  ChevronDown,
  Check
} from 'lucide-react';
import { SyncStatus, OUTLETS, UserSession } from '../types';
import { User } from '../lib/firebase';

interface HeaderProps {
  activeTab: 'dashboard' | 'catalog' | 'transaction' | 'history' | 'settings' | 'server-analytics';
  setActiveTab: (tab: 'dashboard' | 'catalog' | 'transaction' | 'history' | 'settings' | 'server-analytics') => void;
  syncStatus: SyncStatus;
  onSyncNow: () => void;
  currentUser: User | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  isAuthenticating?: boolean;
  activeOutlet: string;
  onOutletChange: (outlet: string) => void;
  userSession: UserSession | null;
  onLogoutSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  syncStatus,
  onSyncNow,
  currentUser,
  onLoginGoogle,
  onLogoutGoogle,
  isAuthenticating = false,
  activeOutlet,
  onOutletChange,
  userSession,
  onLogoutSession
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOutletMenu, setShowOutletMenu] = useState(false);

  const isServer = userSession?.role === 'server';

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
                <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Multi-Device Cloud Sync
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Data Produk Masuk &amp; Terjual
              </p>
            </div>
          </div>

          {/* Outlet Switcher, Sync Status, Google Login & Action */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Outlet Switcher / Badge */}
            {isServer ? (
              <div className="relative">
                <button
                  onClick={() => setShowOutletMenu(!showOutletMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-950 text-xs font-semibold shadow-2xs transition active:scale-95"
                  title="Server Full Access: Ganti Toko Aktif"
                >
                  <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="max-w-[120px] sm:max-w-[170px] truncate font-bold">
                    {activeOutlet}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </button>

                {showOutletMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3.5 py-2 border-b border-zinc-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Server: Pilih Semua Toko
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {OUTLETS.length} Toko
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                      {OUTLETS.map((outletName) => {
                        const isActive = activeOutlet === outletName;
                        return (
                          <button
                            key={outletName}
                            onClick={() => {
                              onOutletChange(outletName);
                              setShowOutletMenu(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 font-bold'
                                : 'text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <Store className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
                              <span className="truncate">{outletName}</span>
                            </div>
                            {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold shadow-2xs">
                <Store className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="max-w-[130px] sm:max-w-[160px] truncate">{activeOutlet}</span>
                <span className="text-[9px] bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded uppercase">Outlet</span>
              </div>
            )}

            {/* User Session Badge & Logout */}
            <div className="flex items-center gap-2 pl-1 border-l border-zinc-200">
              <div className="hidden sm:block text-right">
                <div className="text-[11px] font-bold text-zinc-900 truncate max-w-[110px]">
                  {userSession?.name || 'User'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {isServer ? '👑 Server Admin' : `🏢 ${userSession?.username}`}
                </div>
              </div>
              <button
                onClick={onLogoutSession}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-zinc-200 text-xs font-semibold transition active:scale-95"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-700 gap-2">
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
              title="Sinkronkan data produk dari Google Sheets"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncStatus.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sync Sheets</span>
            </button>

            {/* Google Authentication Button / Avatar */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 transition text-xs font-medium text-zinc-800"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-6 h-6 rounded-full border border-zinc-300 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline font-semibold text-zinc-800 max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'Pengguna'}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3.5 py-2 border-b border-zinc-100">
                      <p className="text-xs font-bold text-zinc-800 truncate">
                        {currentUser.displayName || 'Pengguna Google'}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogoutGoogle();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginGoogle}
                disabled={isAuthenticating}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50"
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
                <span>{isAuthenticating ? 'Masuk...' : 'Login Google'}</span>
              </button>
            )}

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

          {isServer && (
            <button
              onClick={() => setActiveTab('server-analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'server-analytics'
                  ? 'bg-emerald-600 text-white shadow-md animate-pulse'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>👑 Analisis Komparasi All Store</span>
            </button>
          )}

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

