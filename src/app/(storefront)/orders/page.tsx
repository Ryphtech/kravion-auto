'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getCustomerOrders } from '@/lib/data-service';
import { OrderEnquiry } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Package,
  Car,
  Clock,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Search,
  Copy,
  Check,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Calendar,
  AlertCircle,
  User,
  Filter,
} from 'lucide-react';

export default function CustomerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'enquiry_placed' | 'contacted' | 'confirmed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomerOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getCustomerOrders(user.uid);
        setOrders(data);
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadCustomerOrders();
    }
  }, [user, authLoading]);

  const copyOrderRef = (refText: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(refText);
      setCopiedId(refText);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getStatusBadge = (status: OrderEnquiry['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Confirmed Order</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Concierge Reviewing</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Cancelled</span>
          </span>
        );
      case 'enquiry_placed':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting Fitment Review</span>
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesStatus;

    const orderRef = ((order as any).orderNumber || order.id || '').toLowerCase();
    const matchesRef = orderRef.includes(query);
    const matchesItem = order.items.some(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.sku && item.sku.toLowerCase().includes(query)) ||
        ((item as any).partNumber && (item as any).partNumber.toLowerCase().includes(query))
    );
    const vehicleText = order.vehicleInfo
      ? `${order.vehicleInfo.make} ${order.vehicleInfo.model}`.toLowerCase()
      : '';
    const matchesVehicle = vehicleText.includes(query);

    return matchesStatus && (matchesRef || matchesItem || matchesVehicle);
  });

  // Not signed in state
  if (!authLoading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 font-sans text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <User className="w-8 h-8 text-[#DC2626]" />
        </div>
        <span className="text-xs font-label font-bold uppercase tracking-widest text-[#DC2626]">
          Customer Account Required
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight mt-1 mb-3">
          Sign In to Access Your Orders
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
          Track bespoke automotive fitment verifications, direct WhatsApp concierge enquiry threads, and historical order manifests.
        </p>
        <Link
          href="/login?redirect=/orders"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
        >
          <span>Sign In to Your Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-sans space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <nav className="flex items-center space-x-2 text-[11px] font-label font-bold uppercase tracking-wider text-slate-400 mb-2">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-[#DC2626]">My Orders</span>
          </nav>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              My Orders & Enquiries
            </h1>
            {!loading && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono text-xs font-bold">
                {orders.length}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time fitment checks, concierge order manifests, and WhatsApp dispatch coordination.
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shrink-0 self-start md:self-end"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#DC2626]" />
          <span>Explore Catalog</span>
        </Link>
      </div>

      {/* Zero Payment & WhatsApp Hand-Off Guarantee Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50/60 to-white border border-red-100 flex items-start space-x-3.5 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-[#0F172A] tracking-tight">
            Direct Concierge Order Verification Guarantee
          </p>
          <p className="text-slate-600 leading-relaxed font-label">
            Kravion Auto verifies engineering tolerances and vehicle chassis fitment directly over WhatsApp before taking payment. Click any order&apos;s WhatsApp Concierge button to open or resume discussion with your dedicated automotive specialist.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'enquiry_placed', label: 'Awaiting Review' },
            { id: 'contacted', label: 'In Concierge' },
            { id: 'confirmed', label: 'Confirmed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                statusFilter === tab.id
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-[#E2E8F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search inside orders */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ref, item, make..."
            className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-[#E2E8F0] animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-slate-200 rounded" />
                <div className="h-6 w-24 bg-slate-200 rounded-full" />
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E2E8F0] space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#0F172A]">
              {searchQuery || statusFilter !== 'all'
                ? 'No Matching Orders Found'
                : 'No Order Enquiries Yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'Explore our catalog of premium carbon splitters, dynamic ambient lights, and valvetronic exhausts.'}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const orderRef = (order as any).orderNumber || order.id;
            const formattedDate = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recently placed';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-label uppercase font-bold">
                        Enquiry:
                      </span>
                      <span className="font-mono font-bold text-sm text-[#0F172A]">
                        #{orderRef}
                      </span>
                      <button
                        onClick={() => copyOrderRef(orderRef)}
                        title="Copy Order Reference"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        {copiedId === orderRef ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 font-label">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Vehicle Fitment Card (if present) */}
                {order.vehicleInfo && (
                  <div className="px-4 sm:px-5 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center space-x-2 truncate">
                      <Car className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-slate-400 font-label uppercase text-[10px] tracking-wider font-bold">
                        Verified Vehicle:
                      </span>
                      <span className="font-bold truncate">
                        {order.vehicleInfo.make} {order.vehicleInfo.model} ({order.vehicleInfo.year})
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 flex items-center space-x-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Chassis Matched</span>
                    </span>
                  </div>
                )}

                {/* Items Breakdown */}
                <div className="p-4 sm:p-5 divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] truncate hover:text-[#DC2626] transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-label mt-0.5">
                            {(item.sku || (item as any).partNumber) && (
                              <span className="font-mono text-slate-400">
                                {item.sku || (item as any).partNumber}
                              </span>
                            )}
                            <span>Qty: {item.quantity}</span>
                            <span>•</span>
                            <span>{formatCurrency(item.unitPrice, order.currency)} each</span>
                          </div>
                          {item.compatibilityNote && (
                            <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 font-medium">
                              {item.compatibilityNote}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#0F172A]">
                          {formatCurrency(item.subtotal || item.unitPrice * item.quantity, order.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & Financial Breakdown Footer */}
                <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Shipping Address Summary */}
                  {order.shippingAddress && (
                    <div className="text-xs text-slate-500 flex items-start space-x-2 max-w-sm">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 leading-snug">
                        <p className="font-bold text-[#0F172A]">
                          {order.shippingAddress.fullName || order.customerName} • {order.customerPhone}
                        </p>
                        <p className="truncate text-slate-500 text-[11px]">
                          {order.shippingAddress.street || (order.shippingAddress as any).addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions & Totals */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-label uppercase font-bold text-slate-400 block">
                        Total Order Amount
                      </span>
                      <span className="font-mono font-extrabold text-base text-[#DC2626]">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </span>
                    </div>

                    {order.whatsappUrl && (
                      <a
                        href={order.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Open WhatsApp Concierge</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
