'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { GarageProvider } from '@/context/GarageContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GarageProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CartProvider>
      </GarageProvider>
    </AuthProvider>
  );
}
