import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart — Kravion Auto',
  description:
    'Review your selected luxury automotive components and proceed to verified vehicle fitment checkout.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
