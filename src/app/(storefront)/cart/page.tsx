'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useGarage } from '@/context/GarageContext';
import { useAuth } from '@/context/AuthContext';
import { checkCompatibility } from '@/lib/compatibility';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Car,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    totalCount,
    subtotal,
    shipping,
    tax,
    totalAmount,
    freeShippingThreshold,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const { selectedVehicle, openGarageModal } = useGarage();
  const { user } = useAuth();

  const handleProceedToCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-[#0F172A] uppercase">
          Shopping Cart ({totalCount} {totalCount === 1 ? 'item' : 'items'})
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-label">
          Review your items and verified vehicle compatibility before proceeding to WhatsApp concierge.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items List (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Progress Indicator */}
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-2 shadow-subtle">
              <div className="flex items-center justify-between text-xs font-label">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" />
                  {amountToFreeShipping > 0
                    ? `Add $${amountToFreeShipping.toFixed(2)} more for Free Express Air Shipping`
                    : 'You have unlocked Complimentary Express Shipping!'}
                </span>
                <span className="font-bold text-[#DC2626]">
                  {freeShippingProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#DC2626] rounded-full transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            <div className="divide-y divide-[#E2E8F0] rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden shadow-subtle">
              {items.map(({ product, quantity }) => {
                const fitment = checkCompatibility(product, selectedVehicle);

                return (
                  <div
                    key={product.id}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Image */}
                    <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-slate-100 border border-[#E2E8F0] shrink-0">
                      <Image
                        src={product.featuredImage || product.images?.[0] || '/placeholder.png'}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <span className="text-[10px] font-label font-bold uppercase tracking-wider text-[#DC2626]">
                        {product.categoryName || product.category}
                      </span>
                      <Link
                        href={`/products/${product.id}`}
                        className="block text-sm font-extrabold text-[#0F172A] hover:text-[#DC2626] transition-colors truncate"
                      >
                        {product.title}
                      </Link>

                      {/* Compatibility Indicator */}
                      <div className="flex items-center space-x-1.5 text-xs font-label">
                        {fitment.compatible && selectedVehicle ? (
                          <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Fits {selectedVehicle.make} {selectedVehicle.model}</span>
                          </span>
                        ) : !fitment.compatible && selectedVehicle ? (
                          <span className="text-rose-700 flex items-center gap-1 text-[11px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Fitment warning for {selectedVehicle.make} {selectedVehicle.model}</span>
                          </span>
                        ) : fitment.reason === 'universal' ? (
                          <span className="text-sky-700 text-[11px] font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-sky-600" />
                            <span>Universal Fit</span>
                          </span>
                        ) : (
                          <button
                            onClick={openGarageModal}
                            className="text-[#DC2626] hover:text-red-700 text-[11px] font-bold flex items-center gap-1 underline underline-offset-2"
                          >
                            <Car className="w-3 h-3" />
                            <span>Select vehicle to check fit</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1.5 text-slate-400 hover:text-[#0F172A] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[#0F172A] font-label">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="p-1.5 text-slate-400 hover:text-[#0F172A] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-24 text-right text-base font-black text-[#0F172A]">
                        ${(product.price * quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeItem(product.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 font-label">
              <Link
                href="/products"
                className="text-[#DC2626] hover:text-red-700 font-bold flex items-center space-x-1"
              >
                <span>← Continue Shopping</span>
              </Link>

              <button
                onClick={clearCart}
                className="text-slate-400 hover:text-red-600 transition-colors font-semibold"
              >
                Clear Shopping Cart
              </button>
            </div>
          </div>

          {/* Order Summary (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-subtle">
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider font-label">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs divide-y divide-[#E2E8F0] font-label">
                <div className="flex justify-between text-slate-600 pb-2">
                  <span>Subtotal</span>
                  <span className="text-[#0F172A] font-bold">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 py-2">
                  <span>Estimated Shipping</span>
                  <span className="font-bold">
                    {shipping === 0 ? (
                      <span className="text-emerald-700">FREE</span>
                    ) : (
                      <span className="text-[#0F172A]">${shipping.toFixed(2)}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 py-2">
                  <span>Estimated Tax (8%)</span>
                  <span className="text-[#0F172A] font-bold">
                    ${tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-[#0F172A] pt-3">
                  <span>Total Amount</span>
                  <span className="text-[#0F172A]">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 rounded-xl bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] text-white font-extrabold uppercase text-xs tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md shadow-red-500/20"
                >
                  {user ? (
                    <>
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E2E8F0] text-[11px] text-slate-600 leading-relaxed space-y-1 font-label">
                <div className="font-bold text-[#0F172A] flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                  <span>Zero Online Payment Notice</span>
                </div>
                <p>
                  No payment is collected on this website. Placing your order creates a WhatsApp enquiry to verify vehicle fitment and finalize manual payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center rounded-3xl bg-white border border-[#E2E8F0] space-y-4 max-w-lg mx-auto shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-[#DC2626]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#0F172A]">Your cart is empty</h3>
            <p className="text-xs text-slate-500 font-label">
              Browse our bespoke automotive accessories and carbon fiber upgrades to add items.
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
