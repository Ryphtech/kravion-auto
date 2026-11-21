'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useGarage } from '@/context/GarageContext';
import { getVehicles } from '@/lib/data-service';
import { initialVehicles } from '@/lib/seed-data';
import { Vehicle } from '@/types';
import { X, Car, CheckCircle2, Trash2, ShieldCheck, Sparkles } from 'lucide-react';

export function GarageModal() {
  const {
    selectedVehicle,
    isGarageModalOpen,
    closeGarageModal,
    selectVehicle,
    clearVehicle,
  } = useGarage();

  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [candidateVehicle, setCandidateVehicle] = useState<Vehicle | null>(null);

  // Fetch live vehicles or fallback to seed data
  useEffect(() => {
    let mounted = true;
    getVehicles()
      .then((data) => {
        if (mounted && data && data.length > 0) {
          setVehicles(data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch vehicles for GarageModal:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync internal candidate with selectedVehicle if open and nothing chosen yet
  useEffect(() => {
    if (isGarageModalOpen) {
      if (selectedVehicle) {
        setSelectedMake(selectedVehicle.make);
        setSelectedModel(selectedVehicle.model);
        const defaultYear = selectedVehicle.yearStart.toString();
        setSelectedYear(defaultYear);
        setCandidateVehicle(selectedVehicle);
      } else {
        setSelectedMake('');
        setSelectedModel('');
        setSelectedYear('');
        setCandidateVehicle(null);
      }
    }
  }, [isGarageModalOpen, selectedVehicle]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGarageModalOpen) {
        closeGarageModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGarageModalOpen, closeGarageModal]);

  // Derived unique makes
  const makes = useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.make))).sort();
  }, [vehicles]);

  // Derived models for chosen make
  const models = useMemo(() => {
    if (!selectedMake) return [];
    return Array.from(
      new Set(
        vehicles
          .filter((v) => v.make.toLowerCase() === selectedMake.toLowerCase())
          .map((v) => v.model)
      )
    ).sort();
  }, [vehicles, selectedMake]);

  // Derived years for chosen make & model
  const matchingVehicle = useMemo(() => {
    if (!selectedMake || !selectedModel) return null;
    return (
      vehicles.find(
        (v) =>
          v.make.toLowerCase() === selectedMake.toLowerCase() &&
          v.model.toLowerCase() === selectedModel.toLowerCase()
      ) || null
    );
  }, [vehicles, selectedMake, selectedModel]);

  const years = useMemo(() => {
    if (!matchingVehicle) return [];
    const start = matchingVehicle.yearStart;
    const end = matchingVehicle.yearEnd || new Date().getFullYear();
    const result: number[] = [];
    for (let y = end; y >= start; y--) {
      result.push(y);
    }
    return result;
  }, [matchingVehicle]);

  // Update candidate vehicle whenever selection changes
  useEffect(() => {
    if (matchingVehicle) {
      setCandidateVehicle(matchingVehicle);
    } else {
      setCandidateVehicle(null);
    }
  }, [matchingVehicle]);

  if (!isGarageModalOpen) return null;

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel('');
    setSelectedYear('');
    setCandidateVehicle(null);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setSelectedYear('');
    const v = vehicles.find(
      (item) =>
        item.make.toLowerCase() === selectedMake.toLowerCase() &&
        item.model.toLowerCase() === model.toLowerCase()
    );
    if (v) {
      setCandidateVehicle(v);
      setSelectedYear(v.yearStart.toString());
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const handleConfirmVehicle = () => {
    if (candidateVehicle) {
      selectVehicle(candidateVehicle);
      closeGarageModal();
    }
  };

  const handleClear = () => {
    clearVehicle();
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setCandidateVehicle(null);
    closeGarageModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="garage-modal-title"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0"
        onClick={closeGarageModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-[#E2E8F0] bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-red-50 border border-red-100 text-[#DC2626]">
              <Car className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <h2
                id="garage-modal-title"
                className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight flex items-center gap-1.5 sm:gap-2"
              >
                My Garage
                <span className="text-[9px] sm:text-[10px] uppercase font-label font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#DC2626] border border-red-200">
                  Precision Fitment
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-label">
                Select your vehicle to filter 100% compatible accessories & parts.
              </p>
            </div>
          </div>
          <button
            onClick={closeGarageModal}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close Garage Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Vehicle Banner if already selected */}
        {selectedVehicle && (
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-50 border-b border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-emerald-800">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="truncate">
                Active in Garage:{' '}
                <strong className="text-emerald-900 font-bold">
                  {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.generation || selectedVehicle.yearRange})
                </strong>
              </span>
            </div>
            <button
              onClick={handleClear}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center space-x-1 transition-colors font-medium shrink-0 ml-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Step Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Make */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                1. Make
              </label>
              <select
                value={selectedMake}
                onChange={(e) => handleMakeChange(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
              >
                <option value="">Select Make</option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                2. Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!selectedMake}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                <option value="">
                  {selectedMake ? 'Select Model' : 'Choose Make First'}
                </option>
                {models.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label">
                3. Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={!selectedModel}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                <option value="">
                  {selectedModel ? 'Select Year' : 'Choose Model First'}
                </option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Details Preview Card */}
          {candidateVehicle ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-[#E2E8F0] space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {candidateVehicle.imageUrl && (
                  <div className="relative w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shrink-0">
                    <Image
                      src={candidateVehicle.imageUrl}
                      alt={`${candidateVehicle.make} ${candidateVehicle.model}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#0F172A]">
                      {candidateVehicle.make} {candidateVehicle.model}
                    </span>
                    {candidateVehicle.generation && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white text-[#DC2626] font-bold border border-red-200">
                        {candidateVehicle.generation}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Production Range:{' '}
                    <span className="text-slate-900 font-bold">
                      {candidateVehicle.yearRange ||
                        `${candidateVehicle.yearStart} - ${candidateVehicle.yearEnd || 'Present'}`}
                    </span>
                  </p>
                  {candidateVehicle.bodyStyles && (
                    <p className="text-[11px] text-slate-500 font-label">
                      Body Styles: {candidateVehicle.bodyStyles.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 pt-3 border-t border-[#E2E8F0]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">
                  Guaranteed fitment filtering active for OEM+ upgrades on this platform.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-[#DC2626] mx-auto opacity-70" />
              <p className="text-xs text-slate-500 font-label max-w-sm mx-auto">
                Pick a Make and Model above to view supported vehicle specifications and lock in compatibility.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-slate-50/60 flex items-center justify-between">
          {selectedVehicle ? (
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-slate-100 transition-colors"
            >
              Clear Vehicle
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={closeGarageModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmVehicle}
              disabled={!candidateVehicle}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#DC2626] hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md shadow-red-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Set as My Vehicle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
