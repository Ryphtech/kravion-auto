import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Products & Upgrades — Kravion Auto',
  description:
    'Explore verified luxury automotive upgrades, aerodynamics, ambient lighting, high-fidelity audio, and precision performance components with guaranteed vehicle fitment for Audi, BMW, Mercedes-Benz, Porsche, and more.',
  keywords: [
    'luxury automotive parts',
    'car upgrades India',
    'Audi styling parts',
    'BMW carbon fiber',
    'Mercedes-Benz interior ambient lighting',
    'Porsche aerodynamic kits',
    'performance car parts',
  ],
  openGraph: {
    title: 'All Products & Upgrades — Kravion Auto',
    description:
      'Explore verified luxury automotive upgrades, aerodynamics, ambient lighting, high-fidelity audio, and precision performance components with guaranteed vehicle fitment.',
    type: 'website',
    url: '/products',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Products & Upgrades — Kravion Auto',
    description:
      'Explore verified luxury automotive upgrades, aerodynamics, ambient lighting, and performance components.',
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
