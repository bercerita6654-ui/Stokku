export interface UserSession {
  role: 'server' | 'outlet';
  username: string;
  outletName?: string;
  name: string;
}

export const OUTLET_ACCOUNTS: Record<string, { username: string; defaultPass: string; label: string }> = {
  'Planet gadget 3': { username: 'planetgadget3', defaultPass: 'pg3_pass2026', label: 'Planet gadget 3' },
  'Cellular World canggu': { username: 'canggu', defaultPass: 'canggu_pass2026', label: 'Cellular World canggu' },
  'Cellular World Tengku Umar': { username: 'tengkuumar', defaultPass: 'tengkuumar_pass2026', label: 'Cellular World Tengku Umar' },
  'Cellular World Infinity': { username: 'infinity', defaultPass: 'infinity_pass2026', label: 'Cellular World Infinity' },
  'Planet gadget 1': { username: 'planetgadget1', defaultPass: 'pg1_pass2026', label: 'Planet gadget 1' },
  'Planet gadget 2': { username: 'planetgadget2', defaultPass: 'pg2_pass2026', label: 'Planet gadget 2' },
};

export const SERVER_ACCOUNT = {
  username: 'server',
  defaultPass: 'server_master2026',
  label: 'Server (Full Access All Stores)'
};

export type TransactionType = 'MASUK' | 'TERJUAL';

export const OUTLETS = [
  'Planet gadget 3',
  'Cellular World canggu',
  'Cellular World Tengku Umar',
  'Cellular World Infinity',
  'Planet gadget 1',
  'Planet gadget 2'
] as const;

export type OutletName = typeof OUTLETS[number];

export interface Product {
  id: string;
  barcode1: string;
  barcode2: string;
  photoUrl: string;
  name: string;
  category: string;
  stock: number;
  totalIncoming?: number;
  totalOutgoing?: number;
  minStock: number;
  price: number;
  costPrice: number;
  unit: string;
  updatedAt: string;
  outlet?: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  barcode1: string;
  barcode2: string;
  photoUrl: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  outlet?: string;
  items: TransactionItem[];
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  note: string;
  operator: string;
  createdAt: string;
}

export interface SyncStatus {
  lastSynced: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  totalSynced?: number;
  sheetUrl: string;
}

export interface FilterOptions {
  searchQuery: string;
  stockFilter: 'all' | 'available' | 'low' | 'out_of_stock';
  categoryFilter: string;
  sortBy: 'name' | 'stock_asc' | 'stock_desc' | 'updated';
}
