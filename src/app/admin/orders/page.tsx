'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  MessageSquare,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Car,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import {
  getOrders,
  updateOrderStatus,
} from '@/lib/data-service';
import { OrderEnquiry } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderEnquiry | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderEnquiry['status']
  ) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const generateAdminConciergeReplyUrl = (order: OrderEnquiry) => {
    const cleanCustomerPhone = String(order.customerPhone).replace(/[^\d]/g, '');
    const vehicleText = order.vehicleInfo
      ? `${order.vehicleInfo.make} ${order.vehicleInfo.model} (${order.vehicleInfo.year})`
      : (order as any).vehicleDetails
      ? `${(order as any).vehicleDetails.make} ${(order as any).vehicleDetails.model}`
      : 'vehicle';

    const orderRef = (order as any).orderNumber || order.id;
    const notesText = order.customerNotes || (order as any).notes || 'None';

    const messageLines = [
      `*Kravion Auto Concierge Support*`,
      `Hello ${order.customerName},`,
      `Regarding your order enquiry #${orderRef} for your ${vehicleText}:`,
      `We have verified fitment for all requested items. Total amount is ${formatCurrency(order.totalAmount, order.currency)}.`,
      `Notes recorded: "${notesText}"`,
      ``,
      `Please let us know if you would like us to issue the official pro-forma invoice and proceed with dispatch.`,
    ];

    return `https://wa.me/${cleanCustomerPhone}?text=${encodeURIComponent(
      messageLines.join('\n')
    )}`;
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
          <span className="text-xs text-slate-500">{status}</span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const orderRef = ((o as any).orderNumber || o.id).toLowerCase();
      const name = o.customerName.toLowerCase();
      const phone = o.customerPhone.toLowerCase();
      const email = o.customerEmail?.toLowerCase() || '';
      return (
        orderRef.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2 font-headline">
            <ClipboardList className="w-5 h-5 text-[#DC2626]" />
            <span>Customer Order Enquiries</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Incoming orders requiring manual WhatsApp fitment verification and concierge dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-[#E2E8F0] shadow-subtle">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero-Payment Guarantee: Handled via WhatsApp quote hand-off</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order reference (KRAV-...), customer name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-slate-700 focus:outline-none focus:border-[#DC2626]"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="enquiry_placed">Enquiry Placed</option>
            <option value="contacted">Contacted</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 uppercase tracking-wider font-semibold border-b border-[#E2E8F0] font-label">
              <tr>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Customer & Phone</th>
                <th className="px-4 py-3.5">Vehicle Context</th>
                <th className="px-4 py-3.5">Total Amount</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading order enquiries...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-[#0F172A]">No order enquiries found.</p>
                    <p className="text-xs text-slate-500 mt-1">Customer checkout submissions will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const ref = (order as any).orderNumber || order.id;
                  const vehicleStr = order.vehicleInfo
                    ? `${order.vehicleInfo.make} ${order.vehicleInfo.model}`
                    : (order as any).vehicleDetails
                    ? `${(order as any).vehicleDetails.make} ${(order as any).vehicleDetails.model}`
                    : 'Universal';
                  const waUrl = generateAdminConciergeReplyUrl(order);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Reference */}
                      <td className="px-5 py-3.5 font-mono font-bold text-[#DC2626]">
                        {ref}
                      </td>

                      {/* Customer Details */}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#0F172A]">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{order.customerPhone}</p>
                        {order.customerEmail && (
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">{order.customerEmail}</p>
                        )}
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Car className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{vehicleStr}</span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0F172A] whitespace-nowrap">
                        {formatCurrency(order.totalAmount, order.currency)}
                        <p className="text-[10px] text-slate-500 font-normal">
                          {order.items?.length || 0} item(s)
                        </p>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as any)
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-[#DC2626]"
                          >
                            <option value="enquiry_placed">Enquiry Placed</option>
                            <option value="contacted">Contacted</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {/* One-Click WhatsApp Action */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (order.status === 'enquiry_placed') {
                                handleStatusChange(order.id, 'contacted');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-all shadow-sm"
                            title="Open Concierge WhatsApp Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          {/* View Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-[#E2E8F0]"
                            title="Inspect Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden my-auto max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 text-[#DC2626] flex items-center justify-center font-mono font-bold text-xs">
                  #
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 font-headline">
                    <span>Enquiry {(selectedOrder as any).orderNumber || selectedOrder.id}</span>
                    {getStatusBadge(selectedOrder.status)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submitted on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div>
                  <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] mb-2 font-label">
                    Customer Information
                  </h4>
                  <p className="font-semibold text-[#0F172A]">{selectedOrder.customerName}</p>
                  <p className="text-slate-600 font-mono mt-0.5">{selectedOrder.customerPhone}</p>
                  <p className="text-slate-500 mt-0.5">{selectedOrder.customerEmail || 'No email'}</p>
                </div>

                <div>
                  <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1 font-label">
                    <MapPin className="w-3 h-3 text-[#DC2626]" /> Shipping Destination
                  </h4>
                  {selectedOrder.shippingAddress ? (
                    <div className="text-slate-700 space-y-0.5">
                      <p>{selectedOrder.shippingAddress.street}</p>
                      {selectedOrder.shippingAddress.apartment && (
                        <p>{selectedOrder.shippingAddress.apartment}</p>
                      )}
                      <p>
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                      </p>
                      <p className="text-slate-500">{selectedOrder.shippingAddress.country}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400">No shipping address recorded</p>
                  )}
                </div>
              </div>

              {/* Vehicle Context & Notes */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#DC2626]" />
                  <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] font-label">
                    Vehicle Fitment Context
                  </span>
                </div>
                <p className="text-slate-800 font-medium">
                  {selectedOrder.vehicleInfo
                    ? `${selectedOrder.vehicleInfo.make} ${selectedOrder.vehicleInfo.model} (${selectedOrder.vehicleInfo.year})`
                    : (selectedOrder as any).vehicleDetails
                    ? `${(selectedOrder as any).vehicleDetails.make} ${(selectedOrder as any).vehicleDetails.model}`
                    : 'Universal application / Not specified'}
                </p>

                {(selectedOrder.customerNotes || (selectedOrder as any).notes) && (
                  <div className="pt-2 border-t border-[#E2E8F0] text-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Customer Delivery / Fitment Notes:
                    </span>
                    <p className="italic bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                      &ldquo;{selectedOrder.customerNotes || (selectedOrder as any).notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Itemized Products */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-xs font-label">
                  Ordered Products ({selectedOrder.items?.length || 0})
                </h4>

                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden divide-y divide-[#E2E8F0]">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center space-x-3 min-w-0">
                        {item.image && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-100 shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F172A] truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Qty: {item.quantity} × {formatCurrency(item.unitPrice, selectedOrder.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-[#0F172A] whitespace-nowrap pl-4">
                        {formatCurrency(item.subtotal || item.unitPrice * item.quantity, selectedOrder.currency)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency((selectedOrder as any).subtotal || selectedOrder.totalAmount, selectedOrder.currency)}</span>
                  </div>
                  {(selectedOrder as any).shipping !== undefined && (
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span className="font-mono">{(selectedOrder as any).shipping === 0 ? 'FREE' : formatCurrency((selectedOrder as any).shipping, selectedOrder.currency)}</span>
                    </div>
                  )}
                  {(selectedOrder as any).tax !== undefined && (
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Tax</span>
                      <span className="font-mono">{formatCurrency((selectedOrder as any).tax, selectedOrder.currency)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#E2E8F0] flex justify-between font-bold text-sm text-[#0F172A]">
                    <span>Total Order Amount</span>
                    <span className="text-[#DC2626] font-mono">{formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="enquiry_placed">Enquiry Placed</option>
                  <option value="contacted">Contacted</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <a
                href={generateAdminConciergeReplyUrl(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (selectedOrder.status === 'enquiry_placed') {
                    handleStatusChange(selectedOrder.id, 'contacted');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Chat</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}