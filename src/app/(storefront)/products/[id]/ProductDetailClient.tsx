'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useGarage } from '@/context/GarageContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { checkCompatibility } from '@/lib/compatibility';
import { ProductCard } from '@/components/storefront/ProductCard';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Car,
  ShoppingBag,
  Heart,
  Star,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  MessageCircle,
  Truck,
  RotateCcw,
  Layers,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const { selectedVehicle, openGarageModal, isHydrated } = useGarage();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Multi-image gallery state
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.featuredImage || '/placeholder.png'];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  // Quantity state
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const activeVehicle = isHydrated ? selectedVehicle : null;
  const compatibility = checkCompatibility(product, activeVehicle);

  const inStock =
    product.inStock !== false &&
    (product.stockQuantity === undefined || product.stockQuantity > 0);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      return next < 1 ? 1 : next;
    });
  };

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const currentImage = images[selectedImageIndex] || images[0];

  // Specifications items
  const specsList =
    product.specifications ||
    (product.specs
      ? Object.entries(product.specs).map(([label, value]) => ({
          label,
          value,
        }))
      : []);

  // WhatsApp Enquiry Link
  const enquiryMessage = encodeURIComponent(
    `Hello Kravion Auto Concierge! I have a question regarding: "${product.title}" (SKU: ${product.sku || 'N/A'}, Price: ₹${product.price}). Can you verify fitment for my vehicle?`
  );
  const whatsappEnquiryUrl = `https://wa.me/1234567890?text=${enquiryMessage}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12 pb-32 md:pb-12 font-sans">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 font-label">
        <Link href="/" className="hover:text-[#DC2626] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/products" className="hover:text-[#DC2626] transition-colors">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link
          href={`/products?category=${product.category}`}
          className="hover:text-[#DC2626] transition-colors"
        >
          {product.categoryName || product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[#0F172A] font-semibold truncate max-w-[200px] sm:max-w-none">
          {product.title}
        </span>
      </nav>

      {/* Main Product Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Multi-Image Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Hero Image with Zoom Preview */}
          <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-slate-100 border border-[#E2E8F0] shadow-card group">
            <Image
              src={currentImage}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className={`object-cover object-center group-hover:scale-105 transition-transform duration-500 cursor-pointer ${
                !inStock ? 'opacity-85 grayscale-[20%]' : ''
              }`}
              onClick={() => setZoomModalOpen(true)}
            />

            {/* Sold Out Center Badge Overlay */}
            {!inStock && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none z-10">
                <span className="px-5 py-2 rounded-xl bg-black/80 backdrop-blur-md text-white font-black text-sm uppercase tracking-widest border border-white/20 shadow-xl">
                  Sold Out
                </span>
              </div>
            )}

            {/* Top Corner Floating Badges */}
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-label font-bold uppercase bg-white/90 backdrop-blur-md text-[#0F172A] border border-slate-200/80 shadow-sm">
                {product.categoryName || product.category}
              </span>
              {inStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-label font-bold text-emerald-700 bg-emerald-50 backdrop-blur-md border border-emerald-200">
                  Ready to Ship
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-label font-bold text-rose-700 bg-rose-50 backdrop-blur-md border border-rose-200">
                  Sold Out
                </span>
              )}
            </div>

            {/* Zoom Trigger Button */}
            <button
              onClick={() => setZoomModalOpen(true)}
              className="absolute bottom-4 right-4 z-10 p-2.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 hover:text-[#DC2626] backdrop-blur-md transition-colors shadow-sm"
              aria-label="Expand image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => {
                const isActive = idx === selectedImageIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-16 sm:w-24 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 border transition-all shrink-0 shadow-sm ${
                      isActive
                        ? 'border-[#DC2626] ring-2 ring-red-500/30 scale-102'
                        : 'border-[#E2E8F0] hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} - View ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Full Screen Image Zoom Modal */}
          {zoomModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setZoomModalOpen(false)}
            >
              <button
                onClick={() => setZoomModalOpen(false)}
                className="absolute top-6 right-6 p-3 rounded-full bg-white text-slate-700 hover:text-[#DC2626] shadow-xl border border-slate-200"
                aria-label="Close Preview"
              >
                <X className="w-6 h-6" />
              </button>
              <div
                className="relative w-full max-w-5xl h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={currentImage}
                  alt={product.title}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header Title & SKU */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-label uppercase tracking-widest text-slate-400 font-bold">
                SKU: {product.sku || 'KRV-OEM-01'}
              </span>
              {/* Ratings */}
              <div className="flex items-center space-x-1.5 text-xs font-label">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
                  <span className="ml-1 font-bold text-[#0F172A]">
                    {(product.rating || 5.0).toFixed(1)}
                  </span>
                </div>
                <span className="text-slate-500">
                  ({product.reviewCount || 24} reviews)
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] leading-tight">
              {product.title}
            </h1>
          </div>

          {/* Pricing Card */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-baseline justify-between shadow-subtle">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-[#0F172A] tracking-tight">
                ₹{product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-slate-400 line-through font-medium">
                  ₹{product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-[#DC2626] border border-red-200 font-label">
                Save ₹{(product.compareAtPrice - product.price).toFixed(2)}
              </span>
            )}
          </div>

          {/* Real-time Vehicle Compatibility Banner */}
          <div className="rounded-2xl border overflow-hidden transition-all shadow-subtle">
            {compatibility.reason === 'universal' ? (
              /* Universal Fit Banner */
              <div className="p-4 bg-sky-50 border-sky-200 space-y-2">
                <div className="flex items-center space-x-2 text-sky-900">
                  <Sparkles className="w-5 h-5 text-sky-600 shrink-0" />
                  <span className="font-extrabold text-sm">Universal Fit — All Vehicles</span>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed font-label">
                  {product.compatibility.universalNotes ||
                    'Engineered with universal wiring harnesses and adaptable mounting brackets. Compatible across all vehicle makes and platforms.'}
                </p>
              </div>
            ) : activeVehicle && compatibility.compatible ? (
              /* Guaranteed Fit Banner */
              <div className="p-4 bg-emerald-50 border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-extrabold text-sm">
                    Guaranteed Fit for {activeVehicle.make} {activeVehicle.model} ({activeVehicle.generation || activeVehicle.yearRange})
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-label">
                  Verified factory OEM+ fitment. Direct bolt-on / plug-and-play installation with zero modifications required.
                </p>
              </div>
            ) : activeVehicle && !compatibility.compatible ? (
              /* Incompatible Banner */
              <div className="p-4 bg-rose-50 border-rose-200 space-y-3">
                <div className="flex items-center space-x-2 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="font-extrabold text-sm">
                    Does Not Fit Your {activeVehicle.make} {activeVehicle.model}
                  </span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed font-label">
                  This part is designed specifically for other vehicle architectures.
                  {product.compatibility.compatibleMakes && (
                    <span className="block mt-1">
                      Compatible Makes: {product.compatibility.compatibleMakes.join(', ')}
                    </span>
                  )}
                </p>
                <button
                  onClick={openGarageModal}
                  className="text-xs font-bold text-[#DC2626] hover:text-red-700 underline font-label"
                >
                  Switch vehicle in My Garage →
                </button>
              </div>
            ) : (
              /* No Vehicle Selected Prompt */
              <div className="p-4 bg-slate-50 border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#0F172A]">
                    <Car className="w-5 h-5 text-[#DC2626] shrink-0" />
                    <span className="font-extrabold text-sm">Check Fitment for Your Vehicle</span>
                  </div>
                  <span className="text-[10px] uppercase font-label px-2 py-0.5 rounded-full bg-red-100 text-[#DC2626] font-bold border border-red-200">
                    Fitment Check
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-label leading-relaxed">
                  Select your vehicle make and model to confirm precision fitment before placing your order.
                </p>
                <button
                  onClick={openGarageModal}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#0F172A] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Car className="w-4 h-4 text-[#DC2626]" />
                  <span>Select Vehicle in Garage</span>
                </button>
              </div>
            )}
          </div>

          {/* Description Snippet */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-label">
            {product.description}
          </p>

          {/* Quantity Selector & Add to Cart Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-4">
              {/* Quantity Counter */}
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl px-2 py-1 shadow-sm">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || !inStock}
                  className="p-2 text-slate-400 hover:text-[#0F172A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#0F172A] font-label">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={!inStock}
                  className="p-2 text-slate-400 hover:text-[#0F172A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3.5 rounded-xl border transition-all shadow-sm ${
                  inWishlist
                    ? 'bg-red-50 border-red-200 text-[#DC2626]'
                    : 'bg-white border-[#E2E8F0] text-slate-400 hover:text-[#DC2626] hover:bg-slate-50'
                }`}
                title={inWishlist ? 'In your wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-[#DC2626]' : ''}`} />
              </button>
            </div>

            {/* Main Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`w-full py-4 rounded-xl text-sm font-extrabold uppercase tracking-wider transition-all duration-200 ease-out flex items-center justify-center space-x-2 shadow-md ${
                addedAnimation
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25 scale-[1.01]'
                  : inStock
                  ? 'bg-[#DC2626] hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 text-white shadow-red-500/25 hover:shadow-red-500/40'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-5 h-5 animate-scale-in" />
                  <span>Added to Shopping Cart!</span>
                </>
              ) : inStock ? (
                <>
                  <ShoppingBag className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                  <span>Add to Cart — ₹{(product.price * quantity).toFixed(2)}</span>
                </>
              ) : (
                <span>Sold Out</span>
              )}
            </button>

            {/* Direct WhatsApp Concierge Button */}
            <a
              href={whatsappEnquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-emerald-300 text-slate-700 hover:text-emerald-700 hover:-translate-y-0.5 active:scale-95 text-xs font-bold tracking-wide transition-all duration-200 ease-out flex items-center justify-center space-x-2 shadow-sm font-label"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 transition-transform duration-200 hover:scale-110" />
              <span>Ask Concierge About This Part on WhatsApp</span>
            </a>
          </div>

          {/* Delivery & Assurance Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E2E8F0] text-xs text-slate-600 font-label">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>Worldwide Air Express</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>2-Year Warranty</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>30-Day Guaranteed Fit</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>100% Genuine Materials</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details, Specs Table, & Compatibility Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-8 border-t border-[#E2E8F0]">
        {/* Specifications Table (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#DC2626]" />
            <h2 className="text-lg font-extrabold text-[#0F172A] uppercase tracking-tight">
              Technical Specifications
            </h2>
          </div>

          {specsList.length > 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden divide-y divide-[#E2E8F0] shadow-subtle">
              {specsList.map((spec, index) => (
                <div
                  key={index}
                  className="px-5 py-3.5 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-500 font-label">{spec.label}</span>
                  <span className="font-bold text-[#0F172A] text-right">
                    {spec.value}
                  </span>
                </div>
              ))}
              <div className="px-5 py-3.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 font-label">SKU Reference</span>
                <span className="font-bold text-[#0F172A]">{product.sku}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white text-xs text-slate-500 shadow-subtle">
              Technical specifications are certified according to factory OEM dimensions.
            </div>
          )}

          {/* Long Description */}
          {product.longDescription && (
            <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-3 shadow-subtle">
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
                Product Overview
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-label">
                {product.longDescription}
              </p>
            </div>
          )}
        </div>

        {/* Compatibility Matrix & Vehicle Fitment List (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-[#DC2626]" />
            <h2 className="text-lg font-extrabold text-[#0F172A] uppercase tracking-tight">
              Verified Vehicle Compatibility
            </h2>
          </div>

          <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4 shadow-subtle">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-[#E2E8F0]">
              <span className="text-slate-500 font-label font-medium">Fitment Rule Classification</span>
              <span className="uppercase font-bold text-[#DC2626] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 font-label text-[10px]">
                {product.compatibility.type} Fitment
              </span>
            </div>

            {/* List of Compatible Vehicles */}
            {product.compatibility.vehiclesDisplay &&
            product.compatibility.vehiclesDisplay.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium font-label">
                  Verified platforms confirmed for precision installation:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {product.compatibility.vehiclesDisplay.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-extrabold text-[#0F172A]">
                          {v.make} {v.model}
                        </span>
                        {v.generation && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                            {v.generation}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-label text-[11px] font-semibold">
                        {v.yearStart} - {v.yearEnd || 'Present'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : product.compatibility.type === 'universal' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed font-label">
                  This is a universal accessory engineered to install seamlessly across all luxury automotive marques with 12V electrical systems or standard mounting interfaces.
                </p>
                {product.compatibility.universalNotes && (
                  <p className="text-xs text-[#0F172A] font-medium bg-slate-50 p-3 rounded-xl border border-[#E2E8F0]">
                    Note: {product.compatibility.universalNotes}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-600 font-label">
                Compatible with:{' '}
                <strong className="text-[#0F172A] font-bold">
                  {product.compatibility.compatibleMakes?.join(', ') || 'Selected Models'}
                </strong>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={openGarageModal}
                className="text-xs font-bold text-[#DC2626] hover:text-red-700 flex items-center space-x-1 font-label"
              >
                <span>Select your vehicle to confirm fitment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-label uppercase tracking-wider text-[#DC2626] font-bold">
                Complete The Build
              </span>
              <h2 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight">
                Related Upgrades
              </h2>
            </div>
            <Link
              href={`/products?category=${product.category}`}
              className="text-xs font-bold text-[#DC2626] hover:text-red-700 flex items-center space-x-1 transition-colors uppercase tracking-wider font-label"
            >
              <span>View Category</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.slice(0, 4).map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="md:hidden fixed bottom-12 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom duration-200">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-label uppercase font-bold">Total Price</span>
          <span className="text-base font-black text-[#0F172A]">
            ₹{(product.price * quantity).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={whatsappEnquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
            title="Ask Concierge on WhatsApp"
            aria-label="Ask Concierge on WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </a>

          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ease-out active:scale-95 flex items-center space-x-1.5 shadow-sm ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : inStock
                ? 'bg-[#DC2626] hover:bg-red-700 text-white shadow-red-500/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added!</span>
              </>
            ) : inStock ? (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
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
