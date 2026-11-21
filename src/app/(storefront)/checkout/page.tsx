'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useGarage } from '@/context/GarageContext';
import { createOrderEnquiry } from '@/lib/data-service';
import {
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Truck,
  Car,
  Lock,
  MessageCircle,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, subtotal, shipping, tax, totalAmount, clearCart } = useCart();
  const { selectedVehicle } = useGarage();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');

  // Vehicle info
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleNotes, setVehicleNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-Checkout Auth Guard: redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, authLoading, router]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || profile?.displayName || user.displayName || '');
      setEmail((prev) => prev || user.email || '');
      if (profile?.phoneNumber) {
        setPhone((prev) => prev || profile.phoneNumber || '');
      }
    }
  }, [user, profile]);

  // Pre-fill garage vehicle if active
  useEffect(() => {
    if (selectedVehicle) {
      setVehicleMake(selectedVehicle.make || '');
      setVehicleModel(selectedVehicle.model || '');
      setVehicleYear(
        selectedVehicle.yearRange ||
          (selectedVehicle.yearStart ? String(selectedVehicle.yearStart) : '')
      );
    }
  }, [selectedVehicle]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-xs font-label">
        Authenticating session security guard...
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-[#DC2626]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#0F172A]">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 font-label">
          Please add items to your shopping cart prior to initiating checkout concierge hand-off.
        </p>
        <Link
          href="/products"
          className="inline-flex px-6 py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
        >
          Browse Catalogue
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      setFormError('Please complete all required shipping fields (Name, Phone, Street, City, Postal Code).');
      return;
    }

    setSubmitting(true);
    try {
      const orderRef = `KRAV-${Math.floor(10000 + Math.random() * 90000)}`;

      const orderPayload: any = {
        orderNumber: orderRef,
        customerId: user.uid,
        customerName: fullName.trim(),
        customerEmail: email.trim() || user.email || '',
        customerPhone: phone.trim(),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          street: street.trim(),
          apartment: apartment.trim() || undefined,
          city: city.trim(),
          state: state.trim() || 'N/A',
          postalCode: postalCode.trim(),
          country: country.trim() || 'United States',
        },
        vehicleInfo: {
          make: vehicleMake.trim() || 'General',
          model: vehicleModel.trim() || 'Vehicle',
          year: parseInt(vehicleYear) || 2024,
          notes: vehicleNotes.trim() || undefined,
        },
        vehicleDetails: {
          make: vehicleMake.trim() || 'General',
          model: vehicleModel.trim() || 'Vehicle',
          year: vehicleYear.trim() || '2024',
          notes: vehicleNotes.trim() || undefined,
        },
        items: items.map((item) => ({
          productId: item.product.id,
          title: item.product.title,
          sku: item.product.sku || item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          subtotal: item.product.price * item.quantity,
          image: item.product.featuredImage || item.product.images?.[0],
        })),
        subtotal,
        shipping,
        tax,
        totalAmount,
        customerNotes: customerNotes.trim() || undefined,
        notes: customerNotes.trim() || undefined,
      };

      const result = await createOrderEnquiry(orderPayload);

      // Save order metadata in local session for success page
      const successData = {
        ...orderPayload,
        id: result.id,
        orderNumber: orderRef,
        whatsappUrl: result.whatsappUrl,
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('kravion_recent_order', JSON.stringify(successData));
      }

      // Clear the shopping cart
      clearCart();

      // Open WhatsApp URL in a new window/tab
      try {
        if (typeof window !== 'undefined' && result.whatsappUrl) {
          window.open(result.whatsappUrl, '_blank');
        }
      } catch (openErr) {
        console.warn('Could not auto-open WhatsApp:', openErr);
      }

      // Navigate to success page
      router.push(`/checkout/success?orderId=${encodeURIComponent(result.id)}&ref=${encodeURIComponent(orderRef)}`);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setFormError(err.message || 'Failed to submit order enquiry. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      {/* Page Title */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2 text-xs font-label font-bold text-[#DC2626] uppercase">
          <Lock className="w-3.5 h-3.5" />
          <span>Authenticated Checkout Guard Active</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#0F172A] uppercase">
          Order Enquiry & WhatsApp Hand-Off
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-label">
          Provide your delivery destination and automobile specifications. Our concierge will review fitment and finalize payment via WhatsApp.
        </p>
      </div>

      {/* Prominent Zero-Payment Notice */}
      <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2 shadow-subtle">
        <div className="flex items-center space-x-2 text-[#DC2626] font-extrabold text-sm font-label">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Notice: Zero Online Payment Collection</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-700 font-label">
          Notice: No online payment is collected on this website. Submitting this order creates an enquiry and prepares a WhatsApp message to verify vehicle fitment and finalize payment manually.
        </p>
      </div>

      {/* Form Error Banner */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-3 font-label">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>{formError}</div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer & Shipping Section */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-subtle">
              <h2 className="text-base font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#DC2626]" />
                <span>Customer & Shipping Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 890-1234"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marcus@example.com"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="742 Evergreen Terrace"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Apartment / Suite (Optional)
                  </label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Apt 4B"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Springfield"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="OR"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="97477"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle & Fitment Verification Section */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-subtle">
              <h2 className="text-base font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center space-x-2">
                <Car className="w-4 h-4 text-[#DC2626]" />
                <span>Automobile Fitment Verification</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Vehicle Make
                  </label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="e.g. BMW"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Model
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. 3 Series (G20)"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                    Year / Generation
                  </label>
                  <input
                    type="text"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    placeholder="e.g. 2023"
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                  VIN or Vehicle Fitment Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={vehicleNotes}
                  onChange={(e) => setVehicleNotes(e.target.value)}
                  placeholder="e.g. Pre-LCI model with M Sport package and HUD..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                  Customer Notes & Special Requests
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Notes for the packaging or dispatch concierge..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Right Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E2E8F0] space-y-5 sticky top-24 shadow-subtle">
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider font-label">
                Order Review ({items.reduce((acc, i) => acc + i.quantity, 0)} items)
              </h3>

              {/* Items List */}
              <div className="divide-y divide-[#E2E8F0] max-h-72 overflow-y-auto pr-1 space-y-2">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="pt-2 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-slate-100 border border-[#E2E8F0] shrink-0">
                        <Image
                          src={product.featuredImage || product.images?.[0] || '/placeholder.png'}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <p className="font-extrabold text-[#0F172A] truncate">
                          {product.title}
                        </p>
                        <span className="text-[11px] text-slate-500 font-label">
                          Qty: {quantity} × ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-[#0F172A] shrink-0">
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-3 text-xs divide-y divide-[#E2E8F0] pt-3 border-t border-[#E2E8F0] font-label">
                <div className="flex justify-between text-slate-600 pb-2">
                  <span>Subtotal</span>
                  <span className="text-[#0F172A] font-bold">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 py-2">
                  <span>Shipping</span>
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
                  <span>Grand Total</span>
                  <span className="text-[#0F172A]">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] disabled:opacity-50 text-white font-black uppercase text-xs tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md shadow-red-500/25"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Submit Enquiry & Open WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-500 text-center leading-relaxed font-label">
                By submitting, you will be redirected to WhatsApp with your pre-formatted order enquiry. No credit card or automated charges occur.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
