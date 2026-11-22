'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useGarage } from '@/context/GarageContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { checkCompatibility } from '@/lib/compatibility';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Car,
  ShoppingBag,
  Heart,
  Star,
  Check,
  Flame,
  Edit2,
  Trash2,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  showAdminControls?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  addButtonVariant?: 'red' | 'default';
}

export function ProductCard({
  product,
  showAdminControls = false,
  onEdit,
  onDelete,
  addButtonVariant = 'default',
}: ProductCardProps) {
  const { selectedVehicle, openGarageModal, isHydrated } = useGarage();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [addedRecently, setAddedRecently] = useState(false);

  const inWishlist = isInWishlist(product.id);

  // Compute live compatibility
  const activeVehicle = isHydrated ? selectedVehicle : null;
  const compatibility = checkCompatibility(product, activeVehicle);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setAddedRecently(true);
    setTimeout(() => setAddedRecently(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleFitmentClick = (e: React.MouseEvent) => {
    if (!activeVehicle) {
      e.preventDefault();
      e.stopPropagation();
      openGarageModal();
    }
  };

  // Determine fitment badge styling in light mode
  let fitmentBg = 'bg-white/95 text-slate-700 border-slate-200 hover:border-red-400 hover:text-red-600 cursor-pointer shadow-sm';
  let fitmentIcon = <Car className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />;

  if (compatibility.reason === 'universal') {
    fitmentBg = 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm';
    fitmentIcon = <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
  } else if (compatibility.compatible && activeVehicle) {
    fitmentBg = 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm';
    fitmentIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
  } else if (!compatibility.compatible && activeVehicle) {
    fitmentBg = 'bg-rose-50 text-rose-800 border-rose-200 shadow-sm';
    fitmentIcon = <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
  }

  // Stock status
  const inStock = product.inStock !== false && (product.stockQuantity === undefined || product.stockQuantity > 0);

  // Discount percentage (calculated for hot deals & badges)
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <div className="group relative rounded-2xl bg-white border border-[#E2E8F0] hover:border-red-300/90 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-card-hover flex flex-col overflow-hidden shadow-subtle font-sans">
      {/* Product Image Container */}
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden block"
      >
        <Image
          src={product.featuredImage || product.images?.[0] || '/placeholder.png'}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out ${
            !inStock ? 'opacity-85 grayscale-[20%]' : ''
          }`}
        />

        {/* Sold Out Overlay Badge on Image */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none z-10">
            <span className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white font-black text-[11px] sm:text-xs uppercase tracking-widest border border-white/20 shadow-md">
              Sold Out
            </span>
          </div>
        )}

        {/* Top Badges: Category, Hot Deal & Wishlist */}
        <div className="absolute top-2 inset-x-2 sm:top-3 sm:inset-x-3 flex items-center justify-between z-10 gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-label font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-white/90 backdrop-blur-md text-[#0F172A] border border-slate-200/80 shadow-sm transition-all duration-200 group-hover:bg-white truncate max-w-[85px] sm:max-w-none">
              {product.categoryName || product.category}
            </span>
            {discountPercent >= 30 && (
              <span className="flex items-center space-x-0.5 text-[9px] sm:text-[10px] font-label font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg bg-[#DC2626] text-white shadow-sm shrink-0">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-300 text-amber-300 shrink-0" />
                <span>{discountPercent}% OFF</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {showAdminControls && onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl backdrop-blur-md bg-white/95 text-slate-700 hover:text-white hover:bg-blue-600 border border-slate-200 shadow-sm transition-all duration-200 hover:scale-110 active:scale-90 shrink-0"
                title="Edit / Modify Product"
                aria-label="Edit product"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {showAdminControls && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(product);
                }}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl backdrop-blur-md bg-white/95 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 shadow-sm transition-all duration-200 hover:scale-110 active:scale-90 shrink-0"
                title="Delete Product"
                aria-label="Delete product"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleToggleWishlist}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl backdrop-blur-md transition-all duration-200 ease-out shadow-sm hover:scale-110 active:scale-90 shrink-0 ${
                inWishlist
                  ? 'bg-rose-50 text-[#DC2626] border border-red-200'
                  : 'bg-white/90 text-slate-400 border border-slate-200 hover:text-[#DC2626] hover:bg-white'
              }`}
              aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform duration-200 ${inWishlist ? 'fill-[#DC2626] scale-110' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Fitment Indicator on Image */}
        <div className="absolute bottom-2 inset-x-2 sm:bottom-2.5 sm:inset-x-2.5 z-10">
          <div
            onClick={handleFitmentClick}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-semibold backdrop-blur-md border transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] ${fitmentBg}`}
          >
            {fitmentIcon}
            <span className="truncate">{compatibility.label}</span>
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 bg-white">
        <div className="space-y-1 sm:space-y-1.5">
          {/* Rating */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-label">
            <div className="flex items-center text-amber-500">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500 stroke-amber-500" />
              <span className="ml-1 font-bold text-[#0F172A] text-[11px] sm:text-xs">
                {(product.rating || 5.0).toFixed(1)}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500">
              ({product.reviewCount || 12})
            </span>
            {inStock ? (
              <span className="ml-auto text-[9px] sm:text-[10px] font-label font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 sm:px-2 rounded-full border border-emerald-200 shrink-0">
                In Stock
              </span>
            ) : (
              <span className="ml-auto text-[9px] sm:text-[10px] font-label font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 sm:px-2 rounded-full border border-rose-200 shrink-0">
                Sold Out
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.id}`} className="block group-hover:text-[#DC2626] transition-colors duration-200 ease-out">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed font-label hidden sm:block">
            {product.description}
          </p>
        </div>

        {/* Price and Cart Action */}
        <div className="pt-2 sm:pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline space-x-1 sm:space-x-1.5 truncate">
              <span className="text-sm sm:text-base md:text-lg font-black text-[#0F172A]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                  ₹{product.compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent >= 30 && (
                <span className="text-[9px] sm:text-[10px] font-black text-[#DC2626] bg-red-50 px-1 sm:px-1.5 py-0.5 rounded border border-red-100 shrink-0">
                  -{discountPercent}%
                </span>
              )}
            </div>
            <span className="text-[8px] sm:text-[10px] text-slate-400 font-label uppercase truncate">
              SKU: {product.sku || 'KRV-OEM'}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 ease-out flex items-center space-x-1 sm:space-x-1.5 shadow-sm hover:-translate-y-0.5 active:scale-95 shrink-0 ${
              addedRecently
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : inStock
                ? addButtonVariant === 'red'
                  ? 'bg-[#DC2626] hover:bg-red-700 text-white shadow-md shadow-red-600/25 hover:shadow-red-600/40'
                  : 'bg-[#0F172A] hover:bg-[#DC2626] text-white hover:shadow-red-500/25'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
            }`}
            title={inStock ? 'Add to shopping cart' : 'Item is currently sold out'}
          >
            {addedRecently ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Added</span>
              </>
            ) : inStock ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            ) : (
              <span>Sold Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
