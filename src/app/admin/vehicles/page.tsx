'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Car,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Factory,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getVehicles,
  saveVehicle,
  deleteVehicle,
  renameMake,
  deleteMake,
  addMake,
  getMarqueConfigs,
  saveMarqueConfig,
} from '@/lib/data-service';
import { Vehicle, MarqueConfig } from '@/types';
import { ImageUploader } from '@/components/admin/ImageUploader';

const POPULAR_MAKES = [
  'Audi',
  'BMW',
  'Mercedes-Benz',
  'Porsche',
  'Ferrari',
  'Lamborghini',
  'Aston Martin',
  'Range Rover',
  'Maserati',
];

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [marqueConfigs, setMarqueConfigs] = useState<MarqueConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'makes' | 'home-marques'>('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('all');
  const [marqueFilter, setMarqueFilter] = useState<'all' | 'featured' | 'hidden'>('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isAddMakeModalOpen, setIsAddMakeModalOpen] = useState(false);
  const [isRenameMakeModalOpen, setIsRenameMakeModalOpen] = useState(false);
  const [isDeleteMakeModalOpen, setIsDeleteMakeModalOpen] = useState(false);
  const [isMarqueModalOpen, setIsMarqueModalOpen] = useState(false);
  const [editingMarque, setEditingMarque] = useState<MarqueConfig | null>(null);

  const [activeMakeToModify, setActiveMakeToModify] = useState<string>('');
  const [newMakeNameInput, setNewMakeNameInput] = useState('');
  const [newMakeInitialModel, setNewMakeInitialModel] = useState('');
  const [newMakeStartYear, setNewMakeStartYear] = useState<number | string>(2020);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Vehicle Form Fields
  const [formMake, setFormMake] = useState('Audi');
  const [formCustomMake, setFormCustomMake] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formGeneration, setFormGeneration] = useState('');
  const [formYearStart, setFormYearStart] = useState<number | string>(2020);
  const [formYearEnd, setFormYearEnd] = useState<number | string>('');
  const [formBodyStyles, setFormBodyStyles] = useState<string>('Sedan, Coupe');

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehs, configs] = await Promise.all([getVehicles(), getMarqueConfigs()]);
      setVehicles(vehs);
      setMarqueConfigs(configs);
    } catch (err) {
      console.error('Failed to load vehicles and marques:', err);
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

  // Makes derived from active vehicles list
  const makesList = useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.make))).sort();
  }, [vehicles]);

  // Models grouped by make
  const makesWithModels = useMemo(() => {
    const map = new Map<string, Vehicle[]>();
    for (const v of vehicles) {
      if (!map.has(v.make)) {
        map.set(v.make, []);
      }
      map.get(v.make)!.push(v);
    }
    return Array.from(map.entries())
      .map(([make, models]) => ({
        make,
        count: models.length,
        models,
      }))
      .sort((a, b) => a.make.localeCompare(b.make));
  }, [vehicles]);

  // Set of active makes present in the vehicles database
  const activeMakeSet = useMemo(() => {
    return new Set(vehicles.map((v) => v.make.toLowerCase().trim()));
  }, [vehicles]);

  // Count of active marques on storefront home (strictly existing in active vehicles)
  const featuredHomeMakesCount = useMemo(() => {
    return marqueConfigs.filter(
      (m) => m.featuredOnHome && activeMakeSet.has(m.make.toLowerCase().trim())
    ).length;
  }, [marqueConfigs, activeMakeSet]);

  // Open Vehicle Modal
  const handleOpenAddModal = (presetMake?: string) => {
    setEditingVehicle(null);
    if (presetMake) {
      setFormMake(presetMake);
      setFormCustomMake('');
    } else {
      setFormMake(makesList[0] || 'Audi');
      setFormCustomMake('');
    }
    setFormModel('');
    setFormGeneration('');
    setFormYearStart(2020);
    setFormYearEnd('');
    setFormBodyStyles('Sedan, Coupe');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setFormMake(veh.make);
    setFormCustomMake('');
    setFormModel(veh.model);
    setFormGeneration(veh.generation || '');
    setFormYearStart(veh.yearStart);
    setFormYearEnd(veh.yearEnd !== null ? veh.yearEnd : '');
    setFormBodyStyles(veh.bodyStyles ? veh.bodyStyles.join(', ') : 'Sedan');
    setIsModalOpen(true);
  };

  // Open Make Modals
  const handleOpenRenameMake = (make: string) => {
    setActiveMakeToModify(make);
    setNewMakeNameInput(make);
    setIsRenameMakeModalOpen(true);
  };

  const handleOpenDeleteMake = (make: string) => {
    setActiveMakeToModify(make);
    setIsDeleteMakeModalOpen(true);
  };

  // Open Marque Edit Modal
  const handleOpenEditMarque = (makeName: string) => {
    const existing = marqueConfigs.find(
      (m) => m.make.toLowerCase() === makeName.toLowerCase()
    );
    const fallbackImage = vehicles.find((v) => v.make.toLowerCase() === makeName.toLowerCase() && v.imageUrl)?.imageUrl || '';
    const matchingVehicles = vehicles.filter((v) => v.make.toLowerCase() === makeName.toLowerCase());
    const modelsPreview = matchingVehicles.map((v) => v.model).slice(0, 4).join(', ');

    if (existing) {
      setEditingMarque({ ...existing });
    } else {
      setEditingMarque({
        make: makeName,
        featuredOnHome: true,
        imageUrl: fallbackImage,
        tagline: 'Precision OEM+ Fitment',
        modelsDescription: modelsPreview || `${matchingVehicles.length} Models`,
        logoText: makeName.toUpperCase(),
        displayOrder: marqueConfigs.length + 1,
      });
    }
    setIsMarqueModalOpen(true);
  };

  // Toggle Marque on Homepage
  const handleToggleHomeMarque = async (makeName: string) => {
    const existing = marqueConfigs.find(
      (m) => m.make.toLowerCase() === makeName.toLowerCase()
    );
    const fallbackImage = vehicles.find((v) => v.make.toLowerCase() === makeName.toLowerCase() && v.imageUrl)?.imageUrl || '';
    const matchingVehicles = vehicles.filter((v) => v.make.toLowerCase() === makeName.toLowerCase());
    const modelsPreview = matchingVehicles.map((v) => v.model).slice(0, 4).join(', ');

    const targetConfig: MarqueConfig = existing
      ? { ...existing, featuredOnHome: !existing.featuredOnHome }
      : {
          make: makeName,
          featuredOnHome: true,
          imageUrl: fallbackImage,
          tagline: 'Precision OEM+ Fitment',
          modelsDescription: modelsPreview || `${matchingVehicles.length} Models`,
          logoText: makeName.toUpperCase(),
          displayOrder: marqueConfigs.length + 1,
        };

    try {
      await saveMarqueConfig(targetConfig);
      setMarqueConfigs((prev) => {
        const idx = prev.findIndex((m) => m.make.toLowerCase() === makeName.toLowerCase());
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = targetConfig;
          return updated;
        }
        return [...prev, targetConfig];
      });
      showNotification(
        'success',
        targetConfig.featuredOnHome
          ? `"${makeName}" will now show in Homepage Marque Selection.`
          : `"${makeName}" hidden from Homepage Marque Selection.`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update marque.');
    }
  };

  // Save Vehicle
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMake = formMake === 'Other' ? formCustomMake.trim() : formMake.trim();
    if (!finalMake) {
      showNotification('error', 'Vehicle make is required.');
      return;
    }
    if (!formModel.trim()) {
      showNotification('error', 'Vehicle model name is required.');
      return;
    }

    const yStart = Number(formYearStart);
    if (isNaN(yStart) || yStart < 1950) {
      showNotification('error', 'Valid start year is required.');
      return;
    }

    const yEnd = formYearEnd !== '' ? Number(formYearEnd) : null;
    if (yEnd !== null && yEnd < yStart) {
      showNotification('error', 'End year cannot be earlier than start year.');
      return;
    }

    setSaving(true);
    try {
      const bodyStylesArray = formBodyStyles
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: Partial<Vehicle> = {
        id: editingVehicle?.id,
        make: finalMake,
        model: formModel.trim(),
        generation: formGeneration.trim() || undefined,
        yearStart: yStart,
        yearEnd: yEnd,
        yearRange: yEnd ? `${yStart} - ${yEnd}` : `${yStart} - Present`,
        bodyStyles: bodyStylesArray.length > 0 ? bodyStylesArray : ['Sedan'],
      };

      await saveVehicle(payload);
      await loadData();
      setIsModalOpen(false);
      showNotification('success', `Vehicle "${payload.make} ${payload.model}" saved.`);
    } catch (err: any) {
      console.error('Save vehicle error:', err);
      showNotification('error', err.message || 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Vehicle
  const handleDelete = async (id: string) => {
    try {
      await deleteVehicle(id);
      await loadData();
      setDeleteConfirmId(null);
      showNotification('success', 'Vehicle removed from directory.');
    } catch (err: any) {
      console.error('Delete vehicle error:', err);
      showNotification('error', err.message || 'Failed to delete vehicle.');
    }
  };

  // Add Make
  const handleAddMakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMake = newMakeNameInput.trim();
    if (!cleanMake) {
      showNotification('error', 'Make name is required.');
      return;
    }

    setSaving(true);
    try {
      await addMake(cleanMake, newMakeInitialModel.trim() || 'Base Model', Number(newMakeStartYear) || 2020);
      await loadData();
      setIsAddMakeModalOpen(false);
      setNewMakeNameInput('');
      setNewMakeInitialModel('');
      showNotification('success', `Make "${cleanMake}" added successfully.`);
    } catch (err: any) {
      console.error('Add make error:', err);
      showNotification('error', err.message || 'Failed to add make.');
    } finally {
      setSaving(false);
    }
  };

  // Rename Make
  const handleRenameMakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNewName = newMakeNameInput.trim();
    if (!cleanNewName) {
      showNotification('error', 'New make name is required.');
      return;
    }

    if (cleanNewName.toLowerCase() === activeMakeToModify.toLowerCase()) {
      setIsRenameMakeModalOpen(false);
      return;
    }

    setSaving(true);
    try {
      const updatedCount = await renameMake(activeMakeToModify, cleanNewName);
      await loadData();
      setIsRenameMakeModalOpen(false);
      showNotification(
        'success',
        `Renamed make "${activeMakeToModify}" to "${cleanNewName}". Updated ${updatedCount} vehicle(s).`
      );
    } catch (err: any) {
      console.error('Rename make error:', err);
      showNotification('error', err.message || 'Failed to rename make.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Make
  const handleDeleteMakeSubmit = async () => {
    if (!activeMakeToModify) return;

    setSaving(true);
    try {
      const count = await deleteMake(activeMakeToModify);
      await loadData();
      setIsDeleteMakeModalOpen(false);
      showNotification('success', `Make "${activeMakeToModify}" and ${count} vehicle(s) removed.`);
    } catch (err: any) {
      console.error('Delete make error:', err);
      showNotification('error', err.message || 'Failed to delete make.');
    } finally {
      setSaving(false);
    }
  };

  // Save Marque
  const handleSaveMarqueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarque) return;

    setSaving(true);
    try {
      await saveMarqueConfig(editingMarque);
      await loadData();
      setIsMarqueModalOpen(false);
      setEditingMarque(null);
      showNotification('success', `Marque "${editingMarque.make}" saved successfully.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save marque.');
    } finally {
      setSaving(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedMake !== 'all' && v.make.toLowerCase() !== selectedMake.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.generation && v.generation.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredMakes = makesWithModels.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.make.toLowerCase().includes(q) ||
      item.models.some((m) => m.model.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2 font-headline">
            <Car className="w-5 h-5 text-[#DC2626]" />
            <span>Vehicles & Makes Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage automotive manufacturers, chassis generations, and models powering vehicle compatibility checking
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => {
              setNewMakeNameInput('');
              setNewMakeInitialModel('');
              setNewMakeStartYear(2020);
              setIsAddMakeModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center space-x-1.5"
          >
            <Factory className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Add Make</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#DC2626] hover:bg-red-700 text-white transition-all shadow-sm hover:shadow-md hover:shadow-red-600/25 active:scale-95 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
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

      {/* View Tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center space-x-2 shrink-0 ${
            activeTab === 'vehicles' ? 'text-[#DC2626]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Vehicle Models & Chassis ({vehicles.length})</span>
          {activeTab === 'vehicles' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#DC2626] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('makes')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center space-x-2 shrink-0 ${
            activeTab === 'makes' ? 'text-[#DC2626]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Manufacturers / Makes ({makesList.length})</span>
          {activeTab === 'makes' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#DC2626] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('home-marques')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center space-x-2 shrink-0 ${
            activeTab === 'home-marques' ? 'text-[#DC2626]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#DC2626]" />
          <span>Home Marque Selection ({featuredHomeMakesCount} Active)</span>
          {activeTab === 'home-marques' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#DC2626] rounded-full" />
          )}
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'vehicles'
                ? 'Search vehicle model, make, or generation...'
                : activeTab === 'makes'
                ? 'Search manufacturer or make name...'
                : 'Search marquee or make name...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeTab === 'vehicles' && (
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-slate-500 font-label">Filter Make:</span>
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#DC2626] shadow-sm"
            >
              <option value="all">All Makes ({makesList.length})</option>
              {makesList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: VEHICLES TABLE */}
      {activeTab === 'vehicles' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-slate-600 uppercase tracking-wider font-semibold border-b border-[#E2E8F0] font-label">
                <tr>
                  <th className="px-5 py-3.5">Make</th>
                  <th className="px-5 py-3.5">Model</th>
                  <th className="px-4 py-3.5">Chassis / Gen</th>
                  <th className="px-4 py-3.5">Year Range</th>
                  <th className="px-4 py-3.5">Body Styles</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Loading vehicle directory...
                    </td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No vehicles found matching search.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#0F172A]">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-[#0F172A] font-semibold">
                          {v.make}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#0F172A]">
                        {v.model}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">
                        {v.generation || '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700 font-medium">
                        {v.yearRange || `${v.yearStart} - ${v.yearEnd || 'Present'}`}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {v.bodyStyles?.join(', ') || 'Sedan'}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(v)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-[#E2E8F0]"
                            title="Edit Vehicle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(v.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            title="Delete Vehicle"
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
      )}

      {/* TAB 2: MANUFACTURERS / MAKES GRID */}
      {activeTab === 'makes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Configured Manufacturers: <strong className="text-[#0F172A] font-bold">{filteredMakes.length}</strong>
            </span>
            <span className="text-slate-400">Modifying a make automatically updates all models under it</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMakes.map(({ make, count, models }) => {
              const marqueCfg = marqueConfigs.find((m) => m.make.toLowerCase() === make.toLowerCase());
              const isFeatured = marqueCfg?.featuredOnHome ?? false;
              const marqueImage = marqueCfg?.imageUrl || models.find((m) => m.imageUrl)?.imageUrl || '';

              return (
                <div
                  key={make}
                  className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Make Header with Image / Logo Initial */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {marqueImage ? (
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#E2E8F0] shrink-0 bg-slate-900">
                            <img
                              src={marqueImage}
                              alt={make}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] flex items-center justify-center font-bold text-base font-headline shrink-0">
                            {make.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight truncate">{make}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-bold">
                              {count} {count === 1 ? 'Model' : 'Models'}
                            </span>
                            {isFeatured ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Home Marque</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-medium">
                                Hidden
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* One-click Home Marque Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleHomeMarque(make)}
                        className={`p-1.5 rounded-lg border transition-all text-xs font-semibold ${
                          isFeatured
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title={isFeatured ? 'Click to hide from Homepage Marque Selection' : 'Click to show in Homepage Marque Selection'}
                      >
                        {isFeatured ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Models preview */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {models.slice(0, 5).map((m) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-600 text-[10px] font-medium"
                        >
                          {m.model}
                        </span>
                      ))}
                      {count > 5 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                          +{count - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Make Card Actions */}
                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(make)}
                      className="text-[11px] font-bold text-slate-600 hover:text-[#DC2626] transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Model</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMarque(make)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors flex items-center space-x-1"
                        title="Configure Marque Image & Text for Homepage"
                      >
                        <ImageIcon className="w-3 h-3 text-amber-700" />
                        <span>Marque & Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRenameMake(make)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center space-x-1"
                        title="Rename or Modify Make"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteMake(make)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                        title="Delete Make and Models"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MARQUE SELECTION (HOMEPAGE) */}
      {activeTab === 'home-marques' && (
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-label font-bold uppercase tracking-wider text-red-400">
                <Sparkles className="w-4 h-4" />
                <span>Homepage Marque Selection Manager</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase">
                Customer Marque Selection Showcase
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl font-label">
                Select which luxury vehicle manufacturers are showcased under &quot;Select Your Marque&quot; on the storefront homepage. Customize card cover images, badge text, and display order.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/"
                target="_blank"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center space-x-1.5 backdrop-blur-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview Storefront</span>
              </Link>
            </div>
          </div>

          {/* Filter Sub-nav */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMarqueFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  marqueFilter === 'all'
                    ? 'bg-[#DC2626] text-white shadow-sm'
                    : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Makes ({makesWithModels.length})
              </button>
              <button
                type="button"
                onClick={() => setMarqueFilter('featured')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  marqueFilter === 'featured'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                }`}
              >
                ✨ Shown on Home ({featuredHomeMakesCount})
              </button>
              <button
                type="button"
                onClick={() => setMarqueFilter('hidden')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  marqueFilter === 'hidden'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hidden ({Math.max(0, makesWithModels.length - featuredHomeMakesCount)})
              </button>
            </div>

            <span className="text-xs text-slate-500 font-label">
              Active on Storefront Home: <strong className="text-emerald-600 font-bold">{featuredHomeMakesCount} {featuredHomeMakesCount === 1 ? 'Marque' : 'Marques'}</strong>
            </span>
          </div>

          {/* Marque Showcase Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {makesWithModels
              .filter(({ make }) => {
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase().trim();
                  if (!make.toLowerCase().includes(q)) return false;
                }
                const cfg = marqueConfigs.find((m) => m.make.toLowerCase() === make.toLowerCase());
                const isFeatured = cfg?.featuredOnHome ?? false;
                if (marqueFilter === 'featured') return isFeatured;
                if (marqueFilter === 'hidden') return !isFeatured;
                return true;
              })
              .map(({ make, count, models }) => {
                const cfg = marqueConfigs.find((m) => m.make.toLowerCase() === make.toLowerCase());
                const isFeatured = cfg?.featuredOnHome ?? false;
                const coverImage =
                  cfg?.imageUrl ||
                  models.find((m) => m.imageUrl)?.imageUrl ||
                  'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop';
                const logoText = cfg?.logoText || make.toUpperCase();
                const modelsDesc = cfg?.modelsDescription || `${count} Models Available`;

                return (
                  <div
                    key={make}
                    className={`rounded-2xl sm:rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md ${
                      isFeatured ? 'border-red-400/80 bg-white ring-2 ring-red-500/10' : 'border-[#E2E8F0] bg-white opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Visual Card Preview mimicking Home Marque */}
                    <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-900 p-4 flex flex-col justify-end text-white group">
                      {coverImage ? (
                        <>
                          <img
                            src={coverImage}
                            alt={make}
                            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75] contrast-105 group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-white/30" />
                        </div>
                      )}

                      {/* Preview Top Row */}
                      <div className="absolute top-4 inset-x-4 z-10 flex items-center justify-between">
                        <span className="text-[10px] font-label font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                          {logoText}
                        </span>
                        <span className="text-[10px] text-slate-300 font-label font-medium">
                          {count} Models
                        </span>
                      </div>

                      {/* Preview Bottom Row */}
                      <div className="relative z-10 space-y-0.5">
                        <h4 className="text-lg font-black uppercase tracking-tight text-white">
                          {make}
                        </h4>
                        <p className="text-[11px] text-slate-200 line-clamp-1 font-label">
                          {modelsDesc}
                        </p>
                      </div>
                    </div>

                    {/* Card Management Controls */}
                    <div className="p-4 space-y-3 bg-white">
                      {/* Homepage Toggle Control */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isFeatured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <span className="text-xs font-bold text-slate-800">
                            {isFeatured ? 'Shown on Homepage' : 'Hidden from Homepage'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleHomeMarque(make)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                            isFeatured
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isFeatured ? 'Active' : 'Enable'}
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMarque(make)}
                          className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0] hover:border-slate-300 transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#DC2626]" />
                          <span>Change Image & Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW MAKE */}
      {isAddMakeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Factory className="w-4 h-4 text-[#DC2626]" />
                <span>Add Vehicle Manufacturer / Make</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMakeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMakeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Manufacturer Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aston Martin, Ferrari, Tesla"
                  value={newMakeNameInput}
                  onChange={(e) => setNewMakeNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Initial Model</label>
                <input
                  type="text"
                  placeholder="e.g. Vantage, 488 GTB, Model S"
                  value={newMakeInitialModel}
                  onChange={(e) => setNewMakeInitialModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Start Year</label>
                <input
                  type="number"
                  min="1950"
                  max="2030"
                  value={newMakeStartYear}
                  onChange={(e) => setNewMakeStartYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddMakeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#DC2626] hover:bg-red-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Make'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RENAME MAKE */}
      {isRenameMakeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#DC2626]" />
                <span>Rename / Modify Make</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRenameMakeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameMakeSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Current Make: <strong className="text-[#0F172A] font-bold">{activeMakeToModify}</strong>
                <p className="mt-1 text-[11px] text-slate-500">
                  Renaming this make will automatically propagate across all associated vehicles and product compatibility tags.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">New Make Name</label>
                <input
                  type="text"
                  required
                  value={newMakeNameInput}
                  onChange={(e) => setNewMakeNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsRenameMakeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#DC2626] hover:bg-red-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE MAKE */}
      {isDeleteMakeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#0F172A]">Delete Manufacturer</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete manufacturer <strong className="text-[#0F172A]">{activeMakeToModify}</strong>? All vehicles registered under this make will be removed from the catalog.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteMakeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteMakeSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#DC2626] hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Make & Models'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE VEHICLE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#0F172A]">Confirm Vehicle Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this vehicle from the directory? Products specifically mapped to it will retain their compatibility record.
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
                Delete Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT VEHICLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 font-headline">
                <Car className="w-4 h-4 text-[#DC2626]" />
                <span>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</span>
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
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Manufacturer / Make <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={formMake}
                  onChange={(e) => setFormMake(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                >
                  {makesList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {POPULAR_MAKES.filter((m) => !makesList.includes(m)).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="Other">+ Add Custom Make</option>
                </select>

                {formMake === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom make name (e.g. McLaren)"
                    value={formCustomMake}
                    onChange={(e) => setFormCustomMake(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626]"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Model Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M3 Competition"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Generation / Chassis</label>
                  <input
                    type="text"
                    placeholder="e.g. G80 / G81"
                    value={formGeneration}
                    onChange={(e) => setFormGeneration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono placeholder-slate-400 focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Production Start Year <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1960"
                    max="2030"
                    required
                    value={formYearStart}
                    onChange={(e) => setFormYearStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">End Year (or Present)</label>
                  <input
                    type="number"
                    min="1960"
                    max="2035"
                    placeholder="Leave empty for Present"
                    value={formYearEnd}
                    onChange={(e) => setFormYearEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Body Styles (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Sedan, Touring, Coupe"
                  value={formBodyStyles}
                  onChange={(e) => setFormBodyStyles(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626]"
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
                  {saving ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT MARQUE & IMAGE FOR HOMEPAGE */}
      {isMarqueModalOpen && editingMarque && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#DC2626]" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  Configure Marque: <span className="text-[#DC2626]">{editingMarque.make}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMarqueModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarqueSubmit} className="space-y-4">
              {/* Toggle Show in Homepage Marque Selection */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-[#E2E8F0]">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Show in Homepage &quot;Marque Selection&quot;</h4>
                  <p className="text-[11px] text-slate-500 font-label">
                    When enabled, this make appears on the storefront homepage under &quot;Select Your Marque&quot;
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editingMarque.featuredOnHome}
                  onChange={(e) =>
                    setEditingMarque({ ...editingMarque, featuredOnHome: e.target.checked })
                  }
                  className="w-5 h-5 text-[#DC2626] rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
              </div>

              {/* Cover Image Upload (Cloudflare R2 or direct URL) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                  <span>Marque Cover Photo</span>
                  <span className="text-[10px] text-slate-400 font-normal">Cloudflare R2 / CDN URL</span>
                </label>
                <ImageUploader
                  label="Upload Marque Card Cover"
                  folder="marques"
                  value={editingMarque.imageUrl}
                  onChange={(url) => setEditingMarque({ ...editingMarque, imageUrl: url })}
                />
                <input
                  type="url"
                  placeholder="Or paste direct image URL (e.g. https://...)"
                  value={editingMarque.imageUrl}
                  onChange={(e) => setEditingMarque({ ...editingMarque, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626] font-mono text-[11px]"
                />

                {/* Quick Pick from existing vehicles for this make */}
                {vehicles.filter((v) => v.make.toLowerCase() === editingMarque.make.toLowerCase() && v.imageUrl).length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-slate-500 font-label mb-1">Pick from vehicle images in directory:</p>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {vehicles
                        .filter((v) => v.make.toLowerCase() === editingMarque.make.toLowerCase() && v.imageUrl)
                        .map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setEditingMarque({ ...editingMarque, imageUrl: v.imageUrl || '' })}
                            className={`relative w-16 h-12 rounded-lg overflow-hidden border shrink-0 transition-all ${
                              editingMarque.imageUrl === v.imageUrl ? 'border-red-500 ring-2 ring-red-400' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                            title={`Use ${v.model} image`}
                          >
                            <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" />
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Logo Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. BMW //M, AUDI, PORSCHE"
                    value={editingMarque.logoText || ''}
                    onChange={(e) => setEditingMarque({ ...editingMarque, logoText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Display Priority Order</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={editingMarque.displayOrder || 1}
                    onChange={(e) => setEditingMarque({ ...editingMarque, displayOrder: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Highlighted Models / Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. A4 B9, A6 C8, Q5 FY, Q7 4M"
                  value={editingMarque.modelsDescription || ''}
                  onChange={(e) => setEditingMarque({ ...editingMarque, modelsDescription: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Brand Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. The Ultimate Driving Machine Autoclave Carbon Fiber Aerodynamics"
                  value={editingMarque.tagline || ''}
                  onChange={(e) => setEditingMarque({ ...editingMarque, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              {/* Interactive Live Preview */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">Storefront Homepage Card Preview</label>
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 p-4 h-36 flex flex-col justify-end text-white border border-[#E2E8F0] shadow-sm">
                  {editingMarque.imageUrl && (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <img
                        src={editingMarque.imageUrl}
                        alt={editingMarque.make}
                        className="w-full h-full object-cover filter brightness-[0.75] contrast-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
                    </div>
                  )}
                  <div className="relative z-10 space-y-1">
                    <span className="text-[9px] font-label uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold">
                      {editingMarque.logoText || editingMarque.make.toUpperCase()}
                    </span>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">
                      {editingMarque.make}
                    </h4>
                    <p className="text-[10px] text-slate-200 line-clamp-1 font-label">
                      {editingMarque.modelsDescription || `${vehicles.filter((v) => v.make === editingMarque.make).length} Models`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsMarqueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#DC2626] hover:bg-red-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Marque Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}