'use client';

import React from 'react';
import Link from '@/lib/compat-link';
import { categories } from '@/lib/products-data';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

export default function CategoryGrid() {
  const { language } = useAppStore();
  const { t } = useTranslation(language);

  const getCategoryName = (cat: typeof categories[0]) => {
    if (language === 'en') return cat.name_en;
    if (language === 'es') return cat.name_es;
    return cat.name_fr;
  };

  return (
    <section className="section" style={{ padding: '60px 0', background: '#fafafa' }}>
      <div className="container">
        <div className="section-header section-header-center" style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(20px, 5.2vw, 28px)', fontWeight: 900, letterSpacing: '-0.6px', color: '#111111', margin: 0 }}>
            {t('home.categoriesTitle')}
          </h2>
          <p style={{ fontSize: '13px', color: '#666666', marginTop: '4px' }}>
            {t('common.allCategories')}
          </p>
        </div>
        <div className="category-grid-luxury">
          {categories.map(cat => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`} className="category-card-luxury">
              <div 
                className="category-card-bg"
                style={{ backgroundImage: `url('${cat.icon}')` }}
              />
              <div className="category-card-overlay" />
              <div className="category-card-content">
                <span className="category-card-tag">RAYON EXCLUSIF</span>
                <h3 className="category-card-title">{getCategoryName(cat)}</h3>
                <span className="category-card-cta">
                  <span>Découvrir la collection</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
