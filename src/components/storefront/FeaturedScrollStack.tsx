'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useGarage } from '@/context/GarageContext';
import { checkCompatibility } from '@/lib/compatibility';
import ScrollStack, { ScrollStackItem } from '@/components/ui/ScrollStack';
import {
  ShoppingBag,
  Heart,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Car,
  MessageCircle,
  Layers,
} from 'lucide-react';

interface FeaturedScrollStackProps {
  products: Product[];
}

export function FeaturedScrollStack({ products }: FeaturedScrollStackProps) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { selectedVehicle, isHydrated, openGarageModal } = useGarage();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const activeVehicle = isHydrated ? selectedVehicle : null;

  return (
    <div className="space-y-4">
      {/* Scroll Stack Interactive Container */}
      <div className="relative h-[560px] sm:h-[480px] w-full rounded-3xl border border-[#E2E8F0] bg-slate-50/60 overflow-hidden shadow-inner p-2 sm:p-4">
        {/* Helper Hint */}
        <div className="absolute top-3 right-5 z-30 hidden sm:flex items-center space-x-1.5 text-[11px] font-label font-bold text-slate-400 uppercase tracking-wider bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/80 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-[#DC2626]" />
          <span>Scroll inside to stack cards</span>
        </div>

        <ScrollStack
          itemDistance={90}
          itemStackDistance={20}
          stackPosition="6%"
          dimAmount={0.15}
          itemScale={0.04}
          baseScale={0.88}
          tiltAmount={1}
          smoothScroll={true}
          snap={true}
          useWindowScroll={false}
          className="h-full"
        >
          {products.map((product, idx) => {
            const inWishlist = isInWishlist(product.id);
            const isAdded = !!addedMap[product.id];
            const compatibility = checkCompatibility(product, activeVehicle);
            const inStock =
              product.inStock !== false &&
              (product.stockQuantity === undefined || product.stockQuantity > 0);

            const whatsappEnquiryUrl = `https://wa.me/1234567890?text=${encodeURIComponent(
              `Hello Kravion Auto! I'm interested in "${product.title}" (SKU: ${
                product.sku || 'N/A'
              }, Price: ₹${product.price.toLocaleString('en-IN')}). Can you confirm vehicle fitment?`
            )}`;

            return (
              <ScrollStackItem
                key={product.id}
                itemClassName="bg-white border border-[#E2E8F0] shadow-card hover:border-red-300 transition-all rounded-3xl p-4 sm:p-7 min-h-[360px] sm:min-h-[380px] flex flex-col justify-between"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
                  {/* Left: Product Image with Fitment Badge */}
                  <div className="sm:col-span-5 relative aspect-[16/10] sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 border border-[#E2E8F0] shrink-0 group/img">
                    <Image
                      src={
                        product.featuredImage ||
                        product.images?.[0] ||
                        '/placeholder.png'
                      }
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 40vw"
                      className="object-cover object-center group-hover/img:scale-105 transition-transform duration-500"
                    />

                    {/* Top Collection Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="text-[10px] font-label font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[#0F172A] border border-slate-200/80 shadow-sm">
                        Featured 0{idx + 1}
                      </span>
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => handleToggleWishlist(e, product)}
                      className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-xl backdrop-blur-md transition-all shadow-sm ${
                        inWishlist
                          ? 'bg-rose-50 text-[#DC2626] border border-red-200'
                          : 'bg-white/90 text-slate-400 border border-slate-200 hover:text-[#DC2626] hover:bg-white'
                      }`}
                      aria-label={
                        inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'
                      }
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          inWishlist ? 'fill-[#DC2626]' : ''
                        }`}
                      />
                    </button>

                    {/* Fitment Indicator */}
                    <div className="absolute bottom-2.5 inset-x-2.5 z-10">
                      <div
                        onClick={(e) => {
                          if (!activeVehicle) {
                            e.preventDefault();
                            e.stopPropagation();
                            openGarageModal();
                          }
                        }}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-semibold backdrop-blur-md border shadow-sm truncate ${
                          compatibility.reason === 'universal'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : compatibility.compatible && activeVehicle
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : !compatibility.compatible && activeVehicle
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-white/95 text-slate-700 border-slate-200 cursor-pointer'
                        }`}
                      >
                        {compatibility.reason === 'universal' ? (
                          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        ) : compatibility.compatible && activeVehicle ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : !compatibility.compatible && activeVehicle ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <Car className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                        )}
                        <span className="truncate">{compatibility.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Details & Buying Options */}
                  <div className="sm:col-span-7 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 text-xs font-label">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626] font-label">
                          {product.categoryName || product.category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                          <span className="ml-1 font-bold text-[#0F172A] text-xs">
                            {(product.rating || 5.0).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          ({product.reviewCount || 18})
                        </span>
                      </div>

                      <Link
                        href={`/products/${product.id}`}
                        className="block group-hover:text-[#DC2626] transition-colors"
                      >
                        <h3 className="text-base sm:text-xl font-black text-[#0F172A] leading-snug line-clamp-2">
                          {product.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-label">
                        {product.description}
                      </p>
                    </div>

                    {/* Price & Actions Row */}
                    <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl sm:text-2xl font-black text-[#0F172A]">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.compareAtPrice &&
                          product.compareAtPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through font-medium">
                              ₹{product.compareAtPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        <span className="text-[10px] uppercase font-label font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-auto">
                          {inStock ? 'Ready for Dispatch' : 'Backorder'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={!inStock}
                          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-sm ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : inStock
                              ? 'bg-[#DC2626] hover:bg-red-700 text-white shadow-red-500/20'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added to Cart</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>

                        <a
                          href={whatsappEnquiryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-[#E2E8F0] hover:border-emerald-300 text-slate-700 hover:text-emerald-700 transition-colors shadow-sm"
                          title="Ask on WhatsApp"
                          aria-label="Ask on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </a>

                        <Link
                          href={`/products/${product.id}`}
                          className="px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-slate-700 text-xs font-bold flex items-center space-x-1 transition-colors"
                        >
                          <span className="hidden sm:inline">Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollStackItem>
            );
          })}
        </ScrollStack>
      </div>
    </div>
  );
}
