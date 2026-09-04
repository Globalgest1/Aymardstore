'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

const medals = ['🏆', '🥈', '🥉'];

export default function TopRanking() {
  const { language, products } = useAppStore();
  const { t } = useTranslation(language);
  const topProducts = [...products].sort((a, b) => b.rating - a.rating).slice(0, 3);

  if (topProducts.length === 0) return null;

  const getProductName = (p: typeof topProducts[0]) => {
    if (language === 'en') return p.name_en;
    if (language === 'es') return p.name_es;
    return p.name_fr;
  };

  return (
    <section className="section" style={{backgroundColor:'var(--color-neutral-100)'}}>
      <div className="container">
        <div className="section-header section-header-center">
          <h2>{t('home.topRankingTitle')}</h2>
          <p>{t('common.bestSellers')}</p>
        </div>
        <div className="grid-3" style={{maxWidth:'1000px',margin:'0 auto'}}>
          {topProducts.map((p, i) => (
            <div key={p.id} style={{position:'relative'}}>
              <span style={{position:'absolute',top:'-10px',left:'-10px',fontSize:'32px',zIndex:2}}>{medals[i]}</span>
              <ProductCard 
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
