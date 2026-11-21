'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useGarage } from '@/context/GarageContext';
import { Home, Compass, Car, Heart, ShoppingBag } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { selectedVehicle, openGarageModal, isHydrated } = useGarage();

  const isHome = pathname === '/';
  const isProducts = pathname.startsWith('/products');
  const isWishlist = pathname.startsWith('/wishlist');
  const isCart = pathname.startsWith('/cart') || pathname.startsWith('/checkout');

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all font-sans"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ease-out active:scale-90 ${
            isHome
              ? 'text-[#DC2626] font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform duration-200 ${isHome ? 'stroke-[2.5] scale-110' : 'stroke-2'}`} />
          <span className="text-[10px] font-label mt-0.5 tracking-tight">Home</span>
        </Link>

        {/* 2. Catalog / Explore */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ease-out active:scale-90 ${
            isProducts
              ? 'text-[#DC2626] font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Compass className={`w-5 h-5 transition-transform duration-200 ${isProducts ? 'stroke-[2.5] scale-110' : 'stroke-2'}`} />
          <span className="text-[10px] font-label mt-0.5 tracking-tight">Catalog</span>
        </Link>

        {/* 3. My Garage */}
        <button
          onClick={openGarageModal}
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-all duration-200 ease-out active:scale-90"
          aria-label="Open My Garage"
        >
          <div className="relative">
            <Car className="w-5 h-5 stroke-2 transition-transform duration-200 hover:scale-110" />
            {selectedVehicle && isHydrated && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 border border-white"></span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-label mt-0.5 tracking-tight">
            {selectedVehicle && isHydrated ? selectedVehicle.make : 'Garage'}
          </span>
        </button>

        {/* 4. Wishlist */}
        <Link
          href="/wishlist"
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ease-out active:scale-90 ${
            isWishlist
              ? 'text-[#DC2626] font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 transition-transform duration-200 ${isWishlist ? 'stroke-[2.5] fill-[#DC2626] scale-110' : 'stroke-2'}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-white text-[9px] font-bold flex items-center justify-center font-label shadow-sm animate-scale-in">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-label mt-0.5 tracking-tight">Wishlist</span>
        </Link>

        {/* 5. Cart */}
        <Link
          href="/cart"
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ease-out active:scale-90 ${
            isCart
              ? 'text-[#DC2626] font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 transition-transform duration-200 ${isCart ? 'stroke-[2.5] scale-110' : 'stroke-2'}`} />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-white text-[9px] font-extrabold flex items-center justify-center font-label shadow-sm animate-scale-in">
                {totalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-label mt-0.5 tracking-tight">Cart</span>
        </Link>
      </div>
    </nav>
  );
}
