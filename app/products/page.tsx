'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppStore, getProductPrice, getActiveLocation, formatAmount } from '@/lib/store';
import { products as defaultProducts } from '@/lib/products-data';
import { useTranslation } from '@/lib/i18n';
import ProductCard from '@/components/home/ProductCard';
import Link from 'next/link';
import Image from 'next/image';

// Visual Category Tabs with high quality thumbnails
const visualCategoryTabs = [
  { id: 'shoes', label: 'Sneakers & Kicks', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=200&auto=format&fit=crop' },
  { id: 'clothing', label: 'Streetwear & Vêtements', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&auto=format&fit=crop' },
  { id: 'bags', label: 'Sacs & Maroquinerie', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=200&auto=format&fit=crop' },
  { id: 'jewelry', label: 'Bijoux & Joaillerie', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=200&auto=format&fit=crop' },
  { id: 'watches', label: 'Montres & Horlogerie', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=200&auto=format&fit=crop' },
  { id: 'accessories', label: 'Accessoires Mode', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=200&auto=format&fit=crop' },
  { id: 'hats', label: 'Casquettes & Chapeaux', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=200&auto=format&fit=crop' },
  { id: 'socks', label: 'Chaussettes & Packs', image: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?q=80&w=200&auto=format&fit=crop' },
  { id: 'necklaces', label: 'Colliers & Chaînes', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, currency, products: storeProducts, setProducts, detectedLocationId, locations } = useAppStore();
  const products = (storeProducts && storeProducts.length > 0) ? storeProducts : defaultProducts;
  const { t } = useTranslation(language);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeLoc = getActiveLocation(detectedLocationId);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    async function syncProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    syncProducts();
  }, [setProducts]);

  const activeVisualCategoryTabs = useMemo(() => {
    return visualCategoryTabs.filter(tab => products.some(p => p.category === tab.id));
  }, [products]);

  // Read URL query params
  const categoryParam = searchParams.get('category') || '';
  const filterParam = searchParams.get('filter') || '';
  const searchParam = searchParams.get('search') || '';

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedFilter, setSelectedFilter] = useState(filterParam);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [sortBy, setSortBy] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedFilter) count++;
    if (searchQuery.trim()) count++;
    if (onlyInStock) count++;
    return count;
  }, [selectedCategory, selectedFilter, searchQuery, onlyInStock]);

  // Pagination state: 16 items per page
  const PAGE_SIZE = 16;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Sync state with URL params
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setSelectedFilter(filterParam);
  }, [filterParam]);

  useEffect(() => {
    setSearchQuery(searchParam);
  }, [searchParam]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedFilter, searchQuery, sortBy, onlyInStock]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Category Filter
        if (selectedCategory && p.category !== selectedCategory) return false;
        
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = (p[`name_${language}` as keyof typeof p] as string || p.name_fr).toLowerCase();
          const desc = (p[`description_${language}` as keyof typeof p] as string || p.description_fr).toLowerCase();
          const brand = (p.brand || '').toLowerCase();
          if (!name.includes(q) && !desc.includes(q) && !brand.includes(q)) return false;
        }

        // Specials (Deals / New)
        if (selectedFilter === 'deals' && !p.comparePrice) return false;
        if (selectedFilter === 'new' && !p.isNew && p.badge !== 'new' && p.badge !== 'NEW') return false;

        // Stock Filter
        if (onlyInStock && p.stock <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        const pInfoA = getProductPrice(a, detectedLocationId);
        const pInfoB = getProductPrice(b, detectedLocationId);
        if (sortBy === 'price-asc') return pInfoA.price - pInfoB.price;
        if (sortBy === 'price-desc') return pInfoB.price - pInfoA.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [selectedCategory, selectedFilter, searchQuery, sortBy, onlyInStock, language, products, detectedLocationId]);

  // Sliced paginated view
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const getProductName = (p: typeof products[0]) => {
    if (language === 'en') return p.name_en;
    if (language === 'es') return p.name_es;
    return p.name_fr;
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('');
    setSelectedFilter('');
    setSearchQuery('');
    setOnlyInStock(false);
    setSortBy('featured');
    router.push('/products');
  };

  return (
    <div style={{ minHeight: '90vh', background: '#f8fafc', paddingBottom: '80px' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
        color: '#ffffff',
        padding: '40px 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#38bdf8', textTransform: 'uppercase' }}>CATALOGUE OFFICIEL</span>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', margin: '8px 0 10px 0', letterSpacing: '-0.6px' }}>
              Collection Aymard Store
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Découvrez l&apos;intégralité de nos sneakers rares, pièces streetwear, maroquinerie et joaillerie.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Category Tabs (Smooth, Unified Horizontal Scroll Strip) */}
      <div 
        style={{ 
          background: '#ffffff', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '12px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          position: 'sticky',
          top: '0px',
          zIndex: 40
        }}
      >
        <div className="container">
          <div 
            ref={scrollRef}
            className="no-scrollbar"
            style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center', 
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              padding: '4px 0',
              width: '100%'
            }}
          >
            {/* 'Tout le Catalogue' Pill */}
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '30px',
                border: selectedCategory === '' ? '2px solid #09090b' : '1px solid #cbd5e1',
                background: selectedCategory === '' ? '#09090b' : '#ffffff',
                color: selectedCategory === '' ? '#ffffff' : '#0f172a',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedCategory === '' ? '0 4px 12px rgba(0,0,0,0.18)' : 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Image 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=200&auto=format&fit=crop" 
                alt="Tout le Catalogue" 
                width={20}
                height={20}
                style={{ borderRadius: '50%', objectFit: 'cover' }} 
              />
              <span>Tout le Catalogue</span>
            </button>

            {/* Other Categories */}
            {activeVisualCategoryTabs.map(tab => {
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '30px',
                    border: isSelected ? '2px solid #09090b' : '1px solid #e2e8f0',
                    background: isSelected ? '#09090b' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#0f172a',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Image 
                    src={tab.image} 
                    alt={tab.label} 
                    width={20}
                    height={20}
                    style={{ borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="container" style={{ marginTop: '32px' }}>
        
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }} className="products-layout-wrapper">
          
          {/* Left Sidebar Filters (Desktop Only) */}
          <aside className="products-sidebar-desktop">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#09090b', margin: 0 }}>Filtres</h3>
              {activeFiltersCount > 0 && (
                <button 
                  onClick={handleClearAllFilters}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                Sélections Spéciales
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setSelectedFilter(selectedFilter === 'new' ? '' : 'new')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: selectedFilter === 'new' ? '#f1f5f9' : 'transparent',
                    color: selectedFilter === 'new' ? '#09090b' : '#475569',
                    fontWeight: selectedFilter === 'new' ? 800 : 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>Nouveaux Drops</span>
                  <span style={{ fontSize: '10px', background: '#09090b', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>NEW</span>
                </button>

                <button
                  onClick={() => setSelectedFilter(selectedFilter === 'deals' ? '' : 'deals')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: selectedFilter === 'deals' ? '#f1f5f9' : 'transparent',
                    color: selectedFilter === 'deals' ? '#09090b' : '#475569',
                    fontWeight: selectedFilter === 'deals' ? 800 : 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>Offres & Promotions</span>
                  <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>PROMO</span>
                </button>
              </div>
            </div>

            {/* In Stock toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="stockCheck" 
                checked={onlyInStock} 
                onChange={e => setOnlyInStock(e.target.checked)} 
                style={{ accentColor: '#09090b', cursor: 'pointer' }}
              />
              <label htmlFor="stockCheck" style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                Uniquement en stock
              </label>
            </div>

          </aside>

          {/* Right Products Content */}
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            
            {/* Top Toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '2px 4px'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                <strong>{filteredProducts.length}</strong> article{filteredProducts.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Active filter badges */}
            {(selectedCategory || selectedFilter || searchQuery || onlyInStock) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Filtres :</span>
                {selectedCategory && (
                  <span onClick={() => setSelectedCategory('')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#09090b', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '16px', cursor: 'pointer' }}>
                    Catégorie: {selectedCategory} ✕
                  </span>
                )}
                {selectedFilter && (
                  <span onClick={() => setSelectedFilter('')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#09090b', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '16px', cursor: 'pointer' }}>
                    {selectedFilter === 'new' ? 'Nouveautés' : 'Promos'} ✕
                  </span>
                )}
                {searchQuery && (
                  <span onClick={() => setSearchQuery('')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#09090b', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '16px', cursor: 'pointer' }}>
                    &quot;{searchQuery}&quot; ✕
                  </span>
                )}
                {onlyInStock && (
                  <span onClick={() => setOnlyInStock(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#09090b', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '16px', cursor: 'pointer' }}>
                    En stock ✕
                  </span>
                )}
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#64748b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#09090b', margin: '0 0 6px 0' }}>Aucun produit ne correspond à vos filtres</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Essayez d&apos;élargir vos critères ou de réinitialiser la recherche.</p>
                <button onClick={handleClearAllFilters} style={{ padding: '10px 22px', background: '#09090b', color: '#ffffff', border: 'none', borderRadius: '25px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  Tout réinitialiser
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid-catalog">
                  {paginatedProducts.map(p => (
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

                {/* Progressive Pagination CTA */}
                {visibleCount < filteredProducts.length && (
                  <div style={{ textAlign: 'center', marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                      style={{
                        background: '#09090b',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '30px',
                        padding: '14px 36px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>Voir plus d&apos;articles</span>
                      <span style={{ fontSize: '11px', opacity: 0.85 }}>({Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)} restants)</span>
                    </button>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      Affichage de <strong>{paginatedProducts.length}</strong> sur <strong>{filteredProducts.length}</strong> articles
                    </span>
                  </div>
                )}
              </>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center' }}>Chargement de la collection...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
