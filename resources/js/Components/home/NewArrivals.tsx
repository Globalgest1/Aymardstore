'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

export default function NewArrivals() {
  const { language, products } = useAppStore();
  const { t } = useTranslation(language);
  const newProducts = products.filter(p => p.isNew).slice(0, 8);

  if (newProducts.length === 0) return null;

  const getProductName = (p: typeof newProducts[0]) => {
    if (language === 'en') return p.name_en;
    if (language === 'es') return p.name_es;
    return p.name_fr;
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-header section-header-center">
          <h2>{t('home.newArrivalsTitle')}</h2>
          <p>{t('common.newArrivals')}</p>
        </div>
        <div className="grid-4">
          {newProducts.map(p => (
            <ProductCard 
              key={p.id} 
              id={p.id} 
              name={getProductName(p)} 
              slug={p.slug} 
              price={p.price} 
              comparePrice={p.comparePrice} 
              image={p.images[0]} 
              rating={p.rating} 
              reviewCount={p.reviewCount} 
              badge={p.badge} 
              stock={p.stock} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
