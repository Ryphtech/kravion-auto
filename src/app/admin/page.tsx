'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Layers,
  Car,
  ClipboardList,
  PlusCircle,
  MessageSquare,
  Settings,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  getProducts,
  getCategories,
  getVehicles,
  getOrders,
} from '@/lib/data-service';
import { Product, Category, Vehicle, OrderEnquiry } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<OrderEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodList, catList, vehList, ordList] = await Promise.all([
          getProducts(),
          getCategories(),
          getVehicles(),
          getOrders(),
        ]);
        setProducts(prodList);
        setCategories(catList);
        setVehicles(vehList);
        setOrders(ordList);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'enquiry_placed');

  const buildWhatsAppConciergeLink = (order: OrderEnquiry) => {
    const cleanPhone = String(order.customerPhone).replace(/[^\d]/g, '');
    const vehicleText = order.vehicleInfo
      ? `${order.vehicleInfo.make} ${order.vehicleInfo.model} (${order.vehicleInfo.year})`
      : (order as any).vehicleDetails
      ? `${(order as any).vehicleDetails.make} ${(order as any).vehicleDetails.model}`
      : 'vehicle';

    const lines = [
      `*Kravion Auto Concierge Support*`,
      `Hello ${order.customerName},`,
      `Regarding your order enquiry #${(order as any).orderNumber || order.id} for your ${vehicleText}:`,
      `We have verified fitment for all requested items. Total amount is ${formatCurrency(order.totalAmount, order.currency)}.`,
      `Notes: "${order.customerNotes || (order as any).notes || 'None'}"`,
      ``,
      `Please let us know if you would like us to issue the official pro-forma invoice and proceed with dispatch.`,
    ];

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const getStatusBadge = (status: OrderEnquiry['status']) => {
    switch (status) {
      case 'enquiry_placed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Enquiry Placed
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <MessageSquare className="w-3 h-3" /> Contacted
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="text-xs text-slate-500">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="relative rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 overflow-hidden shadow-subtle">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-50/50 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold uppercase tracking-wider mb-3">
            <TrendingUp className="w-3.5 h-3.5" /> Administrative Command Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-headline">
            Kravion Auto Management
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed font-sans">
            Directly orchestrate catalog inventory, vehicle fitment rules, Cloudflare R2 media assets, customer order enquiries, and WhatsApp communication channel settings.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-red-300 hover:shadow-card-hover transition-all shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-label">
              Total Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#DC2626]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono">
              {loading ? '...' : products.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? 'Loading catalog...'
                : `${products.filter((p) => p.inStock).length} in stock · ${products.filter((p) => p.featured).length} featured`}
            </p>
          </div>
        </div>

        {/* Total Categories */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-red-300 hover:shadow-card-hover transition-all shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-label">
              Categories
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono">
              {loading ? '...' : categories.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Active catalog categories
            </p>
          </div>
        </div>

        {/* Vehicles Directory */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-red-300 hover:shadow-card-hover transition-all shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-label">
              Vehicles Directory
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono">
              {loading ? '...' : vehicles.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Supported makes & generations
            </p>
          </div>
        </div>

        {/* Total Enquiries */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-red-300 hover:shadow-card-hover transition-all shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-label">
              Order Enquiries
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#DC2626]">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono">
              {loading ? '...' : orders.length}
            </p>
            <p className="mt-1 text-xs text-[#DC2626] font-semibold">
              {loading ? 'Loading...' : `${pendingOrders.length} pending review`}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/admin/products"
          className="flex items-center space-x-3 p-4 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-red-200 transition-all shadow-subtle hover:shadow-card-hover group"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#DC2626] transition-colors font-headline">
              Add Product
            </p>
            <p className="text-[11px] text-slate-500">Create new catalog item</p>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="flex items-center space-x-3 p-4 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-red-200 transition-all shadow-subtle hover:shadow-card-hover group"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#DC2626] transition-colors font-headline">
              View Enquiries
            </p>
            <p className="text-[11px] text-slate-500">Concierge WhatsApp response</p>
          </div>
        </Link>

        <Link
          href="/admin/banners"
          className="flex items-center space-x-3 p-4 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-red-200 transition-all shadow-subtle hover:shadow-card-hover group"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#DC2626] transition-colors font-headline">
              Manage Banners
            </p>
            <p className="text-[11px] text-slate-500">Hero carousel slides</p>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="flex items-center space-x-3 p-4 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-red-200 transition-all shadow-subtle hover:shadow-card-hover group"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#DC2626] transition-colors font-headline">
              Store Settings
            </p>
            <p className="text-[11px] text-slate-500">WhatsApp & contacts</p>
          </div>
        </Link>
      </div>

      {/* Recent Customer Enquiries Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-subtle">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 font-headline">
              <ClipboardList className="w-4 h-4 text-[#DC2626]" />
              <span>Recent Customer Order Enquiries</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customers waiting for vehicle compatibility confirmation and pro-forma invoice
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-[#DC2626] hover:text-red-700 flex items-center gap-1 transition-colors"
          >
            <span>View All ({orders.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 uppercase tracking-wider font-semibold border-b border-[#E2E8F0] font-label">
              <tr>
                <th className="px-6 py-3.5">Reference</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Total</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading recent enquiries...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-[#0F172A]">No order enquiries recorded yet.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Customer checkouts from the storefront will appear here instantly.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => {
                  const ref = (order as any).orderNumber || order.id;
                  const vehicleStr = order.vehicleInfo
                    ? `${order.vehicleInfo.make} ${order.vehicleInfo.model}`
                    : (order as any).vehicleDetails
                    ? `${(order as any).vehicleDetails.make} ${(order as any).vehicleDetails.model}`
                    : 'Universal';
                  const waUrl = buildWhatsAppConciergeLink(order);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#DC2626]">
                        {ref}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#0F172A]">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{order.customerPhone}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {vehicleStr}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {order.items?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-all shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}