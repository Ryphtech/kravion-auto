import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Orders & Enquiries — Kravion Auto',
  description:
    'View and track your bespoke automotive upgrade enquiries, fitment confirmations, and concierge WhatsApp updates.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
