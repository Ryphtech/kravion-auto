'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Vehicle } from '@/types';

export const GARAGE_STORAGE_KEY = 'kravion_selected_vehicle';

export interface GarageContextType {
  selectedVehicle: Vehicle | null;
  isHydrated: boolean;
  selectVehicle: (vehicle: Vehicle) => void;
  clearVehicle: () => void;
  isGarageModalOpen: boolean;
  openGarageModal: () => void;
  closeGarageModal: () => void;
}

const GarageContext = createContext<GarageContextType | undefined>(undefined);

export function GarageProvider({ children }: { children: ReactNode }) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isGarageModalOpen, setIsGarageModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // SSR-safe hydration from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(GARAGE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && parsed.id && parsed.make) {
            setSelectedVehicle(parsed as Vehicle);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to hydrate selected vehicle from localStorage:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const selectVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(vehicle));
      }
    } catch (err) {
      console.warn('Failed to save selected vehicle to localStorage:', err);
    }
  }, []);

  const clearVehicle = useCallback(() => {
    setSelectedVehicle(null);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(GARAGE_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to remove selected vehicle from localStorage:', err);
    }
  }, []);

  const openGarageModal = useCallback(() => {
    setIsGarageModalOpen(true);
  }, []);

  const closeGarageModal = useCallback(() => {
    setIsGarageModalOpen(false);
  }, []);

  return (
    <GarageContext.Provider
      value={{
        selectedVehicle,
        isHydrated,
        selectVehicle,
        clearVehicle,
        isGarageModalOpen,
        openGarageModal,
        closeGarageModal,
      }}
    >
      {children}
    </GarageContext.Provider>
  );
}

export function useGarage(): GarageContextType {
  const context = useContext(GarageContext);
  if (!context) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
}
