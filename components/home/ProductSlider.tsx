'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/products-data';
import { useAppStore, convertPrice, formatPrice, getProductPrice } from '@/lib/store';

interface ProductSliderProps {
  title: string;
  products: Product[];
  categoryLink?: string;
  maxItems?: number;
}

export default function ProductSlider({ title, products, categoryLink, maxItems = 10 }: ProductSliderProps) {
  const { currency, detectedLocationId } = useAppStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);

  // Auto-scroll loop on mobile when section is visible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only auto-scroll on screens <= 768px (mobile & tablet)
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let isVisible = false;
    let timer: NodeJS.Timeout | null = null;
    let direction = 1; // 1 = right, -1 = left
    const intervalTime = 3500; // auto-scroll every 3.5s

    const autoScroll = () => {
      if (isDown.current || !isVisible) return;

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (maxScrollLeft <= 0) return;

      let newScroll = container.scrollLeft + 280 * direction;

      if (newScroll >= maxScrollLeft) {
        newScroll = maxScrollLeft;
        direction = -1;
      } else if (newScroll <= 0) {
        newScroll = 0;
        direction = 1;
      }

      container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    };

    const startAutoplay = () => {
      stopAutoplay();
      timer = setTimeout(() => {
        autoScroll();
        timer = setInterval(autoScroll, intervalTime);
      }, 1500);
    };

    const stopAutoplay = () => {
      if (timer) {
        clearTimeout(timer);
        clearInterval(timer as any);
        timer = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      stopAutoplay();
    };
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDown.current = true;
    scrollContainerRef.current.classList.add('grabbing');
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftState.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('grabbing');
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('grabbing');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState.current - walk;
  };

  if (!products || products.length === 0) return null;

  // Render max 10 products per carousel for lightning-fast performance
  const displayedProducts = products.slice(0, maxItems);

  return (
    <section className="product-slider-section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="slider-title" style={{ margin: 0 }}>{title}</h2>
          <Link 
            href={categoryLink || '/products'} 
            style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: '#0284c7', 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Voir tout</span>
            <span>➔</span>
          </Link>
        </div>

        <div className="slider-wrapper">
          <button className="slider-arrow arrow-left" onClick={scrollLeft} aria-label="Scroll left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          
          <div 
            className="slider-container" 
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {displayedProducts.map((product) => {
              const showStartingFrom = product.category === 'shoes';
              const priceInfo = getProductPrice(product, detectedLocationId);
              
              return (
                <div key={product.id} className="slider-card">
                  <Link href={`/products/${product.slug}`} className="slider-card-image-link">
                    <div className="slider-card-image-wrapper">
                      {/* Badge Top Left */}
                      {product.badge && (
                        <span className="slider-card-badge">{product.badge}</span>
                      )}
                      
                      {/* Delivery Top Right */}
                      {product.delivery48H && (
                        <span className="slider-card-delivery">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:'2px'}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          48H
                        </span>
                      )}
                      
                      {/* Image — Optimized with next/image */}
                      <Image 
                        src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'} 
                        alt={product.name_fr} 
                        fill
                        sizes="(max-width: 768px) 165px, 260px"
                        className={`slider-card-img ${showStartingFrom ? 'shoe-img' : ''}`}
                        style={{ objectFit: 'contain' }}
                        loading="lazy"
                      />

                      {/* Quick Add Hover Button */}
                      <div className="slider-card-quick-add">
                        Achat Rapide
                      </div>
                    </div>
                  </Link>
                  
                  <div className="slider-card-info">
                    {product.brand && (
                      <span className="slider-card-brand">{product.brand}</span>
                    )}

                    {/* Social Proof Stars (only if reviews exist) */}
                    {product.reviewCount > 0 && (
                      <div className="slider-card-rating">
                        <span className="stars">★★★★★</span>
                        <span className="rating-num">{product.rating.toFixed(1)}</span>
                      </div>
                    )}

                    <h3 className="slider-card-name">
                      <Link href={`/products/${product.slug}`}>{product.name_fr}</Link>
                    </h3>
                    <div className="slider-card-price">
                      {showStartingFrom ? (
                        <span className="price-start-label">à partir de </span>
                      ) : null}
                      <span className="price-current">{priceInfo.formattedPrice}</span>
                      {priceInfo.formattedComparePrice && (
                        <span className="price-compare">{priceInfo.formattedComparePrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button className="slider-arrow arrow-right" onClick={scrollRight} aria-label="Scroll right">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
