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
  const [activeHomeTab, setActiveHomeTab] = useState<'drops' | 'bestsellers' | 'sneakers' | 'streetwear' | 'deals'>('drops');
  const blogScrollRef = useRef<HTMLDivElement>(null);

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

  // Specific Category Slices for Carousels & Tabs (Curated selection of 6 items max)
  const dropsProducts = useMemo(() => products.filter(p => (p.isNew || p.badge === 'new' || p.badge === 'NEW') && (p.stock === undefined || p.stock > 0)).slice(0, 6), [products]);
  const bestsellersProducts = useMemo(() => products.filter(p => (p.isFeatured || p.rating >= 4.5) && (p.stock === undefined || p.stock > 0)).slice(0, 6), [products]);
  const sneakersProducts = useMemo(() => products.filter(p => p.category === 'shoes' && (p.stock === undefined || p.stock > 0)).slice(0, 6), [products]);
  const streetwearProducts = useMemo(() => products.filter(p => (p.category === 'clothing' || p.category === 'hats') && (p.stock === undefined || p.stock > 0)).slice(0, 6), [products]);
  const bagsProducts = useMemo(() => products.filter(p => p.category === 'bags' && (p.stock === undefined || p.stock > 0)).slice(0, 6), [products]);
  const accessoriesProducts = useMemo(() => products.filter(p => (p.category === 'accessories' || p.category === 'jewelry' || p.category === 'watches') && (p.stock === undefined || p.stock > 0)).slice(0, 6), [products]);
  const dealsProducts = useMemo(() => products.filter(p => p.comparePrice && p.comparePrice > p.price && (p.stock === undefined || p.stock > 0)).slice(0, 6), [products]);

  // Available tabs list: ONLY tabs that actually have products in the catalog
  const availableTabs = useMemo(() => {
    const list: { id: 'drops' | 'bestsellers' | 'sneakers' | 'streetwear' | 'deals'; label: string; count: number; items: typeof products }[] = [];
    if (dropsProducts.length > 0) list.push({ id: 'drops', label: 'Nouveautés Drops', count: dropsProducts.length, items: dropsProducts });
    if (bestsellersProducts.length > 0) list.push({ id: 'bestsellers', label: 'Tendances', count: bestsellersProducts.length, items: bestsellersProducts });
    if (sneakersProducts.length > 0) list.push({ id: 'sneakers', label: 'Sneakers', count: sneakersProducts.length, items: sneakersProducts });
    if (streetwearProducts.length > 0) list.push({ id: 'streetwear', label: 'Streetwear', count: streetwearProducts.length, items: streetwearProducts });
    if (dealsProducts.length > 0) list.push({ id: 'deals', label: 'Offres & Promos', count: dealsProducts.length, items: dealsProducts });
    return list;
  }, [dropsProducts, bestsellersProducts, sneakersProducts, streetwearProducts, dealsProducts]);

  // Ensure activeHomeTab is always one of the available tabs
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(t => t.id === activeHomeTab)) {
      setActiveHomeTab(availableTabs[0].id);
    }
  }, [availableTabs, activeHomeTab]);

  // Tabbed Products Selector (Strict filtering: never fallback to random products)
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
            id: 'tile_sneakers',
            categoryKey: 'shoes',
            title: 'SNEAKERS CULTURE',
            subtitle: 'Silhouettes rares & collaborations exclusives',
            image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=shoes',
            tag: 'TENDANCE',
          },
          {
            id: 'tile_streetwear',
            categoryKey: 'clothing',
            title: 'STREETWEAR & HOODIES',
            subtitle: 'Coupes oversize, vestes & pièces selects',
            image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=clothing',
            tag: 'NOUVEAU',
          },
          {
            id: 'tile_bags',
            categoryKey: 'bags',
            title: 'MAROQUINERIE DE LUXE',
            subtitle: 'Sacs en cuir véritable & sacs cabas',
            image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=bags',
            tag: 'PREMIUM',
          },
          {
            id: 'tile_jewelry',
            categoryKey: 'jewelry',
            title: 'JOAILLERIE & MONTRES',
            subtitle: 'Or massif 18k, argent 925 & chronographes',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=jewelry',
            tag: 'ÉLÉGANCE',
          },
          {
            id: 'tile_jersey',
            categoryKey: 'jersey',
            title: 'MAILLOTS & RÉTRO FOOT',
            subtitle: 'Équipe de France, éditions vintage & collectors',
            image: '/france_jersey_hero.jpg',
            link: '/products?search=jersey',
            tag: 'DROP SPÉCIAL',
          },
          {
            id: 'tile_accessories',
            categoryKey: 'accessories',
            title: 'ACCESSOIRES & CASQUETTES',
            subtitle: 'Lunettes UV, bobs & finitions stylisées',
            image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800&auto=format&fit=crop',
            link: '/products?category=accessories',
            tag: 'ESSENTIELS',
          }
        ];

    return baseTiles.map(tile => ({
      ...tile,
      hasItems: tile.categoryKey === 'jersey'
        ? products.some(p => (p.name_fr?.toLowerCase().includes('maillot') || p.name_fr?.toLowerCase().includes('jersey') || (p.description_fr || '').toLowerCase().includes('maillot')) && (p.stock === undefined || p.stock > 0))
        : products.some(p => (p.category === tile.categoryKey || (tile.categoryKey === 'clothing' && p.category === 'hats') || (tile.categoryKey === 'accessories' && (p.category === 'hats' || p.category === 'socks'))) && (p.stock === undefined || p.stock > 0))
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

      {/* 2. VIP Trust & Service Guarantees Bar (Desktop Only) */}
      <section className="desktop-only-trust-bar" style={{ background: '#09090b', color: '#ffffff', padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Expédition 48H Chrono</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Livraison suivie & sécurisée</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase' }}>100% Authentique</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Contrôlé par nos experts</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Paiement en 4X</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Sans frais supplémentaires</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Retours Non Acceptés</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Bien vérifier pointure &amp; modèle</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. VISUAL CATEGORY TILES (IMAGE-RICH GRID - ONLY DISPLAY NON-EMPTY CATEGORIES) */}
      {activeCategoryTiles.length > 0 && (
        <section style={{ padding: '60px 0', background: '#ffffff' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#0284c7', textTransform: 'uppercase' }}>UNIVERS DE LA MAISON</span>
              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#09090b', margin: '6px 0 0 0', letterSpacing: '-0.6px' }}>
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
        <section style={{ padding: '60px 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div className="container">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#0284c7', textTransform: 'uppercase' }}>SÉLECTION CURATÉE</span>
                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#09090b', margin: '4px 0 0 0', letterSpacing: '-0.6px' }}>
                  Les Pièces Incontournables
                </h2>
              </div>

              {/* Smooth Pill Switcher (Horizontal scrollable with smooth touch, no left-side cutoff) */}
              <div className="no-scrollbar" style={{ display: 'flex', justifyContent: 'flex-start', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '4px 0 12px 0', maxWidth: '100%' }}>
                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '5px', borderRadius: '30px', gap: '4px', flexShrink: 0 }}>
                  {availableTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveHomeTab(tab.id)}
                      role="tab"
                      aria-selected={activeHomeTab === tab.id}
                      aria-controls={`tabpanel-${tab.id}`}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '25px',
                        border: 'none',
                        background: activeHomeTab === tab.id ? '#09090b' : 'transparent',
                        color: activeHomeTab === tab.id ? '#ffffff' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.4px',
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

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link 
                href="/products" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 36px',
                  background: '#09090b',
                  color: '#ffffff',
                  borderRadius: '30px',
                  fontWeight: 800,
                  fontSize: '13px',
                  textDecoration: 'none',
                  letterSpacing: '0.5px',
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

      {/* 6. CURATED HORIZONTAL CAROUSELS (ONLY DISPLAY NON-EMPTY SECTIONS) */}
      {products.length > 0 && (
        <>
          {dropsProducts.length > 0 && (
            <ProductSlider title="NOUVEAUTÉS & DERNIERS DROPS" products={dropsProducts} categoryLink="/products?filter=new" />
          )}

          {sneakersProducts.length > 0 && (
            <ProductSlider title="SNEAKERS CULTURE" products={sneakersProducts} categoryLink="/products?category=shoes" />
          )}
        </>
      )}

      {/* 7. INSTAGRAM SOCIAL FEED & UGC */}
      <section style={{ padding: '70px 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#0284c7', textTransform: 'uppercase' }}>
              COMMUNAUTÉ INSTAGRAM
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#09090b', margin: '6px 0 8px 0', letterSpacing: '-0.6px' }}>
              Porté par la Communauté #AymardClub
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 20px 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
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
