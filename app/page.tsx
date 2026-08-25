'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroCarousel from '@/components/home/HeroCarousel';
import ProductSlider from '@/components/home/ProductSlider';
import ProductCard from '@/components/home/ProductCard';
import TrustpilotSlider from '@/components/home/TrustpilotSlider';
import FAQEditorial from '@/components/home/FAQEditorial';
import { useAppStore, getProductPrice } from '@/lib/store';
import { products as defaultProducts } from '@/lib/products-data';

export default function Home() {
  const { products: storeProducts, setProducts, homepageMedia, blogPosts, detectedLocationId } = useAppStore();
  const products = (storeProducts && storeProducts.length > 0) ? storeProducts : defaultProducts;
  const [activeHomeTab, setActiveHomeTab] = useState<'drops' | 'hats' | 'sneakers' | 'bestsellers' | 'watches' | 'deals'>('drops');
  const [isClient, setIsClient] = useState(false);
  const blogScrollRef = useRef<HTMLDivElement>(null);

  // Randomizer: Shuffled category slices generated on client visit
  const [randomSeed, setRandomSeed] = useState(0);

  useEffect(() => {
    setIsClient(true);
    // New random seed on every page visit / refresh
    setRandomSeed(Date.now());
  }, []);

  const scrollBlog = (direction: 'left' | 'right') => {
    if (blogScrollRef.current) {
      blogScrollRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    async function fetchServerProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (e) {
        console.error('Fetch products error:', e);
      }
    }

    fetchServerProducts();
  }, [setProducts]);

  // Helper shuffle function (Fisher-Yates)
  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Strict Category Slices with Automatic Shuffle on Each Visit
  const dropsProducts = useMemo(() => {
    const raw = products.filter(p => (p.isNew || p.badge === 'new' || p.badge === 'NEW' || p.isFeatured) && (p.stock === undefined || p.stock > 0));
    return (isClient ? shuffle(raw) : raw).slice(0, 8);
  }, [products, isClient, randomSeed]);

  const bestsellersProducts = useMemo(() => {
    const raw = products.filter(p => (p.isFeatured || p.rating >= 4.5) && (p.stock === undefined || p.stock > 0));
    return (isClient ? shuffle(raw) : raw).slice(0, 8);
  }, [products, isClient, randomSeed]);

  const sneakersProducts = useMemo(() => {
    const raw = products.filter(p => p.category === 'shoes' && (p.stock === undefined || p.stock > 0));
    return (isClient ? shuffle(raw) : raw).slice(0, 8);
  }, [products, isClient, randomSeed]);

  const hatsProducts = useMemo(() => {
    const raw = products.filter(p => p.category === 'hats' && (p.stock === undefined || p.stock > 0));
    return (isClient ? shuffle(raw) : raw).slice(0, 8);
  }, [products, isClient, randomSeed]);

  const watchesProducts = useMemo(() => {
    const raw = products.filter(p => (p.category === 'watches' || p.category === 'jewelry') && (p.stock === undefined || p.stock > 0));
    return (isClient ? shuffle(raw) : raw).slice(0, 8);
  }, [products, isClient, randomSeed]);

  const bagsProducts = useMemo(() => {
    const raw = products.filter(p => p.category === 'bags' && (p.stock === undefined || p.stock > 0));
    return (isClient ? shuffle(raw) : raw).slice(0, 8);
  }, [products, isClient, randomSeed]);

  const dealsProducts = useMemo(() => {
    const raw = products.filter(p => p.comparePrice && p.comparePrice > p.price && (p.stock === undefined || p.stock > 0));
    return (isClient ? shuffle(raw) : raw).slice(0, 8);
  }, [products, isClient, randomSeed]);

  // Available tabs list: Strict categories with real stock
  const availableTabs = useMemo(() => {
    const list: { id: 'drops' | 'hats' | 'sneakers' | 'bestsellers' | 'watches' | 'deals'; label: string; count: number; items: typeof products }[] = [];
    if (dropsProducts.length > 0) list.push({ id: 'drops', label: 'Nouveautés Drops', count: dropsProducts.length, items: dropsProducts });
    if (hatsProducts.length > 0) list.push({ id: 'hats', label: 'Casquettes & Headwear', count: hatsProducts.length, items: hatsProducts });
    if (sneakersProducts.length > 0) list.push({ id: 'sneakers', label: 'Sneakers Culture', count: sneakersProducts.length, items: sneakersProducts });
    if (bestsellersProducts.length > 0) list.push({ id: 'bestsellers', label: 'Tendances', count: bestsellersProducts.length, items: bestsellersProducts });
    if (watchesProducts.length > 0) list.push({ id: 'watches', label: 'Montres & Luxe', count: watchesProducts.length, items: watchesProducts });
    if (dealsProducts.length > 0) list.push({ id: 'deals', label: 'Offres & Promos', count: dealsProducts.length, items: dealsProducts });
    return list;
  }, [dropsProducts, hatsProducts, sneakersProducts, bestsellersProducts, watchesProducts, dealsProducts]);

  // Ensure activeHomeTab is always one of the available tabs
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(t => t.id === activeHomeTab)) {
      setActiveHomeTab(availableTabs[0].id);
    }
  }, [availableTabs, activeHomeTab]);

  // Tabbed Products Selector
  const tabbedProducts = useMemo(() => {
    const current = availableTabs.find(t => t.id === activeHomeTab);
    if (current) return current.items;
    if (availableTabs.length > 0) return availableTabs[0].items;
    return [];
  }, [availableTabs, activeHomeTab]);

  // Visual Category Tiles: Dynamic from admin dashboard
  const activeCategoryTiles = useMemo(() => {
    const baseTiles = (homepageMedia?.categoryTiles && homepageMedia.categoryTiles.length > 0) 
      ? homepageMedia.categoryTiles 
      : [
          {
            id: 'tile_hats',
            categoryKey: 'hats',
            title: 'CASQUETTES & HEADWEAR',
            subtitle: 'Fitted, snapbacks & bonnets haute couture',
            image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=hats',
            tag: 'POPULAIRE',
          },
          {
            id: 'tile_sneakers',
            categoryKey: 'shoes',
            title: 'SNEAKERS CULTURE',
            subtitle: 'Silhouettes rares & collaborations exclusives',
            image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=shoes',
            tag: 'TENDANCE',
          },
          {
            id: 'tile_watches',
            categoryKey: 'watches',
            title: 'HORLOGERIE & JOAILLERIE',
            subtitle: 'Montres automatiques & chronographes d\'exception',
            image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=watches',
            tag: 'PRESTIGE',
          },
          {
            id: 'tile_bags',
            categoryKey: 'bags',
            title: 'MAROQUINERIE & SACS',
            subtitle: 'Sacs cabas de luxe & maroquinerie de créateur',
            image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=bags',
            tag: 'PREMIUM',
          }
        ];

    return baseTiles.map(tile => ({
      ...tile,
      hasItems: products.some(p => p.category === tile.categoryKey && (p.stock === undefined || p.stock > 0))
    })).filter(tile => tile.hasItems);
  }, [products, homepageMedia?.categoryTiles]);

  // Blog Posts for Editorial Journal Section
  const homeBlogPosts = useMemo(() => {
    const published = (blogPosts || []).filter(p => p.published !== false);
    return published.slice(0, 6);
  }, [blogPosts]);

  // Community Instagram Photos from Store (Only authentic photos added via Admin)
  const communityPhotos = useMemo(() => {
    return (homepageMedia?.communityPhotos && homepageMedia.communityPhotos.length > 0)
      ? homepageMedia.communityPhotos.map(p => ({ img: p.image, user: p.user, tag: p.tag }))
      : [];
  }, [homepageMedia?.communityPhotos]);

  return (
    <>
      {/* 1. Hero Carousel Banner */}
      <HeroCarousel />

      {/* 2. VISUAL CATEGORY TILES (IMAGE-RICH GRID - ONLY DISPLAY NON-EMPTY CATEGORIES) */}
      {activeCategoryTiles.length > 0 && (
        <section style={{ padding: 'clamp(36px, 6vw, 60px) 0', background: '#ffffff' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: '#0284c7', textTransform: 'uppercase' }}>UNIVERS DE LA MAISON</span>
              <h2 style={{ fontSize: 'clamp(20px, 5.2vw, 26px)', fontWeight: 900, color: '#09090b', margin: '4px 0 0 0', letterSpacing: '-0.5px' }}>
                Explorez Nos Collections Exclusives
              </h2>
            </div>

            <div className="category-tiles-grid">
              {activeCategoryTiles.map((tile, idx) => (
                <Link 
                  key={idx} 
                  href={tile.link}
                  className="category-tile-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.transform = 'scale(1.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  {/* Background Image — Optimized with next/image */}
                  <Image 
                    src={tile.image} 
                    alt={tile.title} 
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 33vw"
                    style={{
                      objectFit: 'cover',
                      transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      zIndex: 1
                    }}
                    loading="lazy"
                  />

                  {/* Dark Gradient Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(180deg, rgba(9,9,11,0.1) 0%, rgba(9,9,11,0.85) 100%)',
                    zIndex: 2
                  }} />

                  {/* Tag */}
                  <span className="category-tile-tag" style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: '#09090b',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    zIndex: 3,
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    {tile.tag}
                  </span>

                  {/* Content */}
                  <div style={{ position: 'relative', zIndex: 3 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                      {tile.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 12px 0', lineHeight: 1.4 }}>
                      {tile.subtitle}
                    </p>
                    <span className="category-tile-cta" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#38bdf8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px'
                    }}>
                      <span>Découvrir</span>
                      <span>➔</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. INTERACTIVE TABBED PRODUCT SHOWCASE (ONLY ACTIVE TABS WITH REAL PRODUCTS) */}
      {availableTabs.length > 0 && (
        <section style={{ padding: 'clamp(36px, 6vw, 60px) 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div className="container">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: '#0284c7', textTransform: 'uppercase' }}>SÉLECTION CURATÉE</span>
                <h2 style={{ fontSize: 'clamp(20px, 5.2vw, 26px)', fontWeight: 900, color: '#09090b', margin: '4px 0 0 0', letterSpacing: '-0.5px' }}>
                  Les Pièces Incontournables
                </h2>
              </div>

              {/* Smooth Pill Switcher (Horizontal scrollable with smooth touch, no left-side cutoff) */}
              <div className="no-scrollbar" style={{ display: 'flex', justifyContent: 'flex-start', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '4px 0 8px 0', maxWidth: '100%' }}>
                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '30px', gap: '4px', flexShrink: 0 }}>
                  {availableTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveHomeTab(tab.id)}
                      role="tab"
                      aria-selected={activeHomeTab === tab.id}
                      aria-controls={`tabpanel-${tab.id}`}
                      style={{
                        padding: '7px 15px',
                        borderRadius: '25px',
                        border: 'none',
                        background: activeHomeTab === tab.id ? '#09090b' : 'transparent',
                        color: activeHomeTab === tab.id ? '#ffffff' : '#64748b',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid for the Active Tab */}
            {tabbedProducts.length > 0 && (
              <div role="tabpanel" id={`tabpanel-${activeHomeTab}`} aria-label={availableTabs.find(t => t.id === activeHomeTab)?.label} className="home-tabbed-grid">
                {tabbedProducts.map(p => (
                  <ProductCard 
                    key={p.id}
                    id={p.id}
                    name={p.name_fr}
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

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Link 
                href="/products" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 30px',
                  background: '#09090b',
                  color: '#ffffff',
                  borderRadius: '30px',
                  fontWeight: 800,
                  fontSize: '12px',
                  textDecoration: 'none',
                  letterSpacing: '0.4px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}
              >
                <span>Voir l&apos;ensemble du catalogue ({products.length} articles)</span>
                <span>➔</span>
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* 5. LE JOURNAL & MAGAZINE EDITORIAL (CONNECTÉ CMS) */}
      <FAQEditorial />

      {/* 6. CURATED HORIZONTAL CAROUSELS (SHUFFLED ON EACH VISIT) */}
      {products.length > 0 && (
        <>
          {hatsProducts.length > 0 && (
            <ProductSlider title="CASQUETTES & HEADWEAR DE LUXE" products={hatsProducts} categoryLink="/products?category=hats" />
          )}

          {sneakersProducts.length > 0 && (
            <ProductSlider title="SNEAKERS CULTURE" products={sneakersProducts} categoryLink="/products?category=shoes" />
          )}

          {dropsProducts.length > 0 && (
            <ProductSlider title="NOUVEAUTÉS & DERNIERS DROPS" products={dropsProducts} categoryLink="/products?filter=new" />
          )}

          {watchesProducts.length > 0 && (
            <ProductSlider title="HORLOGERIE & MONTRES D'EXCEPTION" products={watchesProducts} categoryLink="/products?category=watches" />
          )}
        </>
      )}

      {/* 7. INSTAGRAM SOCIAL FEED & UGC */}
      <section style={{ padding: 'clamp(36px, 6vw, 60px) 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: '#0284c7', textTransform: 'uppercase' }}>
              COMMUNAUTÉ INSTAGRAM
            </span>
            <h2 style={{ fontSize: 'clamp(20px, 5.2vw, 26px)', fontWeight: 900, color: '#09090b', margin: '4px 0 6px 0', letterSpacing: '-0.5px' }}>
              Porté par la Communauté #AymardClub
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              Taguez <a href="https://www.instagram.com/aymar_store3" target="_blank" rel="noopener noreferrer" style={{ color: '#09090b', fontWeight: 800, textDecoration: 'underline' }}>@aymar_store3</a> sur vos meilleurs looks pour être mis à l&apos;honneur.
            </p>
            <a 
              href="https://www.instagram.com/aymar_store3" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                color: '#ffffff',
                padding: '11px 24px',
                borderRadius: '30px',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(220, 39, 67, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              <span>Rejoindre @aymar_store3</span>
            </a>
          </div>

          {communityPhotos.length > 0 ? (
            <div className="instagram-community-grid">
              {communityPhotos.map((item, idx) => (
                <a
                  key={idx}
                  href="https://www.instagram.com/aymar_store3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="instagram-community-card"
                  style={{
                    position: 'relative',
                    aspectRatio: '4/5',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    display: 'block',
                    textDecoration: 'none',
                    background: '#e2e8f0'
                  }}
                >
                  <Image 
                    src={item.img} 
                    alt={item.user} 
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    className="instagram-photo-img"
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(9,9,11,0.85) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '14px',
                    color: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/></svg>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>{item.user}</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{item.tag}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px 24px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              maxWidth: '640px',
              margin: '0 auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📸</div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#09090b', margin: '0 0 6px 0' }}>
                Faites partie de la galerie #AymardClub
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                Recevez votre commande, prenez votre plus beau selfie ou photo de votre look, et mentionnez <strong>@aymar_store3</strong> en story ou post pour être affiché ici.
              </p>
              <a
                href="https://www.instagram.com/aymar_store3"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#09090b',
                  color: '#ffffff',
                  padding: '10px 22px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  textDecoration: 'none'
                }}
              >
                <span>Partager mon look</span>
                <span>➔</span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 8. Trustpilot Reviews Slider */}
      <TrustpilotSlider />
    </>
  );
}
