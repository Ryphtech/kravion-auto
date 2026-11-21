'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  Store,
  DollarSign,
  Truck,
  Bell,
} from 'lucide-react';
import {
  getStoreSettings,
  updateStoreSettings,
} from '@/lib/data-service';
import { StoreSettings } from '@/types';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [storeName, setStoreName] = useState('Kravion Auto');
  const [contactPhone, setContactPhone] = useState('+1 (800) 555-0199');
  const [whatsappNumber, setWhatsappNumber] = useState('919876543210');
  const [supportEmail, setSupportEmail] = useState('concierge@kravion.com');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | string>(15000);
  const [announcementText, setAnnouncementText] = useState('Complimentary bespoke shipping on orders over ₹15,000');

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await getStoreSettings();
        if (s) {
          setStoreName(s.storeName || 'Kravion Auto');
          setContactPhone(s.contactPhone || '+1 (800) 555-0199');
          setWhatsappNumber(
            s.whatsappRecipientNumber || (s as any).whatsappNumber || '919876543210'
          );
          setSupportEmail(s.supportEmail || 'concierge@kravion.com');
          setCurrency(s.currency || 'INR');
          setCurrencySymbol(s.currencySymbol || '₹');
          if (s.freeShippingThreshold !== undefined) {
            setFreeShippingThreshold(s.freeShippingThreshold);
          }
          if (s.announcementText) {
            setAnnouncementText(s.announcementText);
          }
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      showNotification('error', 'Store name is required.');
      return;
    }

    const cleanWaPhone = whatsappNumber.replace(/[^\d]/g, '');
    if (!cleanWaPhone || cleanWaPhone.length < 8) {
      showNotification('error', 'Please enter a valid WhatsApp phone number with country code.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<StoreSettings> & { whatsappNumber?: string } = {
        storeName: storeName.trim(),
        contactPhone: contactPhone.trim(),
        whatsappRecipientNumber: cleanWaPhone,
        whatsappNumber: cleanWaPhone,
        supportEmail: supportEmail.trim(),
        currency: currency.trim() || 'INR',
        currencySymbol: currencySymbol.trim() || '₹',
        freeShippingThreshold: Number(freeShippingThreshold) || 15000,
        announcementText: announcementText.trim(),
      };

      await updateStoreSettings(payload);
      showNotification('success', 'Store settings and WhatsApp configuration updated.');
    } catch (err: any) {
      console.error('Failed to update store settings:', err);
      showNotification('error', err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = () => {
    const cleanPhone = whatsappNumber.replace(/[^\d]/g, '');
    if (!cleanPhone) {
      showNotification('error', 'Enter a valid WhatsApp phone number first.');
      return;
    }
    const testMsg = `*Kravion Auto Configuration Test*\nThis is a verification ping from the Kravion Auto Admin Dashboard. WhatsApp checkout hand-off is operational!`;
    const testUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(testMsg)}`;
    window.open(testUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2 font-headline">
          <Settings className="w-5 h-5 text-[#DC2626]" />
          <span>Global Store Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure branding, WhatsApp concierge routing, currencies, and free shipping parameters
        </p>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Store & Branding */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-subtle">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2 font-headline">
            <Store className="w-4 h-4 text-[#DC2626]" /> 1. Store Identity & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Store Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Customer Support Email <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Public Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: WhatsApp Concierge Engine */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2 font-headline">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> 2. WhatsApp Hand-off Configuration
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Zero Payment Gateway
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            All customer orders on the storefront are formatted and dispatched directly to this WhatsApp phone number. Enter with country code without spaces or dashes (e.g. <span className="font-mono font-medium text-slate-800">16505550199</span> or <span className="font-mono font-medium text-slate-800">919876543210</span>).
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Recipient WhatsApp Phone Number <span className="text-[#DC2626]">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MessageSquare className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 16505550199"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono text-[#0F172A] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-all shrink-0 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test WhatsApp Link</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Target URL format: <span className="font-mono text-slate-700">https://wa.me/{whatsappNumber.replace(/[^\d]/g, '') || '[PHONE]'}?text=...</span>
            </p>
          </div>
        </div>

        {/* Section 3: Currency & Shipping Thresholds */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-subtle">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2 font-headline">
            <DollarSign className="w-4 h-4 text-[#DC2626]" /> 3. Currency & Shipping Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Currency Code</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono uppercase text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#DC2626]" /> Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-[#DC2626]" /> Top Bar Announcement Banner Text
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#DC2626] hover:bg-red-700 text-white transition-all shadow-subtle disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}