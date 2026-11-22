'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGarage } from '@/context/GarageContext';
import { getProducts, getCategories, getVehicles } from '@/lib/data-service';
import { initialProducts, initialCategories, initialVehicles } from '@/lib/seed-data';
import { checkCompatibility } from '@/lib/compatibility';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Product, Category, Vehicle } from '@/types';
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder';
import {
  Search,
  Filter,
  Car,
  X,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedVehicle, openGarageModal, isHydrated } = useGarage();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);

  // Filter States initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedMake, setSelectedMake] = useState(searchParams.get('make') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '');
  const [fitsGarageOnly, setFitsGarageOnly] = useState(searchParams.get('fitsGarage') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'featured');

  // Animated typewriter placeholder cycling through luxury suggestions
  const placeholderText = useTypewriterPlaceholder();

  // Sync state if URL changes
  useEffect(() => {
    const q = searchParams.get('search') || '';
    const cat = searchParams.get('category') || '';
    const mk = searchParams.get('make') || '';
    const md = searchParams.get('model') || '';
    const fg = searchParams.get('fitsGarage') === 'true';
    const s = searchParams.get('sort') || 'featured';

    setSearchQuery(q);
    setSelectedCategory(cat);
    setSelectedMake(mk);
    setSelectedModel(md);
    setFitsGarageOnly(fg);
    setSortBy(s);
  }, [searchParams]);

  // Load live data from data service
  useEffect(() => {
    let mounted = true;
    Promise.all([getProducts(), getCategories(), getVehicles()])
      .then(([prods, cats, vechs]) => {
        if (mounted) {
          if (prods && prods.length > 0) setProducts(prods);
          if (cats && cats.length > 0) setCategories(cats);
          if (vechs && vechs.length > 0) setVehicles(vechs);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch data for catalog:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Unique makes
  const distinctMakes = useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.make))).sort();
  }, [vehicles]);

  // Models for selected make
  const availableModels = useMemo(() => {
    if (!selectedMake) return [];
    return Array.from(
      new Set(
        vehicles
          .filter((v) => v.make.toLowerCase() === selectedMake.toLowerCase())
          .map((v) => v.model)
      )
    ).sort();
  }, [vehicles, selectedMake]);

  // Push filter changes to URL
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'false' || val === 'featured') {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.replace(`/products${query}`, { scroll: false });
  };

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel('');
    updateUrlParams({ make: make || null, model: null });
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    updateUrlParams({ model: model || null });
  };

  const handleCategoryChange = (catSlug: string) => {
    const next = selectedCategory === catSlug ? '' : catSlug;
    setSelectedCategory(next);
    updateUrlParams({ category: next || null });
  };

  const handleFitsGarageToggle = () => {
    const next = !fitsGarageOnly;
    setFitsGarageOnly(next);
    updateUrlParams({ fitsGarage: next ? 'true' : null });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrlParams({ search: val.trim() || null });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateUrlParams({ sort: sort || null });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedMake('');
    setSelectedModel('');
    setFitsGarageOnly(false);
    setSortBy('featured');
    router.replace('/products', { scroll: false });
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (selectedCategory) {
      result = result.filter(
        (p) =>
          p.category.toLowerCase() === selectedCategory.toLowerCase() ||
          p.categoryName.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 3. Make & Model Filter
    if (selectedMake) {
      const matchedVehicle = selectedModel
        ? vehicles.find(
            (v) =>
              v.make.toLowerCase() === selectedMake.toLowerCase() &&
              v.model.toLowerCase() === selectedModel.toLowerCase()
          )
        : undefined;

      const dummyVehicle: Vehicle = matchedVehicle || {
        id: selectedModel
          ? `${selectedMake.toLowerCase()}-${selectedModel.toLowerCase().replace(/\s+/g, '-')}`
          : selectedMake.toLowerCase(),
        make: selectedMake,
        model: selectedModel,
        yearStart: 2020,
        yearEnd: null,
      };

      result = result.filter((p) => {
        const comp = checkCompatibility(p, dummyVehicle);
        return comp.compatible;
      });
    }

    // 4. "Fits My Garage" Filter
    if (fitsGarageOnly && selectedVehicle && isHydrated) {
      result = result.filter((p) => {
        const comp = checkCompatibility(p, selectedVehicle);
        return comp.compatible;
      });
    }

    // 5. Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'featured') {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [
    products,
    vehicles,
    searchQuery,
    selectedCategory,
    selectedMake,
    selectedModel,
    fitsGarageOnly,
    selectedVehicle,
    isHydrated,
    sortBy,
  ]);

  // Determine active filter chips
  const activeChips: Array<{ label: string; onRemove: () => void }> = [];
  if (searchQuery.trim()) {
    activeChips.push({
      label: `Search: "${searchQuery}"`,
      onRemove: () => handleSearchChange(''),
    });
  }
  if (selectedCategory) {
    const catName =
      categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory;
    activeChips.push({
      label: `Category: ${catName}`,
      onRemove: () => handleCategoryChange(selectedCategory),
    });
  }
  if (selectedMake) {
    activeChips.push({
      label: `Make: ${selectedMake}`,
      onRemove: () => handleMakeChange(''),
    });
  }
  if (selectedModel) {
    activeChips.push({
      label: `Model: ${selectedModel}`,
      onRemove: () => handleModelChange(''),
    });
  }
  if (fitsGarageOnly) {
    activeChips.push({
      label: selectedVehicle
        ? `Fits: ${selectedVehicle.make} ${selectedVehicle.model}`
        : 'Fits My Garage',
      onRemove: handleFitsGarageToggle,
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 md:pb-12 font-sans">
      {/* Header Banner */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center space-x-2 text-xs font-label font-bold uppercase tracking-wider text-[#DC2626]">
          <Sparkles className="w-4 h-4" />
          <span>Faceted Search & Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#0F172A] uppercase">
          Automotive Parts & Accessories
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-label max-w-3xl">
          Browse precision dry carbon aerodynamics, ambient lighting, high-fidelity audio, and performance exhausts with live OEM+ vehicle fitment validation.
        </p>
      </div>

      {/* Garage Status Reminder Banner */}
      {selectedVehicle && isHydrated ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-label font-bold uppercase tracking-wider">
                Vehicle Active in Garage
              </p>
              <h3 className="text-sm font-extrabold text-[#0F172A]">
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.generation || selectedVehicle.yearRange})
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleFitsGarageToggle}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 border shadow-sm ${
                fitsGarageOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <span>{fitsGarageOnly ? 'Showing Guaranteed Fits' : 'Filter by My Garage'}</span>
            </button>
            <button
              onClick={openGarageModal}
              className="px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors shadow-sm"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-[#DC2626] border border-red-100">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A]">
                Want to see only parts that fit your exact car?
              </h3>
              <p className="text-xs text-slate-500 font-label">
                Select your vehicle make and model to eliminate guesswork and activate fitment guarantees.
              </p>
            </div>
          </div>
          <button
            onClick={openGarageModal}
            className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            Select Vehicle
          </button>
        </div>
      )}

      {/* Main Filter Control Bar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box with Typewriter Suggestions */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#DC2626] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }
              }}
              placeholder={placeholderText ? `Search "${placeholderText}"...` : 'Search by keyword (diffuser, spoiler, ambient, tweeters, exhaust)...'}
              style={{
                outline: 'none',
                boxShadow: 'none',
                WebkitAppearance: 'none',
                appearance: 'none',
                WebkitTapHighlightColor: 'transparent',
                paddingLeft: '40px',
              }}
              className="w-full bg-white border border-[#E2E8F0] focus:border-slate-400 rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 outline-none focus:outline-none focus:ring-0 focus:border-slate-400 transition-all shadow-sm font-medium placeholder:truncate"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Cascading Make & Model Dropdowns */}
          <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2">
            {/* Make */}
            <select
              value={selectedMake}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="w-full sm:w-auto bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 font-semibold shadow-sm truncate"
            >
              <option value="">All Makes</option>
              {distinctMakes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Model */}
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={!selectedMake}
              className="w-full sm:w-auto bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed font-semibold shadow-sm truncate"
            >
              <option value="">
                {selectedMake ? 'All Models' : 'Choose Make'}
              </option>
              {availableModels.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <div className="relative col-span-2 sm:col-span-1">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full sm:w-auto bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-8 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 font-semibold appearance-none shadow-sm"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none font-label">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === ''
                ? 'bg-[#DC2626] text-white shadow-red-500/20'
                : 'bg-white text-slate-700 border border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected =
              selectedCategory.toLowerCase() === cat.slug.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  isSelected
                    ? 'bg-[#DC2626] text-white shadow-red-500/20'
                    : 'bg-white text-slate-700 border border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips & Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-label">
              Showing <strong className="text-[#0F172A] font-extrabold">{filteredProducts.length}</strong> products
            </span>

            {activeChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-xs bg-white border border-[#E2E8F0] text-[#0F172A] shadow-sm font-medium"
              >
                <span>{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="text-slate-400 hover:text-red-600 ml-1 transition-colors"
                  aria-label="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {activeChips.length > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#DC2626] hover:text-red-700 font-bold flex items-center space-x-1 ml-2 transition-colors font-label"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E2E8F0] space-y-4 max-w-lg mx-auto shadow-subtle">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
            <Filter className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#0F172A]">No products found</h3>
            <p className="text-xs text-slate-500 font-label leading-relaxed">
              We couldn&apos;t find any items matching your current filters. Try relaxing your search terms or clearing selected makes.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
          Loading catalog...
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}
