import React, { useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function CheckoutPage() {
  useEffect(() => {
    router.visit('/cart');
  }, []);

  return null;
}
