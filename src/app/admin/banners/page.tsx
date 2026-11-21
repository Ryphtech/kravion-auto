'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Globe,
  Info,
} from 'lucide-react';
import {
  getAllPosters,
  savePoster,
  deletePoster,
} from '@/lib/data-service';
import { CarouselPoster } from '@/types';
import { ImageUploader } from '@/components/admin/ImageUploader';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<CarouselPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile' | 'all'>('desktop');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<CarouselPoster> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formButtonText, setFormButtonText] = useState('Explore Collection');
  const [formLinkUrl, setFormLinkUrl] = useState('/products');
  const [formOrder, setFormOrder] = useState<number | string>(1);
  const [formActive, setFormActive] = useState(true);
  const [formTargetDevice, setFormTargetDevice] = useState<'desktop' | 'mobile' | 'all'>('desktop');

  const loadData = async () => {
    setLoading(true);
    try {
      const posters = await getAllPosters();
      setBanners(posters);
    } catch (err) {
      console.error('Failed to load hero posters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Device Counts
  const desktopCount = useMemo(
    () => banners.filter((b) => b.targetDevice === 'desktop' || b.targetDevice === 'all' || !b.targetDevice).length,
    [banners]
  );
  const mobileCount = useMemo(
    () => banners.filter((b) => b.targetDevice === 'mobile' || b.targetDevice === 'all').length,
    [banners]
  );

  const filteredBanners = useMemo(() => {
    if (activeTab === 'desktop') {
      return banners.filter((b) => b.targetDevice === 'desktop' || b.targetDevice === 'all' || !b.targetDevice);
    }
    if (activeTab === 'mobile') {
      return banners.filter((b) => b.targetDevice === 'mobile' || b.targetDevice === 'all');
    }
    return banners;
  }, [banners, activeTab]);

  const handleOpenAddModal = (presetDevice?: 'desktop' | 'mobile' | 'all') => {
    const target = presetDevice || (activeTab === 'mobile' ? 'mobile' : 'desktop');
    setEditingBanner(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormImageUrl('https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp');
    setFormButtonText('Explore Collection');
    setFormLinkUrl('/products');
    setFormOrder(filteredBanners.length + 1);
    setFormActive(true);
    setFormTargetDevice(target);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: CarouselPoster) => {
    setEditingBanner(b);
    setFormTitle(b.title);
    setFormSubtitle(b.subtitle);
    setFormImageUrl(b.imageUrl);
    setFormButtonText(b.buttonText);
    setFormLinkUrl(b.linkUrl);
    setFormOrder(b.displayOrder);
    setFormActive(b.active);
    setFormTargetDevice(b.targetDevice || 'desktop');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showNotification('error', 'Banner title is required.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<CarouselPoster> = {
        id: editingBanner?.id,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        imageUrl: formImageUrl || 'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp',
        buttonText: formButtonText.trim() || 'Explore Collection',
        linkUrl: formLinkUrl.trim() || '/products',
        displayOrder: Number(formOrder) || 1,
        active: formActive,
        targetDevice: formTargetDevice,
      };

      await savePoster(payload);
      await loadData();
      setIsModalOpen(false);
      showNotification('success', `Banner "${payload.title}" saved for ${formTargetDevice === 'all' ? 'All Devices' : formTargetDevice === 'mobile' ? 'Mobile' : 'Desktop'}.`);
    } catch (err: any) {
      console.error('Save banner error:', err);
      showNotification('error', err.message || 'Failed to save poster.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (b: CarouselPoster) => {
    try {
      const updated = !b.active;
      await savePoster({ ...b, active: updated });
      setBanners((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, active: updated } : item))
      );
      showNotification('success', `Banner status set to ${updated ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      console.error('Toggle banner active error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePoster(id);
      await loadData();
      setDeleteConfirmId(null);
      showNotification('success', 'Banner slide deleted.');
    } catch (err: any) {
      console.error('Delete banner error:', err);
      showNotification('error', err.message || 'Failed to delete banner.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2 font-headline">
            <ImageIcon className="w-5 h-5 text-[#DC2626]" />
            <span>Homepage Hero Carousel Banners</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure separate responsive carousels for Desktop wide-screens and Mobile mobile devices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAddModal(activeTab === 'mobile' ? 'mobile' : 'desktop')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase bg-[#DC2626] hover:bg-red-700 text-white shadow-subtle transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'mobile'
                ? 'Add Mobile Slide'
                : activeTab === 'desktop'
                ? 'Add Desktop Slide'
                : 'Add Carousel Slide'}
            </span>
          </button>
        </div>
      </div>

      {/* Device Separation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'desktop'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Carousels</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'desktop' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {desktopCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'mobile'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Carousels</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'mobile' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {mobileCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All Devices</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {banners.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-label flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#DC2626]" />
          <span>
            {activeTab === 'mobile'
              ? 'Mobile hero renders only pure visual images without text overlay.'
              : activeTab === 'desktop'
              ? 'Desktop hero renders full-width landscape banner with typography overlays.'
              : 'Managing all hero carousel assets across desktop and mobile screens.'}
          </span>
        </div>
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

      {/* Banners Grid / Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 uppercase tracking-wider font-semibold border-b border-[#E2E8F0] font-label">
              <tr>
                <th className="px-5 py-3.5">Banner Preview</th>
                <th className="px-4 py-3.5">Headline & Subtitle</th>
                <th className="px-4 py-3.5 text-center">Target Device</th>
                <th className="px-4 py-3.5">Call to Action</th>
                <th className="px-4 py-3.5 text-center">Order</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading banners...
                  </td>
                </tr>
              ) : filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No carousel banners found for{' '}
                    <span className="font-bold">
                      {activeTab === 'desktop' ? 'Desktop' : activeTab === 'mobile' ? 'Mobile' : 'All Devices'}
                    </span>
                    . Click &quot;Add {activeTab === 'mobile' ? 'Mobile' : 'Desktop'} Slide&quot; above to create one.
                  </td>
                </tr>
              ) : (
                filteredBanners.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Thumbnail Preview */}
                    <td className="px-5 py-3.5">
                      <div className="w-28 sm:w-36 h-16 rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-100 relative shadow-subtle">
                        <img
                          src={b.imageUrl || 'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev/placeholder.webp'}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Headline & Subtitle */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-[#0F172A] text-sm max-w-sm truncate">{b.title}</p>
                      <p className="text-slate-500 text-[11px] max-w-sm truncate mt-0.5">
                        {b.subtitle}
                      </p>
                    </td>

                    {/* Target Device */}
                    <td className="px-4 py-3.5 text-center">
                      {b.targetDevice === 'mobile' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Smartphone className="w-3 h-3 text-purple-600" />
                          <span>Mobile</span>
                        </span>
                      ) : b.targetDevice === 'all' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>Both</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <Monitor className="w-3 h-3 text-sky-600" />
                          <span>Desktop</span>
                        </span>
                      )}
                    </td>

                    {/* CTA */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#DC2626] text-xs">
                        <span>{b.buttonText}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.linkUrl}</p>
                    </td>

                    {/* Display Order */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0F172A]">
                      #{b.displayOrder}
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(b)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          b.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:text-slate-700'
                        }`}
                      >
                        {b.active ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(b)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-[#E2E8F0]"
                          title="Edit Banner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(b.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#0F172A]">Confirm Slide Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this hero slide from the carousel?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#DC2626] hover:bg-red-700 text-white transition-colors"
              >
                Delete Slide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 font-headline">
                <ImageIcon className="w-4 h-4 text-[#DC2626]" />
                <span>{editingBanner ? 'Edit Hero Banner' : 'Add Hero Banner'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Target Device Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Target Carousel Device <span className="text-[#DC2626]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTargetDevice('desktop')}
                    className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formTargetDevice === 'desktop'
                        ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-sm'
                        : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Monitor className="w-4 h-4 text-sky-600" />
                    <span>Desktop Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetDevice('mobile')}
                    className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formTargetDevice === 'mobile'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm'
                        : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span>Mobile Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetDevice('all')}
                    className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formTargetDevice === 'all'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Both Devices</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  {formTargetDevice === 'mobile' ? (
                    <span className="text-purple-700 font-medium">
                      📱 On mobile view, the hero card displays only the vehicle photo (no text overlay). Recommend portrait or centered car photos.
                    </span>
                  ) : formTargetDevice === 'desktop' ? (
                    <span className="text-sky-700 font-medium">
                      🖥️ On desktop, this slide displays full-bleed 16:9 artwork with the headline, features, and buttons.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      🌐 This slide will be included in both desktop and mobile hero rotations.
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Headline Title <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterpiece Aerodynamics & Carbon Craftsmanship"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Designed for track dominance and everyday elegance."
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Button Text</label>
                  <input
                    type="text"
                    placeholder="Explore Collection"
                    value={formButtonText}
                    onChange={(e) => setFormButtonText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Destination Link</label>
                  <input
                    type="text"
                    placeholder="/products?category=exterior"
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                    />
                    <span>Active in Carousel</span>
                  </label>
                </div>
              </div>

              {/* R2 Image Uploader */}
              <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
                <ImageUploader
                  label={`Hero Slide Artwork (${formTargetDevice === 'mobile' ? 'Mobile / Portrait' : 'Desktop / Landscape'})`}
                  folder="banners"
                  value={formImageUrl}
                  onChange={(url) => setFormImageUrl(url)}
                />
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#DC2626] hover:bg-red-700 text-white transition-all shadow-subtle disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingBanner ? 'Update Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
