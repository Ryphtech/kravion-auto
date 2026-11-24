import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Saved Garage Wishlist — Kravion Auto',
  description:
    'Manage your saved vehicle upgrades, carbon fiber aerodynamics, and curated performance modifications.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
