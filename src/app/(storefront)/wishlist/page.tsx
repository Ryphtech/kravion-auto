'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { items, count, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[#0F172A] uppercase">
            My Wishlist ({count} {count === 1 ? 'item' : 'items'})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-label">
            Save your favorite upgrades and move them directly into your shopping cart.
          </p>
        </div>

        {count > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs text-slate-400 hover:text-red-600 font-semibold transition-colors font-label"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {count > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl bg-white border border-[#E2E8F0] p-4 space-y-3 flex flex-col justify-between shadow-subtle hover:shadow-card-hover transition-all"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-[#E2E8F0]">
                <Image
                  src={product.featuredImage || product.images?.[0] || '/placeholder.png'}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-label font-bold uppercase tracking-wider text-[#DC2626]">
                  {product.categoryName || product.category}
                </span>
                <Link
                  href={`/products/${product.id}`}
                  className="block text-sm font-extrabold text-[#0F172A] hover:text-[#DC2626] transition-colors line-clamp-2"
                >
                  {product.title}
                </Link>
                <span className="text-base font-black text-[#0F172A] block">
                  ${product.price.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  onClick={() => {
                    addItem(product, 1);
                    removeFromWishlist(product.id);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>

                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-[#E2E8F0] transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center rounded-3xl bg-white border border-[#E2E8F0] space-y-4 max-w-lg mx-auto shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-[#DC2626]">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#0F172A]">Your wishlist is empty</h3>
            <p className="text-xs text-slate-500 font-label">
              Explore our catalogue and click the heart icon to save products to your wishlist.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            Explore Catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
