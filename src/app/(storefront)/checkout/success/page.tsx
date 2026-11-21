'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const orderRef = searchParams.get('ref') || orderId || 'KRAV-ENQUIRY';

  const [recentOrder, setRecentOrder] = useState<any>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('kravion_recent_order');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.id === orderId || parsed.orderNumber === orderRef)) {
            setRecentOrder(parsed);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to recover recent order details:', err);
    }
  }, [orderId, orderRef]);

  const whatsappUrl = recentOrder?.whatsappUrl;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8 font-sans">
      {/* Success Badge & Headline */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-label font-bold uppercase tracking-widest text-emerald-700">
          Enquiry Successfully Registered
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
          Thank You for Your Order Enquiry
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-label">
          Your order enquiry reference is{' '}
          <span className="font-bold text-[#DC2626] px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 font-mono">
            {orderRef}
          </span>
          . Our automotive concierge team is ready to verify fitment and finalize details.
        </p>
      </div>

      {/* Zero-Payment Confirmation Notice */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-2 shadow-subtle">
        <div className="flex items-center space-x-2 text-[#0F172A] font-extrabold text-xs uppercase tracking-wider font-label">
          <ShieldCheck className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>Payment Notice & Guarantee</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-label">
          No online payment has been collected or charged to your account. Kravion Auto operates via bespoke WhatsApp Concierge where we verify compatibility, calculate custom shipping if applicable, and provide official manual payment confirmation directly.
        </p>
      </div>

      {/* WhatsApp Fallback Callout */}
      {whatsappUrl && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-extrabold text-emerald-950 flex items-center justify-center sm:justify-start space-x-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Did WhatsApp not open automatically?</span>
            </h3>
            <p className="text-xs text-emerald-800 font-label">
              Click the button to open your pre-formatted order enquiry in WhatsApp right now.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 shrink-0 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Open WhatsApp Again</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      )}

      {/* Continue Browsing Action */}
      <div className="pt-4 text-center">
        <Link
          href="/products"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Browsing Catalogue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-500 text-xs font-label">
          Loading order confirmation details...
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
