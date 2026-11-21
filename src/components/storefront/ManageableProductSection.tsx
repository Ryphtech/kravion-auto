'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import { saveProduct, deleteProduct } from '@/lib/data-service';
import { useAuth } from '@/context/AuthContext';
import { Product, Category } from '@/types';
import {
  Sparkles,
  Flame,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Loader2,
  Check,
  Edit3,
} from 'lucide-react';

interface ManageableProductSectionProps {
  sectionId: 'new-arrivals' | 'hot-deals';
  title: string;
  subtitle: string;
  icon: 'sparkles' | 'flame';
  tagText: string;
  badgeText?: string;
  initialProducts: Product[];
  categories: Category[];
  allProductsCount: number;
  adminSectionFilter: string;
  viewAllLink?: string;
}

export function ManageableProductSection({
  sectionId,
  title,
  subtitle,
  icon,
  tagText,
  badgeText,
  initialProducts,
  categories,
  allProductsCount,
  adminSectionFilter,
  viewAllLink = '/products',
}: ManageableProductSectionProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdminUser = profile?.role === 'admin';

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [adminMode, setAdminMode] = useState(false);

  // Sync if initialProducts changes from server revalidation
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Edit Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>(0);
  const [formCompareAtPrice, setFormCompareAtPrice] = useState<number | string>('');
  const [formCategory, setFormCategory] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formStockQuantity, setFormStockQuantity] = useState<number | string>(10);
  const [formDescription, setFormDescription] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormTitle(product.title);
    setFormPrice(product.price);
    setFormCompareAtPrice(product.compareAtPrice ?? '');
    setFormCategory(product.category);
    setFormInStock(product.inStock !== false);
    setFormStockQuantity(product.stockQuantity ?? 10);
    setFormDescription(product.description || '');
  };

  const handleOpenDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!formTitle.trim()) {
      showToast('error', 'Product title is required.');
      return;
    }

    const priceNum = Number(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('error', 'Please provide a valid price.');
      return;
    }

    const compareNum =
      formCompareAtPrice !== '' && !isNaN(Number(formCompareAtPrice)) && Number(formCompareAtPrice) > 0
        ? Number(formCompareAtPrice)
        : undefined;

    const matchedCat = categories.find(
      (c) => c.id === formCategory || c.slug === formCategory
    );

    setIsSaving(true);
    try {
      const updated: Product = {
        ...editingProduct,
        title: formTitle.trim(),
        price: priceNum,
        compareAtPrice: compareNum,
        category: formCategory,
        categoryName: matchedCat?.name || formCategory,
        inStock: formInStock,
        stockQuantity: Number(formStockQuantity) || 0,
        description: formDescription.trim(),
        updatedAt: new Date().toISOString(),
      };

      await saveProduct(updated);

      // Optimistically update local list
      // If it's hot-deals section and discount dropped below 30%, remove it
      if (sectionId === 'hot-deals') {
        const disc =
          updated.compareAtPrice && updated.compareAtPrice > updated.price
            ? Math.round(((updated.compareAtPrice - updated.price) / updated.compareAtPrice) * 100)
            : 0;

        if (disc < 30) {
          setProducts((prev) => prev.filter((p) => p.id !== updated.id));
        } else {
          setProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      }

      setEditingProduct(null);
      showToast('success', `Product "${updated.title}" updated successfully.`);
      router.refresh();
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast('error', err.message || 'Failed to update product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    setIsSaving(true);
    try {
      await deleteProduct(deletingProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      showToast('success', `Product "${deletingProduct.title}" deleted successfully.`);
      setDeletingProduct(null);
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showToast('error', err.message || 'Failed to delete product.');
    } finally {
      setIsSaving(false);
    }
  };

  // Live discount calculation in Edit Modal
  const editPriceNum = Number(formPrice) || 0;
  const editCompareNum = Number(formCompareAtPrice) || 0;
  const editDiscount =
    editCompareNum > editPriceNum && editPriceNum > 0
      ? Math.round(((editCompareNum - editPriceNum) / editCompareNum) * 100)
      : 0;

  if (products.length === 0 && !adminMode) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-elevated text-xs font-semibold border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-label font-bold uppercase tracking-wider text-[#DC2626]">
            {icon === 'flame' ? (
              <Flame className="w-4 h-4 fill-red-500 text-red-500" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{tagText}</span>
            {badgeText && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-[#DC2626] border border-red-200">
                {badgeText}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-[#0F172A] uppercase">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-label">
            {subtitle}
          </p>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 shrink-0">
          {/* Quick Edit Mode Toggle & Admin View: Omitted for New Arrivals section */}
          {sectionId !== 'new-arrivals' && (
            <>
              <button
                type="button"
                onClick={() => setAdminMode((prev) => !prev)}
                className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all font-label ${
                  adminMode
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Toggle Edit / Modify / Delete mode for products in this section"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{adminMode ? 'Done Editing' : 'Edit Section'}</span>
              </button>

              <Link
                href={`/admin/products?section=${adminSectionFilter}`}
                className="text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#DC2626] hover:border-red-300 transition-colors flex items-center space-x-1 font-label"
                title={`Manage ${title} directly in the Admin Catalog`}
              >
                <ExternalLink className="w-3 h-3" />
                <span>Admin View</span>
              </Link>
            </>
          )}

          {/* View All Storefront Link */}
          <Link
            href={viewAllLink}
            className="text-xs font-bold text-[#DC2626] hover:text-red-700 flex items-center space-x-1 transition-colors uppercase tracking-wider shrink-0 font-label group ml-1"
          >
            <span>View All ({products.length})</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 ease-out" />
          </Link>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {adminMode && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Edit Mode Active:</strong> Click the <strong>Pencil icon</strong> to modify pricing/details, or the <strong>Trash icon</strong> to delete any product in this section.
            </span>
          </div>
          <button
            onClick={() => setAdminMode(false)}
            className="text-amber-800 hover:text-amber-950 font-bold underline text-[11px] shrink-0"
          >
            Close
          </button>
        </div>
      )}

      {/* Products Grid (2 cards per row on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showAdminControls={adminMode || isAdminUser}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        ))}
      </div>

      {/* ================= EDIT / MODIFY MODAL ================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden my-8 animate-scaleUp">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 min-w-0">
                <Edit3 className="w-4 h-4 text-[#DC2626] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                  Edit Product
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                  {editingProduct.sku}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              {/* Price & Compare Price (with live Hot Deal discount calculator) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Original / Compare Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 299"
                    value={formCompareAtPrice}
                    onChange={(e) => setFormCompareAtPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                  />
                </div>
              </div>

              {/* Live Discount Indicator */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Calculated Discount:</span>
                {editDiscount >= 30 ? (
                  <span className="flex items-center gap-1 font-bold text-[#DC2626] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[11px]">
                    <Flame className="w-3 h-3 fill-red-500 text-red-500" />
                    {editDiscount}% OFF (Qualifies for Hot Deals)
                  </span>
                ) : editDiscount > 0 ? (
                  <span className="text-slate-700 font-semibold text-[11px]">
                    {editDiscount}% OFF (Need &ge; 30% for Hot Deals)
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">No discount</span>
                )}
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#DC2626]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStockQuantity}
                    onChange={(e) => setFormStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              {/* In Stock Toggle */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={formInStock}
                  onChange={(e) => setFormInStock(e.target.checked)}
                  className="rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                />
                <label htmlFor="inStockCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  In Stock & Ready for Express Dispatch
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-red-700 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-200 p-5 space-y-4 animate-scaleUp">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0F172A]">
                  Delete Product?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-800">{deletingProduct.title}</strong>? This action will permanently remove it from the catalog and all storefront sections.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
