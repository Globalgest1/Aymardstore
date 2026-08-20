'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { products } from '@/lib/products-data';
import ProductCard from '@/components/home/ProductCard';
import Link from 'next/link';

export default function FavoritesPage() {
  const { language, favorites } = useAppStore();
  const { t } = useTranslation(language);

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="container section" style={{ minHeight: '80vh', padding: '40px 16px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>{t('common.favorites')}</h1>

      {favoriteProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '64px' }}>❤️</span>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginTop: '24px' }}>Vos favoris sont vides</h2>
          <p style={{ color: 'var(--color-text-medium)', marginTop: '8px', marginBottom: '24px' }}>
            Marquez les produits qui vous plaisent d'un cœur pour les retrouver ici facilement.
          </p>
          <Link href="/products" className="btn btn-primary">
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        <div className="grid-4">
          {favoriteProducts.map(p => (
            <ProductCard 
              key={p.id}
              id={p.id}
              name={language === 'en' ? p.name_en : language === 'es' ? p.name_es : p.name_fr}
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
      )}
    </div>
  );
}
