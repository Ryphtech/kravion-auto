import React, { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GarageModal } from '@/components/layout/GarageModal';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <GarageModal />
      <MobileBottomNav />
    </div>
  );
}