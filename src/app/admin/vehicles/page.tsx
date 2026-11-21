'use client';

import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';
import {
  getVehicles,
  saveVehicle,
  deleteVehicle,
} from '@/lib/data-service';
import { Vehicle } from '@/types';

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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
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
      const vehs = await getVehicles();
      setVehicles(vehs);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
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

  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setFormMake('Audi');
    setFormCustomMake('');
    setFormModel('');
    setFormGeneration('');
    setFormYearStart(2020);
    setFormYearEnd('');
    setFormBodyStyles('Sedan, Coupe');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    if (POPULAR_MAKES.includes(veh.make)) {
      setFormMake(veh.make);
      setFormCustomMake('');
    } else {
      setFormMake('Other');
      setFormCustomMake(veh.make);
    }
    setFormModel(veh.model);
    setFormGeneration(veh.generation || '');
    setFormYearStart(veh.yearStart);
    setFormYearEnd(veh.yearEnd !== null ? veh.yearEnd : '');
    setFormBodyStyles(veh.bodyStyles ? veh.bodyStyles.join(', ') : 'Sedan');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMake = formMake === 'Other' ? formCustomMake.trim() : formMake;
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

  const makesList = Array.from(new Set(vehicles.map((v) => v.make))).sort();

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center gap-2 font-headline">
            <Car className="w-5 h-5 text-[#DC2626]" />
            <span>Vehicle Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chassis and generation database powering precision vehicle compatibility checking
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase bg-[#DC2626] hover:bg-red-700 text-white shadow-subtle transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by make, model, or chassis generation (e.g. G80, W206, 992)..."
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
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-slate-700 focus:outline-none focus:border-[#DC2626]"
          >
            <option value="all">All Makes ({makesList.length})</option>
            {makesList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
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

      {/* Delete Confirmation Modal */}
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

      {/* Add / Edit Vehicle Modal */}
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
                  {POPULAR_MAKES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="Other">Other (Custom Make)</option>
                </select>

                {formMake === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom make (e.g. McLaren)"
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
    </div>
  );
}