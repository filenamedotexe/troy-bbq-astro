import React from 'react';
import type { ReactNode } from 'react';
import { CartProvider } from '../../contexts/CartContext';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}