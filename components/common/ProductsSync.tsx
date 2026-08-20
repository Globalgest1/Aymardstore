'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function ProductsSync() {
  const { setProducts, products } = useAppStore();

  useEffect(() => {
    async function syncProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products)) {
            // Update store with the latest server products if store is out of sync
            if (products.length !== data.products.length) {
              setProducts(data.products);
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync products with server:', err);
      }
    }

    syncProducts();
  }, [products.length, setProducts]);

  return null;
}
