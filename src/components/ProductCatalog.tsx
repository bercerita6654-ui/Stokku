import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Barcode, 
  Image as ImageIcon, 
  Package, 
  Edit, 
  Trash2,
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle, 
  Check, 
  X,
  Grid,
  List,
  ExternalLink
} from 'lucide-react';
import { Product, FilterOptions } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ImagePreviewModal } from './ImagePreviewModal';
import { ZoomIn } from 'lucide-react';
import { formatRupiah, saveProducts, formatPhotoUrl, deleteProduct } from '../lib/storage';

interface ProductCatalogProps {
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
  onFastTransaction: (product: Product, type: 'MASUK' | 'TERJUAL') => void;
  onOpenScanner: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onProductsUpdated,
  onFastTransaction,
  onOpenScanner
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low' | 'out_of_stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Selected Product for Details or Editing
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModal, setIsNewProductModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [showEditMenu, setShowEditMenu] = useState(false);

  // Dynamic Categories from Products list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // New product form state
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    barcode1: '',
    barcode2: '',
    photoUrl: '',
    category: 'Umum',
    stock: 0,
    minStock: 5,
    unit: 'Pcs'
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode1.toLowerCase().includes(q) ||
        p.barcode2.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));

      // Category filter match
      const matchCategory =
        selectedCategory === 'all' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      // Stock filter match
      let matchStock = true;
      if (stockFilter === 'available') matchStock = p.stock > 0;
      else if (stockFilter === 'low') matchStock = p.stock <= p.minStock && p.stock > 0;
      else if (stockFilter === 'out_of_stock') matchStock = p.stock === 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Handle Save Edit Product
  const handleSaveEditProduct = () => {
    if (!editingProduct) return;
    const formattedProduct = {
      ...editingProduct,
      photoUrl: formatPhotoUrl(editingProduct.photoUrl)
    };
    const updated = products.map((p) => (p.id === editingProduct.id ? formattedProduct : p));
    saveProducts(updated);
    onProductsUpdated(updated);
    setEditingProduct(null);
  };

  // Handle Delete Product
  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeletingProduct({ id: productId, name: productName });
  };

  const confirmDeleteProduct = () => {
    if (!deletingProduct) return;
    const updated = deleteProduct(deletingProduct.id);
    onProductsUpdated(updated);
    if (editingProduct?.id === deletingProduct.id) {
      setEditingProduct(null);
    }
    setDeletingProduct(null);
  };

  // Handle Create Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name) return;

    const newProd: Product = {
      id: `prod_manual_${Date.now()}`,
      name: newProductForm.name.trim(),
      barcode1: newProductForm.barcode1.trim(),
      barcode2: newProductForm.barcode2.trim(),
      photoUrl: formatPhotoUrl(newProductForm.photoUrl),
      category: newProductForm.category || 'Umum',
      stock: Number(newProductForm.stock) || 0,
      minStock: Number(newProductForm.minStock) || 5,
      price: 0,
      costPrice: 0,
      unit: newProductForm.unit || 'Pcs',
      updatedAt: new Date().toISOString()
    };

    const updated = [newProd, ...products];
    saveProducts(updated);
    onProductsUpdated(updated);
    setIsNewProductModal(false);
    setNewProductForm({
      name: '',
      barcode1: '',
      barcode2: '',
      photoUrl: '',
      category: 'Umum',
      stock: 0,
      minStock: 5,
      unit: 'Pcs'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter & Action Header */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-800">Katalog & Stok Produk</h2>
            <p className="text-xs text-zinc-500">
              Total {products.length} item terdaftar ({filteredProducts.length} ditampilkan)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsNewProductModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Produk Baru</span>
            </button>

            <button
              onClick={() => setShowEditMenu(!showEditMenu)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                showEditMenu
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-zinc-200/80'
              }`}
              title="Tampilkan / Sembunyikan Menu Edit Data Produk"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{showEditMenu ? 'Menu Edit: Tampil' : 'Menu Edit: Tersembunyi'}</span>
            </button>

            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-800'
                }`}
                title="Tampilan Grid Card"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-800'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar & Category Select */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama Produk, Barcode 1, Barcode 2, Kategori..."
              className="w-full pl-10 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-700 focus:outline-none cursor-pointer w-full"
            >
              <option value="all">Semua Kategori ({products.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({products.filter((p) => p.category === cat).length})
                </option>
              ))}
            </select>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-zinc-400 hover:text-zinc-600 shrink-0"
                title="Reset Filter Kategori"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Row: Categories & Stock Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100">
          {/* Category Chips (if any) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 shrink-0">
              Kategori:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
              }`}
            >
              Semua ({products.length})
            </button>
            {availableCategories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Stock Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 shrink-0">
              Stok:
            </span>
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                stockFilter === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStockFilter('available')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                stockFilter === 'available'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Ada
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                stockFilter === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Menipis
            </button>
            <button
              onClick={() => setStockFilter('out_of_stock')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                stockFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Habis
            </button>
          </div>
        </div>
      </div>

      {/* Product List View */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-700 text-sm">Produk Tidak Ditemukan</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau pastikan telah menyinkronkan data dari Google Sheets.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition flex flex-col justify-between group relative"
            >
              <div>
                {/* Photo Header */}
                <div 
                  onClick={() => product.photoUrl && setPreviewProduct(product)}
                  className={`aspect-square w-full rounded-xl bg-zinc-50 mb-3 overflow-hidden border border-zinc-100 relative group/img ${
                    product.photoUrl ? 'cursor-pointer' : ''
                  }`}
                  title={product.photoUrl ? 'Klik untuk memperbesar gambar produk' : undefined}
                >
                  {product.photoUrl ? (
                    <>
                      <img
                        src={formatPhotoUrl(product.photoUrl)}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover/img:scale-105 transition duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.triedFallback && product.photoUrl) {
                            target.dataset.triedFallback = 'true';
                            const idMatch = product.photoUrl.match(/([a-zA-Z0-9_-]{15,})/);
                            if (idMatch) {
                              target.src = `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
                              return;
                            }
                          }
                          target.style.display = 'none';
                        }}
                      />
                      {/* Zoom Icon Overlay on Hover */}
                      <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white p-2 text-center pointer-events-none">
                        <div className="p-2.5 rounded-full bg-black/60 backdrop-blur-xs mb-1">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold">Klik untuk Perbesar</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-4 text-center">
                      <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[10px] text-zinc-400">Tidak Ada Foto</span>
                    </div>
                  )}

                  {/* Stock Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-2xs ${
                        product.stock === 0
                          ? 'bg-rose-500 text-white'
                          : product.stock <= product.minStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      Stok: {product.stock} {product.unit}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                      {product.category || 'Umum'}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-bold text-sm text-zinc-800 line-clamp-2 min-h-[2.5rem]" title={product.name}>
                  {product.name}
                </h3>

                {/* Barcodes Display (Kolom 1 & Kolom 2) */}
                <div className="mt-2 space-y-1 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                    <Barcode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-500">B1:</span>
                    <span className="font-mono text-zinc-800 font-medium truncate">
                      {product.barcode1 || '-'}
                    </span>
                  </div>
                  {product.barcode2 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                      <Barcode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-semibold text-zinc-500">B2:</span>
                      <span className="font-mono text-zinc-800 font-medium truncate">
                        {product.barcode2}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onFastTransaction(product, 'MASUK')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
                    title="Tambah Barang Masuk"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>+ Masuk</span>
                  </button>

                  <button
                    onClick={() => onFastTransaction(product, 'TERJUAL')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                    title="Catat Barang Terjual"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>- Terjual</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {showEditMenu && (
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition"
                      title="Edit Data Produk"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Produk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW - FULL NON-TRUNCATED MOBILE FRIENDLY NO PAGINATION */
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 text-[11px] font-bold uppercase tracking-wider border-b border-zinc-200 whitespace-nowrap">
                  <th className="py-3 px-3 min-w-[60px]">Foto</th>
                  <th className="py-3 px-3 min-w-[200px]">Nama Produk</th>
                  <th className="py-3 px-3 min-w-[150px]">Barcode 1 & 2</th>
                  <th className="py-3 px-3 min-w-[120px]">Stok Saat Ini</th>
                  <th className="py-3 px-3 min-w-[180px] text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-2.5 px-3">
                      {product.photoUrl ? (
                        <img
                          src={formatPhotoUrl(product.photoUrl)}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-100 border border-zinc-200"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.triedFallback && product.photoUrl) {
                              target.dataset.triedFallback = 'true';
                              const idMatch = product.photoUrl.match(/([a-zA-Z0-9_-]{15,})/);
                              if (idMatch) {
                                target.src = `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
                                return;
                              }
                            }
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-zinc-800 text-xs break-words">
                      <div>{product.name}</div>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium border border-zinc-200/60">
                          {product.category || 'Umum'}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                      <div><span className="text-zinc-400 font-sans">B1:</span> {product.barcode1 || '-'}</div>
                      {product.barcode2 && (
                        <div><span className="text-zinc-400 font-sans">B2:</span> {product.barcode2}</div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.stock === 0
                            ? 'bg-rose-100 text-rose-800'
                            : product.stock <= product.minStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {product.stock} {product.unit}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onFastTransaction(product, 'MASUK')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition"
                        >
                          + Masuk
                        </button>
                        <button
                          onClick={() => onFastTransaction(product, 'TERJUAL')}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition"
                        >
                          - Terjual
                        </button>
                        {showEditMenu && (
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition"
                            title="Edit Produk"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded transition"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-800 text-base">Edit Detail Produk</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Barcode 1</label>
                  <input
                    type="text"
                    value={editingProduct.barcode1}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode1: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Barcode 2</label>
                  <input
                    type="text"
                    value={editingProduct.barcode2}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode2: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Kategori Produk</label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    placeholder="Contoh: Powerbank, Cable..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Link Foto Produk</label>
                  <input
                    type="text"
                    value={editingProduct.photoUrl}
                    onChange={(e) => setEditingProduct({ ...editingProduct, photoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Jumlah Stok Saat Ini</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Batas Stok Rendah</label>
                  <input
                    type="number"
                    value={editingProduct.minStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: Number(e.target.value) || 5 })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <button
                onClick={() => handleDeleteProduct(editingProduct.id, editingProduct.name)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Produk</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-semibold hover:bg-zinc-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEditProduct}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {isNewProductModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-800 text-base">Tambah Produk Manual</h3>
              <button
                type="button"
                onClick={() => setIsNewProductModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  placeholder="Contoh: Kopi Susu Aren 250ml"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Barcode 1 (Kolom 1)</label>
                  <input
                    type="text"
                    value={newProductForm.barcode1}
                    onChange={(e) => setNewProductForm({ ...newProductForm, barcode1: e.target.value })}
                    placeholder="8991234567..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Barcode 2 (Kolom 2)</label>
                  <input
                    type="text"
                    value={newProductForm.barcode2}
                    onChange={(e) => setNewProductForm({ ...newProductForm, barcode2: e.target.value })}
                    placeholder="Kode Alt..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 font-medium mb-1">Link Foto Produk (Kolom 3)</label>
                <input
                  type="text"
                  value={newProductForm.photoUrl}
                  onChange={(e) => setNewProductForm({ ...newProductForm, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 font-medium mb-1">Satuan</label>
                  <input
                    type="text"
                    value={newProductForm.unit}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
                    placeholder="Pcs, Box, Pack..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-zinc-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsNewProductModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-semibold hover:bg-zinc-200 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition shadow-xs"
              >
                + Tambah Produk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!deletingProduct}
        title="Hapus Produk dari Katalag"
        message="Apakah Anda yakin ingin menghapus produk ini? Produk yang dihapus tidak akan tampil di katalog."
        itemName={deletingProduct?.name}
        itemDetail={deletingProduct ? `ID: ${deletingProduct.id}` : ''}
        confirmButtonText="Hapus Produk"
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeletingProduct(null)}
      />
      {/* Image Preview / Zoom Modal */}
      <ImagePreviewModal
        isOpen={!!previewProduct}
        photoUrl={previewProduct?.photoUrl || null}
        productName={previewProduct?.name}
        category={previewProduct?.category}
        barcode1={previewProduct?.barcode1}
        barcode2={previewProduct?.barcode2}
        onClose={() => setPreviewProduct(null)}
      />
    </div>
  );
};
