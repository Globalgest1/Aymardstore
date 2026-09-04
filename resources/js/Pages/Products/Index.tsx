import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from '@/lib/compat-navigation';
import { useAppStore, getProductPrice, getActiveLocation } from '@/lib/store';
import { products as defaultProducts } from '@/lib/products-data';
import { useTranslation } from '@/lib/i18n';
import ProductCard from '@/Components/home/ProductCard';
import Image from '@/lib/compat-image';
import AppLayout from '@/Layouts/AppLayout';
import { useThemeMode } from '@/lib/useThemeMode';

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

interface ProductsIndexProps {
  initialProducts?: any[];
  filters?: {
    category?: string;
    filter?: string;
    search?: string;
  };
}

function ProductsContent({ initialProducts, filters }: ProductsIndexProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDarkMode = useThemeMode();
  const { language, products: storeProducts, setProducts, detectedLocationId } = useAppStore();
  
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts, setProducts]);

  const products = (storeProducts && storeProducts.length > 0) 
    ? storeProducts 
    : (initialProducts && initialProducts.length > 0 ? initialProducts : defaultProducts);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const activeVisualCategoryTabs = useMemo(() => {
    return visualCategoryTabs.filter(tab => products.some((p: any) => p.category === tab.id));
  }, [products]);

  const categoryParam = (typeof filters?.category === 'string' ? filters.category : searchParams.get('category')) || '';
  const filterParam = (typeof filters?.filter === 'string' ? filters.filter : searchParams.get('filter')) || '';
  const searchParam = (typeof filters?.search === 'string' ? filters.search : searchParams.get('search')) || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedFilter, setSelectedFilter] = useState<string>(filterParam);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [sortBy, setSortBy] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const PAGE_SIZE = 16;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setSelectedFilter(filterParam);
  }, [filterParam]);

  useEffect(() => {
    setSearchQuery(searchParam);
  }, [searchParam]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedFilter, searchQuery, sortBy, onlyInStock]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p: any) => {
        if (selectedCategory && p.category !== selectedCategory) return false;
        
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = (p[`name_${language}`] || p.name_fr || '').toLowerCase();
          const desc = (p[`description_${language}`] || p.description_fr || '').toLowerCase();
          const brand = (p.brand || '').toLowerCase();
          if (!name.includes(q) && !desc.includes(q) && !brand.includes(q)) return false;
        }

        if (selectedFilter === 'deals' && !p.comparePrice && !p.compare_price) return false;
        if (selectedFilter === 'new' && !p.isNew && !p.is_new && p.badge !== 'new' && p.badge !== 'NEW') return false;

        if (onlyInStock && p.stock <= 0) return false;

        return true;
      })
      .sort((a: any, b: any) => {
        const pInfoA = getProductPrice(a, detectedLocationId);
        const pInfoB = getProductPrice(b, detectedLocationId);
        if (sortBy === 'price-asc') return pInfoA.price - pInfoB.price;
        if (sortBy === 'price-desc') return pInfoB.price - pInfoA.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return ((b.isFeatured || b.is_featured) ? 1 : 0) - ((a.isFeatured || a.is_featured) ? 1 : 0);
      });
  }, [selectedCategory, selectedFilter, searchQuery, sortBy, onlyInStock, language, products, detectedLocationId]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const getProductName = (p: any) => {
    if (language === 'en') return p.name_en || p.name_fr;
    if (language === 'es') return p.name_es || p.name_fr;
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
              Découvrez l'intégralité de nos sneakers rares, pièces streetwear, maroquinerie et joaillerie.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Category Tabs - Fixed/Sticky beneath header on scroll */}
      <div className="catalog-category-bar">
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
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '30px',
                border: selectedCategory === '' 
                  ? (isDarkMode ? '2px solid #ffffff' : '2px solid #09090b') 
                  : (isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1'),
                background: selectedCategory === '' 
                  ? (isDarkMode ? '#ffffff' : '#09090b') 
                  : (isDarkMode ? '#18181b' : '#ffffff'),
                color: selectedCategory === '' 
                  ? (isDarkMode ? '#09090b' : '#ffffff') 
                  : (isDarkMode ? '#f4f4f5' : '#0f172a'),
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
                    border: isSelected 
                      ? (isDarkMode ? '2px solid #ffffff' : '2px solid #09090b') 
                      : (isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0'),
                    background: isSelected 
                      ? (isDarkMode ? '#ffffff' : '#09090b') 
                      : (isDarkMode ? '#18181b' : '#ffffff'),
                    color: isSelected 
                      ? (isDarkMode ? '#09090b' : '#ffffff') 
                      : (isDarkMode ? '#f4f4f5' : '#0f172a'),
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
          
          {/* Left Sidebar Filters */}
          <aside className="products-sidebar-desktop">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="products-sidebar-title" style={{ fontSize: '15px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0 }}>Filtres</h3>
              {(selectedCategory || selectedFilter || searchQuery || onlyInStock) && (
                <button 
                  onClick={handleClearAllFilters}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <div>
              <div className="products-sidebar-subtitle" style={{ fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                Sélections Spéciales
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setSelectedFilter(selectedFilter === 'new' ? '' : 'new')}
                  className={`products-sidebar-option ${selectedFilter === 'new' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: selectedFilter === 'new' 
                      ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#f1f5f9') 
                      : 'transparent',
                    color: selectedFilter === 'new' 
                      ? (isDarkMode ? '#ffffff' : '#09090b') 
                      : (isDarkMode ? '#cbd5e1' : '#475569'),
                    fontWeight: selectedFilter === 'new' ? 800 : 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>Nouveaux Drops</span>
                  <span style={{ fontSize: '10px', background: isDarkMode ? '#ffffff' : '#09090b', color: isDarkMode ? '#09090b' : '#fff', padding: '2px 6px', borderRadius: '8px', fontWeight: 700 }}>NEW</span>
                </button>

                <button
                  onClick={() => setSelectedFilter(selectedFilter === 'deals' ? '' : 'deals')}
                  className={`products-sidebar-option ${selectedFilter === 'deals' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: selectedFilter === 'deals' 
                      ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#f1f5f9') 
                      : 'transparent',
                    color: selectedFilter === 'deals' 
                      ? (isDarkMode ? '#ffffff' : '#09090b') 
                      : (isDarkMode ? '#cbd5e1' : '#475569'),
                    fontWeight: selectedFilter === 'deals' ? 800 : 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>Offres & Promotions</span>
                  <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '8px', fontWeight: 700 }}>PROMO</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="stockCheck" 
                checked={onlyInStock} 
                onChange={e => setOnlyInStock(e.target.checked)} 
                style={{ accentColor: isDarkMode ? '#38bdf8' : '#09090b', cursor: 'pointer' }}
              />
              <label 
                htmlFor="stockCheck" 
                className="products-sidebar-label"
                style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a', cursor: 'pointer' }}
              >
                Uniquement en stock
              </label>
            </div>
          </aside>

          {/* Right Products Content */}
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            
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

            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#09090b', margin: '0 0 6px 0' }}>Aucun produit ne correspond à vos filtres</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Essayez d'élargir vos critères ou de réinitialiser la recherche.</p>
                <button onClick={handleClearAllFilters} style={{ padding: '10px 22px', background: '#09090b', color: '#ffffff', border: 'none', borderRadius: '25px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  Tout réinitialiser
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid-catalog">
                  {paginatedProducts.map((p: any) => (
                    <ProductCard 
                      key={p.id}
                      id={p.id}
                      name={getProductName(p)}
                      slug={p.slug}
                      price={p.price}
                      comparePrice={p.comparePrice || p.compare_price}
                      image={Array.isArray(p.images) ? p.images[0] : p.images}
                      rating={p.rating}
                      reviewCount={p.reviewCount || p.review_count}
                      badge={p.badge}
                      stock={p.stock}
                    />
                  ))}
                </div>

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
                      <span>Voir plus d'articles</span>
                      <span style={{ fontSize: '11px', opacity: 0.85 }}>({Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)} restants)</span>
                    </button>
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

export default function ProductsPage(props: ProductsIndexProps) {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center' }}>Chargement de la collection...</div>}>
        <ProductsContent {...props} />
      </Suspense>
    </AppLayout>
  );
}
