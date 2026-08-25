'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore, getProductPrice } from '@/lib/store';

export default function FAQEditorial() {
  const { blogPosts, products, detectedLocationId } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const posts = useMemo(() => {
    return (blogPosts || []).filter(p => p.published !== false);
  }, [blogPosts]);

  // Auto-scroll loop when section is visible
  useEffect(() => {
    if (!posts || posts.length <= 1) return;
    const container = scrollRef.current;
    if (!container) return;

    let isVisible = false;
    let timer: NodeJS.Timeout | null = null;
    let direction = 1;
    const intervalTime = 3800;

    const autoScroll = () => {
      if (isPaused || !isVisible) return;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      let nextScroll = container.scrollLeft + 295 * direction;
      if (nextScroll >= maxScroll - 5) {
        nextScroll = maxScroll;
        direction = -1;
      } else if (nextScroll <= 5) {
        nextScroll = 0;
        direction = 1;
      }

      container.scrollTo({
        left: nextScroll,
        behavior: 'smooth'
      });
    };

    const startAutoplay = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(autoScroll, intervalTime);
    };

    const stopAutoplay = () => {
      if (timer) {
        clearInterval(timer);
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
      { threshold: 0.25 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      stopAutoplay();
    };
  }, [posts, isPaused]);

  if (!posts || posts.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -290 : 290,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section style={{ padding: '36px 0 48px 0', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
      <div className="container">
        
        {/* Sleek Minimalist Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '18px',
          gap: '12px'
        }}>
          <div>
            {/* Clickable Badge directly to /blog */}
            <Link 
              href="/blog" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: '#f1f5f9', 
                color: '#0f172a', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                marginBottom: '6px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: '1px solid #e2e8f0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0f172a';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
            >
              <span>BLOG</span>
              <span style={{ fontSize: '11px' }}>➔</span>
            </Link>

            <h2 style={{ fontSize: 'clamp(19px, 4.5vw, 24px)', fontWeight: 900, color: '#09090b', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Conseils de Style &amp; Culture
            </h2>
          </div>

          {/* Navigation Arrows Only */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Article précédent"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#09090b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 900,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Article suivant"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#09090b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 900,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              ›
            </button>
          </div>
        </div>

        {/* Responsive Horizontal Touch Scroll Cards on Mobile / 3-col on Desktop */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            padding: '4px 0 12px 0',
            scrollbarWidth: 'none'
          }}
        >
          {posts.map((post) => {
            const linkedProd = post.linkedProductIds && post.linkedProductIds.length > 0
              ? (products || []).find(p => p.id === post.linkedProductIds[0])
              : null;
            const priceInfo = linkedProd ? getProductPrice(linkedProd, detectedLocationId) : null;

            return (
              <article
                key={post.id}
                style={{
                  flex: '0 0 min(280px, 78vw)',
                  scrollSnapAlign: 'start',
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Cover Image Container */}
                <Link
                  href={`/blog/${post.slug}`}
                  style={{
                    position: 'relative',
                    height: '150px',
                    display: 'block',
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9'
                  }}
                >
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    loading="lazy"
                  />
                  
                  {/* Category Pill Tag */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: post.isFeatured ? '#ef4444' : 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 900,
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    padding: '2.5px 7px',
                    borderRadius: '10px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {post.isFeatured ? '⭐ À LA UNE' : post.category}
                  </div>

                  {/* Read Time Tag */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    ⏱️ {post.readTime}
                  </div>
                </Link>

                {/* Content Body */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  
                  <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#0f172a',
                      lineHeight: 1.35,
                      margin: '0 0 6px 0',
                      letterSpacing: '-0.2px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {post.title}
                    </h3>
                  </Link>

                  {/* Attached Product Tag */}
                  {linkedProd && priceInfo ? (
                    <Link
                      href={`/products/${linkedProd.slug || linkedProd.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        marginTop: 'auto',
                        marginBottom: '8px'
                      }}
                    >
                      {linkedProd.images?.[0] && (
                        <img
                          src={linkedProd.images[0]}
                          alt={linkedProd.name_fr}
                          style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                      )}
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {linkedProd.name_fr}
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#0284c7', flexShrink: 0 }}>
                        {priceInfo.formattedPrice}
                      </span>
                    </Link>
                  ) : (
                    <div style={{ marginTop: 'auto' }} />
                  )}

                  {/* Bottom Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '8px',
                    marginTop: linkedProd ? '0' : '8px'
                  }}>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      {post.publishedAt}
                    </span>

                    <Link
                      href={`/blog/${post.slug}`}
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#0284c7',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      Lire ➔
                    </Link>
                  </div>

                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}

