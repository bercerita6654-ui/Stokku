export type TransactionType = 'MASUK' | 'TERJUAL';

export interface Product {
  id: string;
  barcode1: string;
  barcode2: string;
  photoUrl: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  costPrice: number;
  unit: string;
  updatedAt: string;
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
