'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Car,
  CheckCircle2,
  Star,
  Flame,
} from 'lucide-react';
import {
  getProducts,
  getCategories,
  getVehicles,
  saveProduct,
  deleteProduct,
} from '@/lib/data-service';
import {
  Product,
  Category,
  Vehicle,
  ProductCompatibility,
  CompatibilityType,
} from '@/types';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { formatCurrency } from '@/lib/utils';

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section') || 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFitmentType, setSelectedFitmentType] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>(initialSection);

  useEffect(() => {
    const s = searchParams.get('section');
    if (s) {
      setSelectedSection(s);
    }
  }, [searchParams]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLongDescription, setFormLongDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>(0);
  const [formCompareAtPrice, setFormCompareAtPrice] = useState<number | string>('');
  const [formCategory, setFormCategory] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formStockQuantity, setFormStockQuantity] = useState<number | string>(10);
  const [formSku, setFormSku] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formImages, setFormImages] = useState<string[]>([]);

  // Compatibility Form State
  const [compatType, setCompatType] = useState<CompatibilityType>('universal');
  const [compatSingleVehicleId, setCompatSingleVehicleId] = useState<string>('');
  const [compatMultiVehicleIds, setCompatMultiVehicleIds] = useState<string[]>([]);
  const [compatUniversalNotes, setCompatUniversalNotes] = useState<string>('');

  // Specifications Form State
  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>([
    { label: 'Material', value: 'Aerospace Grade Aluminum' },
    { label: 'Warranty', value: '2-Year Kravion Warranty' },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats, vehs] = await Promise.all([
        getProducts(),
        getCategories(),
        getVehicles(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setVehicles(vehs);
    } catch (err) {
      console.error('Error loading products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    setFormLongDescription('');
    setFormPrice(150);
    setFormCompareAtPrice('');
    setFormCategory(categories[0]?.id || 'exterior');
    setFormInStock(true);
    setFormStockQuantity(10);
    setFormSku(`KRV-${Date.now().toString(36).toUpperCase()}`);
    setFormFeatured(false);
    setFormImages([]);
    setCompatType('universal');
    setCompatSingleVehicleId(vehicles[0]?.id || '');
    setCompatMultiVehicleIds([]);
    setCompatUniversalNotes('Universal fit for all standard 12V automotive systems');
    setSpecs([
      { label: 'Material', value: 'Dry Carbon Fiber' },
      { label: 'Fitment Guarantee', value: 'OEM+ Precision Fit' },
      { label: 'Warranty', value: '2-Year Limited' },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormDescription(p.description || '');
    setFormLongDescription(p.longDescription || p.description || '');
    setFormPrice(p.price);
    setFormCompareAtPrice(p.compareAtPrice !== undefined ? p.compareAtPrice : '');
    setFormCategory(p.category);
    setFormInStock(p.inStock);
    setFormStockQuantity(p.stockQuantity ?? 10);
    setFormSku(p.sku);
    setFormFeatured(p.featured);
    setFormImages(p.images || (p.featuredImage ? [p.featuredImage] : []));

    // Compatibility
    const c = p.compatibility || { type: 'universal' };
    setCompatType(c.type);
    setCompatSingleVehicleId(c.vehicleId || vehicles[0]?.id || '');
    setCompatMultiVehicleIds(c.vehicleIds || []);
    setCompatUniversalNotes(c.universalNotes || '');

    // Specifications
    if (p.specifications && p.specifications.length > 0) {
      setSpecs(p.specifications.map((s) => ({ label: s.label, value: s.value })));
    } else if (p.specs && Object.keys(p.specs).length > 0) {
      setSpecs(Object.entries(p.specs).map(([label, value]) => ({ label, value: String(value) })));
    } else {
      setSpecs([]);
    }

    setIsModalOpen(true);
  };

  const handleAddSpecRow = () => {
    setSpecs([...specs, { label: '', value: '' }]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: 'label' | 'value', val: string) => {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showNotification('error', 'Product title is required.');
      return;
    }

    const priceNum = Number(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showNotification('error', 'Valid non-negative price is required.');
      return;
    }

    setSaving(true);
    try {
      const matchedCat = categories.find(
        (c) => c.id === formCategory || c.slug === formCategory
      );

      let compatibilityObj: ProductCompatibility;
      if (compatType === 'universal') {
        compatibilityObj = {
          type: 'universal',
          compatibleMakes: ['Universal'],
          universalNotes: formUniversalNotesOrDefault(),
        };
      } else if (compatType === 'single') {
        const v = vehicles.find((veh) => veh.id === compatSingleVehicleId);
        compatibilityObj = {
          type: 'single',
          vehicleId: compatSingleVehicleId,
          vehicleIds: [compatSingleVehicleId],
          compatibleMakes: v ? [v.make] : [],
        };
      } else {
        const selectedVehs = vehicles.filter((v) => compatMultiVehicleIds.includes(v.id));
        const makes = Array.from(new Set(selectedVehs.map((v) => v.make)));
        compatibilityObj = {
          type: 'multi',
          vehicleIds: compatMultiVehicleIds,
          compatibleMakes: makes,
        };
      }

      const validSpecs = specs.filter((s) => s.label.trim() && s.value.trim());
      const specsRecord = Object.fromEntries(validSpecs.map((s) => [s.label, s.value]));

      const payload: Partial<Product> = {
        id: editingProduct?.id,
        title: formTitle.trim(),
        slug:
          formSlug.trim() ||
          formTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, ''),
        description: formDescription.trim(),
        longDescription: formLongDescription.trim() || formDescription.trim(),
        price: priceNum,
        compareAtPrice:
          formCompareAtPrice !== '' && Number(formCompareAtPrice) > 0
            ? Number(formCompareAtPrice)
            : undefined,
        category: formCategory,
        categoryName: matchedCat?.name || formCategory,
        images: formImages.length > 0 ? formImages : ['https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp'],
        featuredImage: formImages[0] || 'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp',
        compatibility: compatibilityObj,
        specifications: validSpecs,
        specs: specsRecord,
        inStock: formInStock,
        stockQuantity: Number(formStockQuantity) || 0,
        sku: formSku.trim() || `KRV-${Date.now().toString(36).toUpperCase()}`,
        featured: formFeatured,
        rating: editingProduct?.rating ?? 5.0,
        reviewCount: editingProduct?.reviewCount ?? 0,
      };

      await saveProduct(payload);
      await loadData();
      setIsModalOpen(false);
      showNotification('success', `Product "${payload.title}" saved successfully.`);
    } catch (err: any) {
      console.error('Save product error:', err);
      showNotification('error', err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const formUniversalNotesOrDefault = () => {
    return compatUniversalNotes.trim() || 'Fits all vehicle makes & models without modification';
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      await loadData();
      setDeleteConfirmId(null);
      showNotification('success', 'Product deleted successfully.');
    } catch (err: any) {
      console.error('Delete product error:', err);
      showNotification('error', err.message || 'Failed to delete product.');
    }
  };

  const handleToggleStock = async (product: Product) => {
    try {
      await saveProduct({ ...product, inStock: !product.inStock });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, inStock: !p.inStock } : p))
      );
    } catch (err) {
      console.error('Toggle stock error:', err);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await saveProduct({ ...product, featured: !product.featured });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, featured: !p.featured } : p))
      );
    } catch (err) {
      console.error('Toggle featured error:', err);
    }
  };

  const newest8Ids = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      })
      .slice(0, 8)
      .map((p) => p.id);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSku && !matchesDesc) return false;
      }

      if (selectedCategory !== 'all') {
        if (
          p.category.toLowerCase() !== selectedCategory.toLowerCase() &&
          p.categoryName?.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }
      }

      if (selectedFitmentType !== 'all') {
        if (p.compatibility?.type !== selectedFitmentType) {
          return false;
        }
      }

      if (selectedSection === 'hot-deals') {
        if (!p.compareAtPrice || p.compareAtPrice <= p.price) return false;
        const disc = Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
        if (disc < 30) return false;
      } else if (selectedSection === 'new-arrivals') {
        if (!newest8Ids.includes(p.id)) return false;
      } else if (selectedSection === 'featured') {
        if (!p.featured) return false;
      }

      return true;
    });

    if (selectedSection === 'hot-deals') {
      result.sort((a, b) => {
        const discA = a.compareAtPrice && a.compareAtPrice > a.price
          ? Math.round(((a.compareAtPrice - a.price) / a.compareAtPrice) * 100) : 0;
        const discB = b.compareAtPrice && b.compareAtPrice > b.price
          ? Math.round(((b.compareAtPrice - b.price) / b.compareAtPrice) * 100) : 0;
        return discB - discA;
      });
    } else if (selectedSection === 'new-arrivals') {
      result.sort((a, b) => {
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      });
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedFitmentType, selectedSection, newest8Ids]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2 font-headline">
            <Package className="w-5 h-5 text-[#DC2626]" />
            <span>Product Catalog</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage automobile accessories, specifications, pricing, and 3-tier vehicle compatibility
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase bg-[#DC2626] hover:bg-red-700 text-white shadow-subtle transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-subtle">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, SKU, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Storefront Section Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#DC2626]"
          >
            <option value="all">All Sections (Entire Catalog)</option>
            <option value="hot-deals">🔥 Hot Deals (30%+ OFF)</option>
            <option value="new-arrivals">✨ New Arrivals</option>
            <option value="featured">⭐ Featured Catalogue</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-slate-700 focus:outline-none focus:border-[#DC2626]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug || c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fitment Type Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedFitmentType}
            onChange={(e) => setSelectedFitmentType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-slate-700 focus:outline-none focus:border-[#DC2626]"
          >
            <option value="all">All Fitment Types</option>
            <option value="universal">Universal Fit</option>
            <option value="single">Single Vehicle</option>
            <option value="multi">Multi-Vehicle</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 uppercase tracking-wider font-semibold border-b border-[#E2E8F0] font-label">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Compatibility</th>
                <th className="px-4 py-3.5 text-center">In Stock</th>
                <th className="px-4 py-3.5 text-center">Featured</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-[#0F172A]">No products found matching filters.</p>
                    <p className="text-xs text-slate-500 mt-1">Adjust search parameters or add a new product.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const compat = p.compatibility || { type: 'universal' };
                  const singleVeh =
                    compat.type === 'single'
                      ? vehicles.find((v) => v.id === compat.vehicleId)
                      : null;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-100 shrink-0">
                            <img
                              src={p.featuredImage || (p.images && p.images[0]) || 'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp'}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0F172A] truncate max-w-xs sm:max-w-sm">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[11px] text-slate-500 font-mono">
                                SKU: {p.sku}
                              </span>
                              {p.compareAtPrice && p.compareAtPrice > p.price && Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) >= 30 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  <Flame className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                                  Hot Deal ({Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}% OFF)
                                </span>
                              )}
                              {newest8Ids.includes(p.id) && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                  New Arrival
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                          {p.categoryName || p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0F172A] whitespace-nowrap">
                        <div>{formatCurrency(p.price)}</div>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <div className="text-[11px] text-slate-400 line-through font-normal">
                            {formatCurrency(p.compareAtPrice)}
                          </div>
                        )}
                      </td>

                      {/* Compatibility Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {compat.type === 'universal' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" /> Universal Fit
                          </span>
                        )}
                        {compat.type === 'single' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <Car className="w-3 h-3" />
                            {singleVeh ? `${singleVeh.make} ${singleVeh.model}` : compat.vehicleId || 'Single'}
                          </span>
                        )}
                        {compat.type === 'multi' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Car className="w-3 h-3" />
                            Multi ({compat.vehicleIds?.length || 0} models)
                          </span>
                        )}
                      </td>

                      {/* In Stock Toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors border ${
                            p.inStock
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                          }`}
                          title={p.inStock ? 'In Stock (Click to mark Sold Out)' : 'Sold Out (Click to mark In Stock)'}
                        >
                          {p.inStock ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Featured Toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(p)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors border ${
                            p.featured
                              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
                          }`}
                          title={p.featured ? 'Remove featured' : 'Set as featured'}
                        >
                          <Star className={`w-4 h-4 ${p.featured ? 'fill-current' : ''}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-[#E2E8F0]"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#0F172A]">Confirm Product Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this product? This action removes the item from the catalog.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#DC2626] hover:bg-red-700 text-white transition-colors"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 text-[#DC2626] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] font-headline">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure specifications, R2 images, and vehicle fitment rules
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5 font-headline">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" /> 1. Basic Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Product Title <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BMW M3 G80 Carbon Fiber Front Lip Spoiler"
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value);
                        if (!editingProduct) {
                          setFormSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)+/g, '')
                          );
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">URL Slug</label>
                    <input
                      type="text"
                      placeholder="bmw-m3-g80-carbon-front-lip"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 font-mono focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Category <span className="text-[#DC2626]">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug || c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Short Summary</label>
                  <input
                    type="text"
                    placeholder="Brief aerodynamic lip spoiler handcrafted with autoclave pre-preg carbon fiber."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Detailed Description</label>
                  <textarea
                    rows={3}
                    placeholder="Comprehensive description covering engineering, fitment, and design highlights."
                    value={formLongDescription}
                    onChange={(e) => setFormLongDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] resize-none"
                  />
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5 font-headline">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" /> 2. Pricing & Inventory
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Price (₹) <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Original / Compare Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Optional"
                      value={formCompareAtPrice}
                      onChange={(e) => setFormCompareAtPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={formStockQuantity}
                      onChange={(e) => setFormStockQuantity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">SKU Code</label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono uppercase focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>
                </div>

                {/* Live Discount Calculator in Pricing */}
                {Number(formCompareAtPrice) > Number(formPrice) && Number(formPrice) > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Calculated Discount:</span>
                    {Math.round(((Number(formCompareAtPrice) - Number(formPrice)) / Number(formCompareAtPrice)) * 100) >= 30 ? (
                      <span className="flex items-center gap-1 font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[11px]">
                        <Flame className="w-3 h-3 fill-red-500 text-red-500" />
                        {Math.round(((Number(formCompareAtPrice) - Number(formPrice)) / Number(formCompareAtPrice)) * 100)}% OFF (Qualifies for Hot Deals)
                      </span>
                    ) : (
                      <span className="text-slate-700 font-semibold text-[11px]">
                        {Math.round(((Number(formCompareAtPrice) - Number(formPrice)) / Number(formCompareAtPrice)) * 100)}% OFF (Hot Deals requires &ge; 30%)
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-6 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formInStock}
                      onChange={(e) => setFormInStock(e.target.checked)}
                      className="rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                    />
                    <span>Available / In Stock</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                    />
                    <span>Featured On Storefront</span>
                  </label>
                </div>
              </div>

              {/* 3-Tier Vehicle Compatibility Selector */}
              <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5 font-headline">
                    <Car className="w-3.5 h-3.5 text-[#DC2626]" /> 3. Vehicle Compatibility Rules
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Precision Fitment Engine</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCompatType('universal')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      compatType === 'universal'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">Universal Fit</p>
                    <p className="text-[10px] mt-0.5 opacity-80">Fits any make & model</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompatType('single')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      compatType === 'single'
                        ? 'border-sky-300 bg-sky-50 text-sky-800 shadow-sm'
                        : 'border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">Single Vehicle</p>
                    <p className="text-[10px] mt-0.5 opacity-80">Exact vehicle chassis match</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompatType('multi')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      compatType === 'multi'
                        ? 'border-purple-300 bg-purple-50 text-purple-800 shadow-sm'
                        : 'border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">Multi-Vehicle</p>
                    <p className="text-[10px] mt-0.5 opacity-80">Multiple selected models</p>
                  </button>
                </div>

                {/* Universal Details */}
                {compatType === 'universal' && (
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Fitment Notes</label>
                    <input
                      type="text"
                      value={compatUniversalNotes}
                      onChange={(e) => setCompatUniversalNotes(e.target.value)}
                      placeholder="e.g. Standard 12V cigarette lighter or USB-C connection; compatible with all automobiles."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                    />
                  </div>
                )}

                {/* Single Vehicle Details */}
                {compatType === 'single' && (
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Select Target Vehicle Chassis
                    </label>
                    <select
                      value={compatSingleVehicleId}
                      onChange={(e) => setCompatSingleVehicleId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} ({v.yearRange || `${v.yearStart} - ${v.yearEnd || 'Present'}`})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Multi-Vehicle Details */}
                {compatType === 'multi' && (
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        Compatible Vehicle Directory ({compatMultiVehicleIds.length} selected)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (compatMultiVehicleIds.length === vehicles.length) {
                            setCompatMultiVehicleIds([]);
                          } else {
                            setCompatMultiVehicleIds(vehicles.map((v) => v.id));
                          }
                        }}
                        className="text-[11px] text-[#DC2626] font-semibold hover:underline"
                      >
                        {compatMultiVehicleIds.length === vehicles.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-[#E2E8F0]">
                      {vehicles.map((v) => {
                        const isChecked = compatMultiVehicleIds.includes(v.id);
                        return (
                          <label
                            key={v.id}
                            className={`flex items-center space-x-2 p-1.5 rounded text-xs cursor-pointer ${
                              isChecked ? 'bg-red-50 text-red-900 font-medium' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setCompatMultiVehicleIds(compatMultiVehicleIds.filter((id) => id !== v.id));
                                } else {
                                  setCompatMultiVehicleIds([...compatMultiVehicleIds, v.id]);
                                }
                              }}
                              className="rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                            />
                            <span className="truncate">
                              {v.make} {v.model} ({v.yearStart})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Cloudflare R2 Image Upload */}
              <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5 font-headline">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" /> 4. Cloudflare R2 Product Imagery
                </h4>

                <ImageUploader
                  label="Product Imagery (Stored on Cloudflare R2 CDN)"
                  folder="products"
                  multiple={true}
                  maxFiles={6}
                  values={formImages}
                  onImagesChange={(urls) => setFormImages(urls)}
                />
              </div>

              {/* Dynamic Technical Specifications */}
              <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5 font-headline">
                    <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" /> 5. Technical Specifications
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:text-red-700"
                  >
                    <Plus className="w-3 h-3" /> Add Spec Row
                  </button>
                </div>

                <div className="space-y-2">
                  {specs.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Feature label (e.g. Material)"
                        value={s.label}
                        onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                        className="w-1/3 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. Toray 3K Dry Carbon)"
                        value={s.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove row"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#DC2626] hover:bg-red-700 text-white transition-all shadow-subtle disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading catalog management...
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}