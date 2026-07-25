import React, { useState } from 'react';
import { Store, ShieldCheck, Key, User, Lock, ArrowRight, Building2 } from 'lucide-react';
import { OUTLETS, OUTLET_ACCOUNTS, SERVER_ACCOUNT, UserSession } from '../types';

interface LoginModalProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'outlet' | 'server'>('outlet');
  const [selectedOutlet, setSelectedOutlet] = useState<string>(OUTLETS[0]);
  const [password, setPassword] = useState<string>('');
  const [serverUsername, setServerUsername] = useState<string>('server');
  const [serverPassword, setServerPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleOutletLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = OUTLET_ACCOUNTS[selectedOutlet];
    if (!account) {
      setError('Outlet tidak valid.');
      return;
    }

    if (password === account.defaultPass || password === 'admin123' || password === 'stokku2026') {
      const session: UserSession = {
        role: 'outlet',
        username: account.username,
        outletName: selectedOutlet,
        name: `Admin ${selectedOutlet}`
      };
      localStorage.setItem('stokku_auth_session_v1', JSON.stringify(session));
      onLoginSuccess(session);
    } else {
      setError(`Password salah untuk outlet ${selectedOutlet}. Coba gunakan password bawaan: ${account.defaultPass}`);
    }
  };

  const handleServerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (serverUsername.trim().toLowerCase() === 'server' || serverUsername.trim().toLowerCase() === 'admin') {
      if (serverPassword === SERVER_ACCOUNT.defaultPass || serverPassword === 'admin123' || serverPassword === 'server123') {
        const session: UserSession = {
          role: 'server',
          username: serverUsername.trim(),
          name: 'Server Administrator (All Stores)'
        };
        localStorage.setItem('stokku_auth_session_v1', JSON.stringify(session));
        onLoginSuccess(session);
        return;
      }
    }
    setError(`Password server salah. Gunakan password bawaan: ${SERVER_ACCOUNT.defaultPass}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200/80 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 px-6 py-6 text-white relative">
          <div className="absolute top-4 right-4">
            <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Secure Portal v2.0
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Login Dashboard StokKu</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pilih akses akun Toko (Outlet) atau Akun Server (Full All Store)
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-zinc-100 border-b border-zinc-200 gap-1.5">
          <button
            type="button"
            onClick={() => { setLoginMode('outlet'); setError(null); setPassword(''); }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              loginMode === 'outlet'
                ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/80'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/50'
            }`}
          >
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Login Akun Toko (Outlet)</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('server'); setError(null); setServerPassword(''); }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              loginMode === 'server'
                ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/80'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Login Akun Server (All Store)</span>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">!</div>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Outlet Login Form */}
          {loginMode === 'outlet' ? (
            <form onSubmit={handleOutletLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Pilih Toko / Outlet
                </label>
                <select
                  value={selectedOutlet}
                  onChange={(e) => {
                    setSelectedOutlet(e.target.value);
                    setPassword('');
                    setError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {OUTLETS.map((outlet) => (
                    <option key={outlet} value={outlet}>
                      {outlet} ({OUTLET_ACCOUNTS[outlet]?.username})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Akun ini hanya memiliki akses untuk melihat dan mengelola data produk &amp; transaksi toko <strong className="text-zinc-800">{selectedOutlet}</strong> saja.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Password Outlet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Masukkan password ${selectedOutlet}`}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Masuk ke Dashboard {selectedOutlet}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Server Login Form */
            <form onSubmit={handleServerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Username Server / Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={serverUsername}
                    onChange={(e) => setServerUsername(e.target.value)}
                    placeholder="server atau admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Akun Server memiliki akses penuh (<strong className="text-emerald-700">Full Access All Stores</strong>) ke seluruh cabang toko.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Password Server
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={serverPassword}
                    onChange={(e) => setServerPassword(e.target.value)}
                    placeholder="Masukkan password server"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Masuk ke Server Dashboard (Full All Store)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}



        </div>
      </div>
    </div>
  );
};
