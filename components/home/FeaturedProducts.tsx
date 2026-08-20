'use client';

import React from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

export default function FeaturedProducts() {
  const { language, products } = useAppStore();
  const { t } = useTranslation(language);
  const featured = products.filter(p => p.isFeatured).slice(0, 8);

  if (featured.length === 0) return null;

  const getProductName = (p: typeof featured[0]) => {
    if (language === 'en') return p.name_en;
    if (language === 'es') return p.name_es;
    return p.name_fr;
  };

  return (
    <section className="section" style={{backgroundColor:'var(--color-white)'}}>
      <div className="container">
        <div className="section-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px'}}>
          <h2 style={{fontSize:'28px',fontWeight:700}}>{t('home.featuredTitle')}</h2>
          <Link href="/products" className="btn btn-secondary" style={{fontSize:'14px'}}>{t('common.viewAll')} →</Link>
        </div>
        <div className="grid-4">
          {featured.map(p => (
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
